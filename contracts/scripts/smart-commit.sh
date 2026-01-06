#!/bin/bash

# Smart auto-commit script
# Commits and pushes based on the significance of changes

cd "$(dirname "$0")/../.."

# Check if there are any changes
if [[ -z $(git status -s) ]]; then
    echo "No changes to commit."
    exit 0
fi

# Count changes by type
MODIFIED=$(git status -s | grep "^ M" | wc -l | xargs)
ADDED=$(git status -s | grep "^A\|^??" | wc -l | xargs)
DELETED=$(git status -s | grep "^ D" | wc -l | xargs)

# Check for "major" changes (contracts, tests, or config files)
MAJOR_CHANGES=$(git status -s | grep -E "\.sol$|\.ts$|\.js$|hardhat.config|package.json" | wc -l | xargs)

TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

# Determine commit type
if [ "$MAJOR_CHANGES" -gt 0 ]; then
    COMMIT_TYPE="Major update"
    IS_MAJOR=true
else
    COMMIT_TYPE="Minor update"
    IS_MAJOR=false
fi

# Build commit message
COMMIT_MSG="$COMMIT_TYPE: $TIMESTAMP"

if [ "$ADDED" -gt 0 ]; then
    COMMIT_MSG="$COMMIT_MSG
- Added $ADDED file(s)"
fi

if [ "$MODIFIED" -gt 0 ]; then
    COMMIT_MSG="$COMMIT_MSG
- Modified $MODIFIED file(s)"
fi

if [ "$DELETED" -gt 0 ]; then
    COMMIT_MSG="$COMMIT_MSG
- Deleted $DELETED file(s)"
fi

# Add list of changed files
COMMIT_MSG="$COMMIT_MSG

Changed files:
$(git status -s | head -10)"

# Stage all changes
git add .

# Create commit
git commit -m "$COMMIT_MSG"

# Push to GitHub
git push origin main

# Report
if [ "$IS_MAJOR" = true ]; then
    echo "✅ MAJOR changes committed and pushed!"
else
    echo "✅ Changes committed and pushed!"
fi

echo "Time: $TIMESTAMP"
echo "Files changed: $((ADDED + MODIFIED + DELETED))"
