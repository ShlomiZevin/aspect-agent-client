#!/bin/bash

# Deploy to aspect-agents project
echo "💼 Deploying to Aspect project..."
echo "📦 Copying Aspect files to public folder..."

# Copy aspect.html and related files to public
cp *.html public/
cp aspect.html public/index.html
cp *.css public/
cp *.js public/
cp -r img public/

echo "✅ Files copied"
echo "🚀 Deploying to Firebase..."

firebase use aspect-agents
firebase deploy --only hosting

echo "✅ Deployment to Aspect complete!"
echo "🌐 Check your Firebase console for the URL"
