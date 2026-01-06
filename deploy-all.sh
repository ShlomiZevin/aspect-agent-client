#!/bin/bash

# Deploy to all Firebase projects
echo "🚀 Deploying to ALL Firebase projects..."
echo ""

# Deploy to default (aspect-agents)
echo "📦 [1/2] Deploying to aspect-agents..."
echo "📦 Copying files to public folder..."
cp index.html public/
cp -r img public/
echo "✅ Files copied"

firebase use default
firebase deploy --only hosting
echo ""

# Deploy to freeda
echo "🌸 [2/2] Deploying to Freeda..."
echo "📦 Copying Freeda files to public folder..."
cp freeda.html public/
cp freeda-styles.css public/
cp freeda-script.js public/
cp -r img public/
echo "✅ Files copied"

firebase use freeda
firebase deploy --only hosting
echo ""

echo "✅ All deployments complete!"
echo "🌐 aspect-agents: https://aspect-agents.web.app"
echo "🌸 freeda: Check Firebase console for URL"
