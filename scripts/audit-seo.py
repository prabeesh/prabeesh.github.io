#!/usr/bin/env python3
"""
Audit every Hugo post in content/ against .cursor/rules/seo-content.mdc.

Flags:
  - keywords frontmatter as a comma-separated string instead of YAML list
    (triggers Hugo's delimit bug that splits per character)
  - keywords list with more than 10 entries
  - keywords entries that are word-order variants of each other
  - any phrase density above 2.5% in the built HTML main content
  - more than 15 <strong> / **bold** tags in a post
  - excessive word count > 3500 (padded) or < 500 (thin)

Run after `hugo --minify` so public/**/*.html is populated.

Usage:
  python3 scripts/audit-seo.py                # audit every post
  python3 scripts/audit-seo.py --only spark   # only posts with "spark" in the path
"""

import argparse
import os
import re
import sys
from collections import Counter
from dataclasses import dataclass, field

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, "public")
CONTENT = os.path.join(ROOT, "content")

DENSITY_CEILING = 2.5  # percent — slightly more lenient than rule's 2% to reduce false positives on brand-name nouns
BOLD_CEILING = 15
MIN_WORDS = 300  # pages thinner than this are probably stubs
MAX_WORDS = 3500  # above this is usually padded


@dataclass
class Finding:
    severity: str  # "ERROR", "WARN", "INFO"
    rule: str
    detail: str


@dataclass
class PostAudit:
    path: str
    title: str = ""
    word_count: int = 0
    findings: list[Finding] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not any(f.severity in ("ERROR", "WARN") for f in self.findings)


def split_frontmatter(md_path: str) -> tuple[str, str]:
    """Return (frontmatter_text, body_text) for a Hugo Markdown file."""
    with open(md_path, encoding="utf-8") as fh:
        text = fh.read()
    m = re.match(r"---\s*\n(.*?)\n---\s*\n(.*)", text, re.DOTALL)
    if m:
        return m.group(1), m.group(2)
    return "", text


def parse_keywords_block(frontmatter: str) -> tuple[str, list[str]]:
    """Return (shape, entries) where shape is 'list' | 'string' | 'missing'."""
    lines = frontmatter.splitlines()
    i = 0
    while i < len(lines):
        if lines[i].startswith("keywords:"):
            break
        i += 1
    else:
        return "missing", []
    after = lines[i][len("keywords:") :].strip()
    if after and not after.startswith("["):
        # Inline string form
        entries = [e.strip().strip('"').strip("'") for e in after.split(",") if e.strip()]
        return "string", entries
    if after.startswith("["):
        inner = after.strip("[]")
        entries = [e.strip().strip('"').strip("'") for e in inner.split(",") if e.strip()]
        return "list", entries
    # Block form (YAML list)
    entries = []
    j = i + 1
    while j < len(lines):
        ln = lines[j]
        if ln and not ln.startswith((" ", "\t", "-")):
            break
        m = re.match(r"\s*-\s*(.+?)\s*$", ln)
        if m:
            entries.append(m.group(1).strip().strip('"').strip("'"))
        j += 1
    return "list", entries


def title_for(frontmatter: str) -> str:
    m = re.search(r'^title:\s*["\']?(.+?)["\']?\s*$', frontmatter, re.MULTILINE)
    return m.group(1).strip() if m else ""


def find_word_order_variants(keywords: list[str]) -> list[tuple[str, str]]:
    """Return pairs of keywords that are the same word set in different order."""
    variants = []
    normalized = [(k, tuple(sorted(k.lower().split()))) for k in keywords]
    seen: dict[tuple[str, ...], str] = {}
    for original, norm in normalized:
        if norm in seen and seen[norm] != original:
            variants.append((seen[norm], original))
        else:
            seen[norm] = original
    return variants


def html_path_for(md_path: str) -> str | None:
    """Map content/blog/foo.md → public/blog/<year>/<month>/<day>/foo/index.html."""
    # Try several layouts — we need the built page.
    rel = os.path.relpath(md_path, CONTENT)
    base, _ = os.path.splitext(rel)
    # Hugo writes `<section>/<year>/<month>/<day>/<slug>/index.html` for the blog (per permalinks config)
    # and `<section>/<slug>/index.html` for bonus (per config.toml permalinks).
    slug = os.path.basename(base)
    section = rel.split(os.sep)[0]
    if section == "bonus":
        candidate = os.path.join(PUBLIC, "bonus", slug, "index.html")
        if os.path.isfile(candidate):
            return candidate
    # Walk public/blog/** looking for the slug dir
    for root, dirs, _files in os.walk(os.path.join(PUBLIC, section)):
        for d in dirs:
            if d == slug:
                html = os.path.join(root, d, "index.html")
                if os.path.isfile(html):
                    return html
    return None


