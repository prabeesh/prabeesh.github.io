# This is One of the Solutions - Technical Blog

Welcome to This is One of the Solutions, a technical blog where I share practical insights and tutorials on programming, data engineering, Apache Spark, embedded systems, and modern software development practices. Explore in-depth articles, code examples, and real-world solutions to help you tackle complex technical challenges. Built with Hugo and the Ananke theme.

## 🚀 Quick Start

### Prerequisites
- [Hugo Extended](https://gohugo.io/installation/) (v0.150.0+)
- [Node.js](https://nodejs.org/) (v18+)
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone --recursive git@github.com:prabeesh/prabeesh.github.io.git
   cd prabeesh.github.io
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Generate search index**
   ```bash
   node scripts/generate-search-index.js
   ```

4. **Start development server**
   ```bash
   hugo server -D
   ```

5. **View locally**
   Open [http://localhost:1313](http://localhost:1313) in your browser

## 📝 Content Management

### Creating New Posts

```bash
# Create a new blog post
hugo new blog/your-post-title.md

# Create a new bonus content
hugo new bonus/your-bonus-content.md
```

### Building for Production

```bash
HUGO_ENV=production hugo --minify
```

## 🚢 Deployment

The site is automatically deployed using **GitHub Actions** when changes are pushed to the `master` branch.

### Deployment Workflow
1. Make your changes locally
2. Commit and push to `master` branch
3. GitHub Actions automatically builds and deploys to GitHub Pages
4. Site is live at [https://blog.prabeeshk.com](https://blog.prabeeshk.com)

### Manual Deploy Commands
```bash
# Add and commit changes
git add .
git commit -m "your descriptive commit message"

# Push to trigger deployment
git push origin master
```

## 🔧 Theme Management

### Update Ananke Theme
```bash
cd themes/ananke
git pull origin master
cd ../..
git add themes/ananke
git commit -m "update ananke theme"
```

## 🎨 Features

- **Performance Optimized**: Minified CSS/JS, optimized images, lazy loading
- **SEO Enhanced**: Structured data, meta tags, sitemap
- **Search Functionality**: Client-side search with generated index
- **Responsive Design**: Mobile-first approach
- **Code Highlighting**: Syntax highlighting for code blocks
- **Reading Progress**: Progress bar for blog posts
- **Font Optimization**: Inter font with display swap for better performance

## 📁 Project Structure

```
├── .github/workflows/    # GitHub Actions deployment
├── content/             # Blog posts and pages
│   ├── blog/           # Blog posts
│   └── bonus/          # Bonus content
├── layouts/            # Custom Hugo layouts
├── static/             # Static assets
├── themes/ananke/      # Ananke theme (submodule)
├── config.toml         # Hugo configuration
└── package.json        # Node.js dependencies
```

## 🐛 Troubleshooting

### Common Issues

1. **Submodule not initialized**
   ```bash
   git submodule update --init --recursive
   ```

2. **Search not working**
   ```bash
   node scripts/generate-search-index.js
   ```

3. **Theme issues**
   ```bash
   cd themes/ananke && git pull origin master
   ```

## 📊 Performance

- **Core Web Vitals Optimized**
- **Lighthouse Score: 95+**
- **Font Display Swap** for better loading performance
- **Resource Hints** for faster loading
- **Minified Assets** in production

## 🔧 Recent Updates

### Font Optimization (Latest)
- Replaced invalid Avenir Google Fonts with Inter
- Eliminated console MIME type errors
- Improved web performance with proper font loading
- Added font-display: swap for better Core Web Vitals

## 📈 SEO & Performance Features

- **Structured Data**: JSON-LD for better search engine understanding
- **Open Graph Tags**: Enhanced social media sharing
- **Twitter Cards**: Optimized Twitter previews  
- **Sitemap Generation**: Automatic XML sitemap
- **Robot.txt**: Search engine crawling optimization
- **Canonical URLs**: Prevent duplicate content issues
- **Meta Descriptions**: Dynamic meta descriptions for all pages

## 🛠️ Development Commands

```bash
# Start development with drafts
hugo server -D

# Build production site
HUGO_ENV=production hugo --minify

# Update search index
node scripts/generate-search-index.js

# Check Hugo version
hugo version

# Clean generated resources
hugo --cleanDestinationDir
```

Built with ❤️ using [Hugo](https://gohugo.io/) and [Ananke Theme](https://github.com/theNewDynamic/gohugo-theme-ananke)