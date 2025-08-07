#!/bin/bash

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install gray-matter
fi

# Generate search index
echo "Generating search index..."
node scripts/generate-search-index.js

# Copy search index to static directory
echo "Copying search index to static directory..."
cp public/search-index.json static/

# Build Hugo site
echo "Building Hugo site..."
hugo --minify

echo "Build complete!"
