#!/bin/bash

# Deploy to default project (aspect-agents)
echo "🚀 Deploying to aspect-agents (default)..."
echo "📦 Copying files to public folder..."

# Copy index.html and related files to public
cp index.html public/
cp -r img public/

echo "✅ Files copied"
echo "🚀 Deploying to Firebase..."

firebase use default
firebase deploy --only hosting

echo "✅ Deployment to aspect-agents complete!"
echo "🌐 URL: https://aspect-agents.web.app"
