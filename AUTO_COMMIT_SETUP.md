# Auto-Commit Setup Guide

This guide will help you set up automatic commits and pushes to GitHub.

## Two Options Available

### Option 1: Scheduled Auto-Commits (Every Hour)
Automatically commit and push changes every hour, even if you're not at your computer.

### Option 2: Smart Commits (On Major Changes)
Manually trigger commits when you've made significant changes.

---

## Option 1: Scheduled Auto-Commits (Recommended)

### On macOS (Using launchd)

1. **Test the script first:**
   ```bash
   ./scripts/auto-commit.sh
   ```

2. **Create a launchd plist file:**
   ```bash
   cat > ~/Library/LaunchAgents/com.chaindrop.autocommit.plist << 'EOF'
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
       <key>Label</key>
       <string>com.chaindrop.autocommit</string>
       <key>ProgramArguments</key>
       <array>
           <string>/bin/bash</string>
           <string>/Users/jeremicarose/Downloads/chaindrop-mvp/contracts/scripts/auto-commit.sh</string>
       </array>
       <key>StartInterval</key>
       <integer>3600</integer>
       <key>RunAtLoad</key>
       <true/>
       <key>StandardOutPath</key>
       <string>/tmp/chaindrop-autocommit.log</string>
       <key>StandardErrorPath</key>
       <string>/tmp/chaindrop-autocommit-error.log</string>
   </dict>
   </plist>
   EOF
   ```

3. **Load the launchd job:**
   ```bash
   launchctl load ~/Library/LaunchAgents/com.chaindrop.autocommit.plist
   ```

4. **Verify it's running:**
   ```bash
   launchctl list | grep chaindrop
   ```

5. **Check the logs:**
   ```bash
   tail -f /tmp/chaindrop-autocommit.log
   ```

### To Stop Auto-Commits

```bash
launchctl unload ~/Library/LaunchAgents/com.chaindrop.autocommit.plist
```

### To Restart Auto-Commits

```bash
launchctl load ~/Library/LaunchAgents/com.chaindrop.autocommit.plist
```

---

## Option 2: Manual Smart Commits

When you've made changes and want to commit immediately:

```bash
./scripts/smart-commit.sh
```

This script will:
- Detect if changes are "major" (contracts, tests, config)
- Create a descriptive commit message
- Push to GitHub automatically

---

## What Gets Committed?

Both scripts will commit:
- ✅ Modified source files (.sol, .js, .ts)
- ✅ New files you've added
- ✅ Configuration changes
- ❌ Files in .gitignore (node_modules, .env, etc.)

---

## Customization

### Change Commit Frequency

Edit the `StartInterval` in the plist file:
- 1 hour = 3600 seconds
- 30 minutes = 1800 seconds
- 2 hours = 7200 seconds

### Customize Commit Messages

Edit the scripts in `scripts/auto-commit.sh` or `scripts/smart-commit.sh`

---

## Troubleshooting

### Script Not Running?

Check the error log:
```bash
cat /tmp/chaindrop-autocommit-error.log
```

### Authentication Issues?

Make sure your GitHub credentials are cached:
```bash
git config --global credential.helper osxkeychain
```

### Want to See What Would Be Committed?

```bash
git status
```

---

## Best Practices

1. **Review commits periodically** - Check your GitHub to see what's been committed
2. **Use meaningful branch names** - Create feature branches for major work
3. **Pull before starting work** - Run `git pull` when you start coding
4. **Don't commit secrets** - The .gitignore protects .env files

---

## Manual Override

If you want to commit with a custom message:

```bash
git add .
git commit -m "Your custom message"
git push origin main
```

The auto-commit will skip the next cycle if there are no new changes.
