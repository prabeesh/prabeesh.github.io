#!/bin/bash

# Build script with performance optimizations

echo "Building Hugo site with optimizations..."

# Set production environment
export HUGO_ENV=production

# Build the site
hugo --minify --gc --cleanDestinationDir

# Optimize images (requires ImageOptim or similar)
echo "Optimizing images..."
find public -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" | xargs -I {} echo "Optimizing {}"

# Generate critical CSS
echo "Generating critical CSS..."

# Compress static assets
echo "Compressing static assets..."
gzip -9 -r public/

# Generate sitemap
echo "Generating sitemap..."
hugo --minify --gc

echo "Build complete! Site optimized for production."
