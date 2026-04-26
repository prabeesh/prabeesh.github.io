const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const SITE_URL = 'https://blog.prabeeshk.com';
const SITE_TITLE = 'This is One of the Solutions';
const AUTHOR = 'Prabeesh Keezhathra';
const SITE_DESCRIPTION = 'Technical blog by Prabeesh Keezhathra covering Apache Spark installation and performance tuning, PySpark design patterns, CUDA and GPU programming, embedded systems (AVR, MSP430, Arduino), and web development with Python and JavaScript.';
const CORE_TOPICS = [
  'Apache Spark',
  'PySpark',
  'data engineering',
  'performance tuning',
  'design patterns',
  'CUDA',
  'GPU programming',
  'embedded systems',
  'AVR microcontrollers',
  'MSP430',
  'Arduino',
  'web development'
];

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
        tags: data.tags || [],
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

function describePost(post) {
  return post.llm_summary || post.description || 'Technical article by Prabeesh Keezhathra.';
}

function generateLlmsTxt(posts) {
  const lines = [];
  const sorted = posts.sort((a, b) => {
    const aScore = (a.llm_summary ? 1000000000 : 0) + (a.date ? Number(a.date.replaceAll('-', '')) : 0);
    const bScore = (b.llm_summary ? 1000000000 : 0) + (b.date ? Number(b.date.replaceAll('-', '')) : 0);
    return bScore - aScore;
  });
  const keyPages = sorted.slice(0, 12);

  lines.push(`# ${SITE_TITLE}`);
  lines.push('');
  lines.push(`> ${SITE_DESCRIPTION}`);
  lines.push('');
  lines.push('## About');
  lines.push('');
  lines.push(`- Author: ${AUTHOR}`);
  lines.push(`- Site: ${SITE_URL}/`);
  lines.push('- Language: English');
  lines.push(`- Topics: ${CORE_TOPICS.join(', ')}`);
  lines.push('');
  lines.push('## Key Pages');
  lines.push('');

  for (const post of keyPages) {
    lines.push(`- [${post.title}](${post.url}): ${describePost(post)}`);
  }

  lines.push('');
  lines.push('## Optional');
  lines.push('');
  lines.push(`- [Full content for LLMs](${SITE_URL}/llms-full.txt): Complete blog content in Markdown for comprehensive ingestion.`);
  lines.push(`- [RSS Feed](${SITE_URL}/feed.xml): RSS feed with latest posts.`);
  lines.push(`- [Sitemap](${SITE_URL}/sitemap.xml): Full sitemap for all pages.`);

  return lines.join('\n');
}

const blogDir = path.join(__dirname, '../content/blog');
const bonusDir = path.join(__dirname, '../content/bonus');

const blogPosts = getPostsFromDirectory(blogDir, '/blog/');
const bonusPosts = getPostsFromDirectory(bonusDir, '/bonus/');
const allPosts = [...blogPosts, ...bonusPosts];

const llmsOutput = generateLlmsTxt([...allPosts]);
const fullOutput = generateLlmsFullTxt([...allPosts]);

for (const dir of ['../static', '../public']) {
  const outDir = path.join(__dirname, dir);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(path.join(outDir, 'llms.txt'), llmsOutput);
  fs.writeFileSync(path.join(outDir, 'llms-full.txt'), fullOutput);
}

console.log(`Generated llms.txt and llms-full.txt with ${allPosts.length} posts`);
console.log(`  Blog: ${blogPosts.length}, Bonus: ${bonusPosts.length}`);
