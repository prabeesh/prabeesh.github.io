#!/usr/bin/env python3
"""
Prune _tachyons.css down to only the classes actually used in the built site.

Tachyons ships ~75 KB of utility CSS, but we use <200 classes. This script:
  1. Walks public/**/*.html and collects every class used in HTML.
  2. Parses themes/ananke/assets/ananke/css/_tachyons.css as a list of rules.
  3. Keeps only rules where at least one class selector matches a used class.
  4. Keeps non-class rules (element selectors like html, body, a, img, etc.)
     and @media wrappers (with their inner rules pruned recursively).
  5. Writes the result to assets/ananke/css/_tachyons.css, which Hugo
     uses instead of the theme's copy.

Run after a `hugo --minify` build so public/ is populated.
"""

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, "public")
THEME_CSS = os.path.join(
    ROOT, "themes", "ananke", "assets", "ananke", "css", "_tachyons.css"
)
OUT = os.path.join(ROOT, "assets", "ananke", "css", "_tachyons.css")


def collect_used_classes() -> set[str]:
    used = set()
    class_re = re.compile(r'class="([^"]*)"')
    for root, _, files in os.walk(PUBLIC):
        for f in files:
            if not f.endswith(".html"):
                continue
            try:
                with open(os.path.join(root, f), encoding="utf-8") as fh:
                    data = fh.read()
            except OSError:
                continue
            for m in class_re.finditer(data):
                for c in m.group(1).split():
                    used.add(c)
    return used


def strip_comments(css: str) -> str:
    """Remove /* ... */ block comments from CSS."""
    return re.sub(r"/\*.*?\*/", "", css, flags=re.DOTALL)


def split_rules(css: str) -> list[str]:
    """Split CSS into top-level rules/at-rules without parsing declarations."""
    rules = []
    depth = 0
    start = 0
    in_string = None
    i = 0
    n = len(css)
    while i < n:
        ch = css[i]
        if in_string:
            if ch == "\\":
                i += 2
                continue
            if ch == in_string:
                in_string = None
        elif ch in ('"', "'"):
            in_string = ch
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                rules.append(css[start : i + 1])
                start = i + 1
        i += 1
    tail = css[start:].strip()
    if tail:
        rules.append(tail)
    return rules


CLASS_IN_SELECTOR_RE = re.compile(r"\.([A-Za-z_][\w-]*)")


def rule_matches(selector_group: str, used: set[str]) -> bool:
    """Decide if a comma-separated selector group should be kept."""
    keep_selectors = []
    for sel in selector_group.split(","):
        sel = sel.strip()
        if not sel:
            continue
        classes = CLASS_IN_SELECTOR_RE.findall(sel)
        if not classes:
            # element/attribute selector (html, body, a, img, etc.) — keep.
            keep_selectors.append(sel)
            continue
        if all(c in used for c in classes):
            keep_selectors.append(sel)
    if keep_selectors:
        return ", ".join(keep_selectors)
    return ""


def prune_block(css: str, used: set[str]) -> str:
    """Recursively prune a block of CSS."""
    out = []
    for rule in split_rules(css):
        r = rule.strip()
        if not r:
            continue
        if r.startswith("@media") or r.startswith("@supports"):
            # @media at-rule: prune inner block, drop whole at-rule if empty.
            brace = r.index("{")
            prelude = r[:brace].strip()
            inner = r[brace + 1 : r.rindex("}")]
            pruned_inner = prune_block(inner, used)
            if pruned_inner.strip():
                out.append(prelude + "{" + pruned_inner + "}")
        elif r.startswith("@"):
            # Keep other at-rules (charset, import, keyframes, etc.)
            out.append(r)
        else:
            # Regular rule: selector { decls }
            brace = r.index("{")
            selector = r[:brace].strip()
            body = r[brace:]  # includes braces
            kept_sel = rule_matches(selector, used)
            if kept_sel:
                out.append(kept_sel + body)
    return "".join(out)


def main() -> int:
    if not os.path.isdir(PUBLIC):
        print(
            "public/ not found. Run `hugo --minify` first so HTML output exists.",
            file=sys.stderr,
        )
        return 1
    if not os.path.isfile(THEME_CSS):
        print(f"theme file missing: {THEME_CSS}", file=sys.stderr)
        return 1

    used = collect_used_classes()
    print(f"Collected {len(used)} unique classes from public/ HTML")

    with open(THEME_CSS, encoding="utf-8") as fh:
        css = fh.read()

    original = len(css)
    css = strip_comments(css)
    pruned = prune_block(css, used)
    # Preserve the normalize.css reset at the top by also matching element selectors
    # (the prune step already keeps those), so no extra work needed.

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    header = (
        "/*! Pruned Tachyons — only classes used by this Hugo site. "
        "Regenerate via scripts/prune-tachyons.py after HTML layout changes. */\n"
    )
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(header + pruned)
    new = len(pruned)
    print(f"Wrote {OUT}")
    print(f"Size: {original} -> {new} bytes ({100 * new / original:.1f}% of original)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
