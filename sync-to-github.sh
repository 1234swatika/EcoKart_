#!/bin/bash

echo "🔄 Syncing changes to GitHub..."

# Check if there are any changes
if [[ -n $(git status --porcelain) ]]; then
    echo "📝 Changes detected, committing..."
    
    # Add all changes
    git add .
    
    # Commit with timestamp
    git commit -m "Auto-sync: $(date '+%Y-%m-%d %H:%M:%S')"
    
    # Push to GitHub
    echo "🚀 Pushing to GitHub..."
    git push origin main
    
    echo "✅ Successfully synced to GitHub!"
else
    echo "✨ No changes to sync - everything is up to date!"
fi 