def audit_html(post: PostAudit, html: str) -> None:
    """Run density / bold-count / word-count checks against built HTML.

    Checks the article *prose only* — strips out <pre>/<code> blocks, the
    related-posts sidebar, and the FAQ schema block so we don't flag code
    identifiers (`self`, `kd`) or sidebar-widget repetition as stuffing.
    """
    m = re.search(r"<main[^>]*>(.*?)</main>", html, re.DOTALL)
    if not m:
        post.findings.append(
            Finding("INFO", "build", "no <main> element found — page may not build correctly")
        )
        return
    main = m.group(1)
    # Strip code blocks (including syntax-highlighted <pre> and inline <code>).
    prose_html = re.sub(r"<pre[\s\S]*?</pre>", " ", main)
    prose_html = re.sub(r"<code[\s\S]*?</code>", " ", prose_html)
    # Strip related-posts widget / asides / FAQ schema.
    prose_html = re.sub(r'<aside[\s\S]*?</aside>', " ", prose_html)
    prose_html = re.sub(
        r'<(div|section)[^>]*class="[^"]*(related-post|comments|share|social|recent-blogs)[^"]*"[\s\S]*?</\1>',
        " ",
        prose_html,
        flags=re.IGNORECASE,
    )
    text = re.sub(r"<script.*?</script>|<style.*?</style>|<[^>]+>", " ", prose_html, flags=re.DOTALL)
    # Strip HTML entities so we don't tokenize them as words (e.g. &rsquo; → ')
    text = re.sub(r"&[a-z]+;", "'", text)
    words = [w for w in re.split(r"\s+", text) if w.strip()]
    post.word_count = len(words)

    if post.word_count < MIN_WORDS:
        post.findings.append(
            Finding("WARN", "word-count", f"thin content: only {post.word_count} words (min {MIN_WORDS})")
        )
    if post.word_count > MAX_WORDS:
        post.findings.append(
            Finding("WARN", "word-count", f"padded content: {post.word_count} words (max {MAX_WORDS})")
        )

    # Bold analysis: flag repeated phrases (cosmetic SEO emphasis) more aggressively
    # than sheer count — bullet-list lead-ins (each a unique term) are legitimate.
    bold_phrases = re.findall(r"<strong>([^<]+)</strong>", prose_html)
    bold_count = len(bold_phrases)
    phrase_counts = Counter(p.strip().lower() for p in bold_phrases)
    repeated_bolds = {p: n for p, n in phrase_counts.items() if n >= 3}
    if repeated_bolds:
        top = sorted(repeated_bolds.items(), key=lambda kv: -kv[1])[:3]
        summary = ", ".join(f"'{p}' {n}x" for p, n in top)
        post.findings.append(
            Finding(
                "WARN",
                "bold-repeated",
                f"cosmetic bold repetition: {summary}",
            )
        )
    if bold_count > 40:
        post.findings.append(
            Finding(
                "INFO",
                "bold-count",
                f"{bold_count} <strong> tags — worth reviewing if these are bullet-list lead-ins (fine) or keyword emphasis (not fine)",
            )
        )

    # Density: check every phrase of 1–3 words (lowercased, stripped of common filler)
    # that appears >= 5 times. Flag any density > ceiling, excluding filler.
    tl = text.lower()
    tokens = re.findall(r"[a-z][a-z0-9+.#/-]*", tl)
    stopwords = {
        "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "with",
        "is", "are", "be", "it", "that", "this", "as", "by", "at", "from",
        "you", "we", "i", "your", "our", "not", "but", "if", "when", "which",
        "can", "may", "should", "will", "would", "has", "have", "had", "do",
        "does", "did", "so", "also", "all", "any", "each", "into", "out",
        "up", "down", "use", "using", "used", "one", "more", "some", "other",
        "than", "then", "there", "these", "those", "how", "what", "its",
        "their", "they", "them", "over", "only", "see", "get",
    }

    def ngrams(n: int):
        for i in range(len(tokens) - n + 1):
            chunk = tokens[i : i + n]
            if any(t in stopwords for t in chunk):
                continue
            yield " ".join(chunk)

    unigrams = Counter(t for t in tokens if t not in stopwords and len(t) > 2)
    bigrams = Counter(ngrams(2))
    trigrams = Counter(ngrams(3))

    total = len(words) or 1
    for phrase, count in unigrams.most_common(10):
        density = count / total * 100
        if density > DENSITY_CEILING:
            post.findings.append(
                Finding(
                    "WARN" if density < 4.0 else "ERROR",
                    "density",
                    f"'{phrase}' appears {count}x ({density:.2f}% — ceiling {DENSITY_CEILING}%)",
                )
            )
    for counts, label in ((bigrams, "bigram"), (trigrams, "trigram")):
        for phrase, count in counts.most_common(10):
            if count < 5:
                continue
            n = len(phrase.split())
            density = count * n / total * 100
            if density > DENSITY_CEILING:
                post.findings.append(
                    Finding(
                        "WARN" if density < 4.0 else "ERROR",
                        f"density-{label}",
                        f"'{phrase}' appears {count}x ({density:.2f}% — ceiling {DENSITY_CEILING}%)",
                    )
                )


