# Search Functionality

This blog now includes a client-side search functionality that allows users to search through all blog posts.

## Features

- **Real-time search**: Search results update as you type
- **Full-text search**: Searches through titles, descriptions, tags, and keywords
- **Highlighted results**: Search terms are highlighted in results
- **Responsive design**: Works on desktop and mobile devices
- **Fast performance**: Client-side search with pre-generated index

## How it works

1. **Search Index Generation**: A Node.js script (`scripts/generate-search-index.js`) reads all blog posts and generates a JSON index file (`public/search-index.json`)

2. **Search Form**: A search form is included in the navigation bar on all pages

3. **Search Results Page**: When users submit a search, they're taken to `/search/` with their query as a URL parameter

4. **Client-side Search**: JavaScript fetches the search index and performs the search locally

## Files

- `layouts/partials/search-form.html` - Search form component
- `layouts/search/list.html` - Search results page template
- `content/search/_index.md` - Search page content
- `scripts/generate-search-index.js` - Script to generate search index
- `scripts/build.sh` - Build script that includes search index generation

## Usage

### For Development

1. Install dependencies:
   ```bash
   npm install gray-matter
   ```

2. Generate search index:
   ```bash
   node scripts/generate-search-index.js
   ```

3. Build the site:
   ```bash
   hugo --minify
   ```

### For Production

Use the build script:
```bash
./scripts/build.sh
```

## Customization

### Search Form Styling

The search form styling is included in `layouts/partials/search-form.html`. You can modify the CSS to match your theme.

### Search Algorithm

The search algorithm is in `layouts/search/list.html`. It currently:
- Splits search terms by spaces
- Searches through title, description, and tags
- Ranks results by relevance (number of matching terms)
- Highlights matching terms in results

### Search Index

The search index includes:
- Title
- Description
- URL
- Date
- Tags
- Keywords
- Author
- Reading time
- Word count

## Troubleshooting

1. **Search index not generated**: Make sure `gray-matter` is installed and the script has proper permissions
2. **Search not working**: Check browser console for JavaScript errors
3. **No results**: Verify the search index file exists and contains data

## Future Enhancements

- Add search filters (by date, tags, etc.)
- Implement fuzzy search for typos
- Add search suggestions
- Include content snippets in results
- Add search analytics
