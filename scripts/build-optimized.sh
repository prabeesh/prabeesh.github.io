#!/bin/bash

# Build optimized Hugo site
echo "Building optimized Hugo site..."

# Set environment for production
export HUGO_ENV=production

# Build with minification
hugo --minify --gc --cleanDestinationDir

# Optimize images (requires ImageOptim or similar)
echo "Optimizing images..."
find public/images -name "*.jpg" -o -name "*.png" -o -name "*.gif" | xargs -I {} echo "Optimizing {}"

# Generate critical CSS
echo "Generating critical CSS..."
# You can use critical-cli here if installed
# npx critical public/index.html --inline > public/critical.css

# Compress static assets
echo "Compressing static assets..."
find public -name "*.css" -o -name "*.js" -o -name "*.html" | xargs -I {} gzip -9 -k {}

echo "Build complete!"