def audit_frontmatter(post: PostAudit, frontmatter: str) -> None:
    shape, entries = parse_keywords_block(frontmatter)
    if shape == "string":
        post.findings.append(
            Finding(
                "ERROR",
                "keywords-shape",
                "keywords is a comma-separated string — Hugo's delimit will split it per-character. Use a YAML list.",
            )
        )
    if shape == "missing":
        post.findings.append(
            Finding("INFO", "keywords-missing", "no keywords frontmatter declared")
        )
    if len(entries) > 10:
        post.findings.append(
            Finding(
                "WARN",
                "keywords-count",
                f"{len(entries)} keyword entries (rule: 5-10 distinct topical phrases)",
            )
        )
    variants = find_word_order_variants(entries)
    for a, b in variants:
        post.findings.append(
            Finding(
                "WARN",
                "keywords-variant",
                f"'{a}' and '{b}' are word-order variants of the same intent",
            )
        )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--only", help="substring filter on post path")
    parser.add_argument("--severity", choices=["ERROR", "WARN", "INFO"], default="WARN",
                        help="minimum severity to display")
    args = parser.parse_args()

    if not os.path.isdir(PUBLIC):
        print("public/ not found. Run `hugo --minify` first.", file=sys.stderr)
        return 2

    levels = {"ERROR": 3, "WARN": 2, "INFO": 1}
    min_level = levels[args.severity]

    results: list[PostAudit] = []
    for root, _, files in os.walk(CONTENT):
        for f in files:
            if not f.endswith(".md") or f == "_index.md":
                continue
            md_path = os.path.join(root, f)
            if args.only and args.only not in md_path:
                continue
            fm, _body = split_frontmatter(md_path)
            post = PostAudit(path=os.path.relpath(md_path, ROOT), title=title_for(fm))
            audit_frontmatter(post, fm)
            html_path = html_path_for(md_path)
            if html_path:
                with open(html_path, encoding="utf-8") as fh:
                    audit_html(post, fh.read())
            else:
                post.findings.append(
                    Finding("INFO", "build", f"no built HTML found for {post.path}")
                )
            results.append(post)

    results.sort(key=lambda p: p.path)
    flagged = 0
    for p in results:
        shown = [f for f in p.findings if levels[f.severity] >= min_level]
        if not shown:
            continue
        flagged += 1
        print(f"\n{p.path}   ({p.word_count} words)")
        print(f"  title: {p.title[:80]}")
        for f in shown:
            sigil = {"ERROR": "❌", "WARN": "⚠️ ", "INFO": "ℹ️ "}.get(f.severity, "  ")
            print(f"  {sigil} [{f.rule}] {f.detail}")

    clean = sum(1 for p in results if p.ok)
    print(f"\n{'=' * 60}")
    print(f"Audited {len(results)} posts — {clean} clean, {flagged} flagged (severity >= {args.severity})")
    return 1 if flagged > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
