#!/bin/bash

# Copy files to public directory
echo "Copying files to public directory..."
cp index.html public/
cp -r img public/

# Deploy to Firebase
echo "Deploying to Firebase..."
firebase deploy

echo "Deployment complete!"
