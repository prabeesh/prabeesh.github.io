const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Function to read all markdown files in a directory
function getPostsFromDirectory(dirPath, baseUrl) {
  const files = fs.readdirSync(dirPath);
  
  return files
    .filter(file => file.endsWith('.md'))
    .map(file => {
      const filePath = path.join(dirPath, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const { data, content: markdownContent } = matter(content);
      
      // Generate URL based on filename and date
      const filename = file.replace('.md', '');
      let url = `${baseUrl}${filename}/`;
      
      // Only apply date-based URL structure for blog posts, not bonus content
      if (data.date && baseUrl === '/blog/') {
        const date = new Date(data.date);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        url = `${baseUrl}${year}/${month}/${day}/${filename}/`;
      }
      
      return {
        title: data.title || '',
        description: data.description || data.summary || '',
        url: url,
        date: data.date ? new Date(data.date).toISOString() : '',
        tags: data.tags || [],
        keywords: data.keywords || '',
        author: data.author || 'Prabeesh Keezhathra',
        readingTime: Math.ceil(markdownContent.split(' ').length / 200), // Rough estimate
        wordCount: markdownContent.split(' ').length,
        category: baseUrl === '/blog/' ? 'blog' : 'bonus'
      };
    })
    .filter(post => post.title); // Only include posts with titles
}

// Function to get all posts from both blog and bonus directories
function getAllPosts() {
  const blogDir = path.join(__dirname, '../content/blog');
  const bonusDir = path.join(__dirname, '../content/bonus');
  
  const blogPosts = getPostsFromDirectory(blogDir, '/blog/');
  const bonusPosts = getPostsFromDirectory(bonusDir, '/bonus/');
  
  return [...blogPosts, ...bonusPosts];
}

// Generate the search index
const posts = getAllPosts();
const searchIndex = JSON.stringify(posts, null, 2);

// Write to public directory
const publicOutputPath = path.join(__dirname, '../public/search-index.json');
// Create public directory if it doesn't exist
const publicDir = path.dirname(publicOutputPath);
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
fs.writeFileSync(publicOutputPath, searchIndex);

// Also write to static directory for Hugo to serve
const staticOutputPath = path.join(__dirname, '../static/search-index.json');
// Create static directory if it doesn't exist
const staticDir = path.dirname(staticOutputPath);
if (!fs.existsSync(staticDir)) {
  fs.mkdirSync(staticDir, { recursive: true });
}
fs.writeFileSync(staticOutputPath, searchIndex);

console.log(`Generated search index with ${posts.length} posts`);
console.log(`Blog posts: ${posts.filter(p => p.category === 'blog').length}`);
console.log(`Bonus posts: ${posts.filter(p => p.category === 'bonus').length}`);
console.log(`Output: ${publicOutputPath}`);
console.log(`Static: ${staticOutputPath}`);
