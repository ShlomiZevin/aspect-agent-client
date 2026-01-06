#!/bin/bash

# Deploy to freeda project
echo "🌸 Deploying to Freeda project..."
echo "📦 Copying Freeda files to public folder..."

# Copy freeda.html and related files to public
cp freeda.html public/index.html
cp freeda-styles.css public/
cp freeda-script.js public/
cp -r img public/

echo "✅ Files copied"
echo "🚀 Deploying to Firebase..."

firebase use freeda
firebase deploy --only hosting

echo "✅ Deployment to Freeda complete!"
echo "🌐 Check your Firebase console for the URL"
