#!/bin/bash

# Setup script for smart auto-commit
# Runs every 15 minutes and commits only when major changes are detected

echo "🚀 ChainDrop Smart Auto-Commit Setup"
echo "===================================="
echo ""

# Get the absolute path to the project
PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
SCRIPT_PATH="$PROJECT_DIR/contracts/scripts/smart-commit.sh"
PLIST_PATH="$HOME/Library/LaunchAgents/com.chaindrop.smartcommit.plist"

echo "Project directory: $PROJECT_DIR"
echo ""

# Check if already installed
if [ -f "$PLIST_PATH" ]; then
    echo "⚠️  Smart commit is already set up."
    echo "Updating configuration..."
    launchctl unload "$PLIST_PATH" 2>/dev/null
    rm "$PLIST_PATH"
fi

# Create the plist file (runs every 15 minutes)
echo "Creating smart commit configuration..."
cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.chaindrop.smartcommit</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>$SCRIPT_PATH</string>
    </array>
    <key>StartInterval</key>
    <integer>900</integer>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/chaindrop-smartcommit.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/chaindrop-smartcommit-error.log</string>
</dict>
</plist>
EOF

# Load the launchd job
echo "Loading smart commit service..."
launchctl load "$PLIST_PATH"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Smart commit setup complete!"
    echo ""
    echo "How it works:"
    echo "  - Checks for changes every 15 minutes"
    echo "  - Auto-commits when you modify .sol, .js, .ts files"
    echo "  - Ignores minor changes (comments, README edits)"
    echo "  - Pushes to GitHub automatically"
    echo ""
    echo "Useful commands:"
    echo "  - View activity: tail -f /tmp/chaindrop-smartcommit.log"
    echo "  - Manual commit: ./scripts/smart-commit.sh"
    echo "  - Stop service: launchctl unload $PLIST_PATH"
    echo ""
    echo "First check will run in 15 minutes (or run manually now)."
else
    echo ""
    echo "❌ Setup failed. Please check the error messages above."
    exit 1
fi
