#!/bin/bash
# Quick push - run this anytime with: ./quick-push.sh

cd "$(dirname "$0")"

if [[ -z $(git status -s) ]]; then
    echo "✅ No changes to commit"
    exit 0
fi

TIMESTAMP=$(date +"%Y-%m-%d %H:%M")
CHANGES=$(git status -s | wc -l | xargs)

git add .
git commit -m "Update $TIMESTAMP - $CHANGES file(s) changed"
git push origin main

echo "✅ Pushed to GitHub! View at: https://github.com/Jeremicarose/ChainDrop"
