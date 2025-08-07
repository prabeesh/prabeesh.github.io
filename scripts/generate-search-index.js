const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Function to read all markdown files in the content/blog directory
function getBlogPosts() {
  const blogDir = path.join(__dirname, '../content/blog');
  const files = fs.readdirSync(blogDir);
  
  return files
    .filter(file => file.endsWith('.md'))
    .map(file => {
      const filePath = path.join(blogDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const { data, content: markdownContent } = matter(content);
      
      // Generate URL based on filename and date
      const filename = file.replace('.md', '');
      let url = `/blog/${filename}/`;
      
      // If we have a date, create the proper permalink structure
      if (data.date) {
        const date = new Date(data.date);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        url = `/blog/${year}/${month}/${day}/${filename}/`;
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
        wordCount: markdownContent.split(' ').length
      };
    })
    .filter(post => post.title); // Only include posts with titles
}

// Generate the search index
const posts = getBlogPosts();
const searchIndex = JSON.stringify(posts, null, 2);

// Write to public directory
const publicOutputPath = path.join(__dirname, '../public/search-index.json');
fs.writeFileSync(publicOutputPath, searchIndex);

// Also write to static directory for Hugo to serve
const staticOutputPath = path.join(__dirname, '../static/search-index.json');
fs.writeFileSync(staticOutputPath, searchIndex);

console.log(`Generated search index with ${posts.length} posts`);
console.log(`Output: ${publicOutputPath}`);
console.log(`Static: ${staticOutputPath}`);
