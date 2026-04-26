const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const SITE_URL = 'https://blog.prabeeshk.com';

function getPostsFromDirectory(dirPath, baseUrl) {
  const files = fs.readdirSync(dirPath);

  return files
    .filter(file => file.endsWith('.md') && file !== '_index.md')
    .map(file => {
      const filePath = path.join(dirPath, file);
      const raw = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(raw);

      if (data.draft) return null;

      const filename = file.replace('.md', '');
      let urlPath = `${baseUrl}${filename}/`;

      if (data.date && baseUrl === '/blog/') {
        const rawDateMatch = raw.match(/^date:\s*["']?(\d{4})-(\d{2})-(\d{2})/m);
        if (rawDateMatch) {
          urlPath = `${baseUrl}${rawDateMatch[1]}/${rawDateMatch[2]}/${rawDateMatch[3]}/${filename}/`;
        }
      }

      return {
        title: data.title || '',
        description: data.description || '',
        llm_summary: data.llm_summary || '',
        date: data.date ? new Date(data.date).toISOString().split('T')[0] : '',
        url: `${SITE_URL}${urlPath}`,
        keywords: data.keywords || [],
        content: content.trim()
      };
    })
    .filter(Boolean)
    .filter(post => post.title);
}

function generateLlmsFullTxt(posts) {
  const lines = [];

  lines.push('# This is One of the Solutions - Full Content');
  lines.push('');
  lines.push('> Complete blog content by Prabeesh Keezhathra. Each section below');
  lines.push('> is one post with its title, URL, date, and full Markdown body.');
  lines.push('');
  lines.push(`> Generated: ${new Date().toISOString().split('T')[0]}`);
  lines.push(`> Posts: ${posts.length}`);
  lines.push('');

  const sorted = posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  for (const post of sorted) {
    lines.push('---');
    lines.push('');
    lines.push(`## ${post.title}`);
    lines.push('');
    lines.push(`- URL: ${post.url}`);
    lines.push(`- Date: ${post.date}`);
    if (post.llm_summary) {
      lines.push(`- Summary: ${post.llm_summary}`);
    }
    if (post.keywords.length > 0) {
      lines.push(`- Keywords: ${post.keywords.join(', ')}`);
    }
    lines.push('');
    lines.push(post.content);
    lines.push('');
  }

  return lines.join('\n');
}

const blogDir = path.join(__dirname, '../content/blog');
const bonusDir = path.join(__dirname, '../content/bonus');

const blogPosts = getPostsFromDirectory(blogDir, '/blog/');
const bonusPosts = getPostsFromDirectory(bonusDir, '/bonus/');
const allPosts = [...blogPosts, ...bonusPosts];

const output = generateLlmsFullTxt(allPosts);

for (const dir of ['../static', '../public']) {
  const outPath = path.join(__dirname, dir, 'llms-full.txt');
  const outDir = path.dirname(outPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(outPath, output);
}

console.log(`Generated llms-full.txt with ${allPosts.length} posts`);
console.log(`  Blog: ${blogPosts.length}, Bonus: ${bonusPosts.length}`);
