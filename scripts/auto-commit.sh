#!/bin/bash

# Auto-commit and push script for ChainDrop
# This script checks for changes and automatically commits and pushes them

cd "$(dirname "$0")/.."

# Check if there are any changes
if [[ -n $(git status -s) ]]; then
    echo "Changes detected. Creating commit..."

    # Get current timestamp
    TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

    # Get changed files summary
    CHANGED_FILES=$(git status -s | wc -l | xargs)

    # Stage all changes
    git add .

    # Create commit with descriptive message
    git commit -m "Update: $TIMESTAMP

- Modified $CHANGED_FILES file(s)
- Auto-committed by scheduled task"

    # Push to GitHub
    git push origin main

    echo "✅ Changes committed and pushed successfully!"
    echo "Time: $TIMESTAMP"
else
    echo "No changes to commit."
fi
