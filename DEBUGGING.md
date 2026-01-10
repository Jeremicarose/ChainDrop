# ChainDrop Debugging Guide

## Current Issues

### 1. ✅ FIXED: Wallet Page White Text
- Fixed text colors on balance card
- Changed from `text-cronos-100` to `text-white/80` for better visibility

### 2. ✅ FIXED: AI Agent Cards Not Clickable
- Added "View Details" modal with full agent configuration
- Added "Pause/Activate" toggle button
- Agent cards now fully interactive

### 3. ⚠️ INVESTIGATING: Claim Failing for "test" account

**Status:**
- First claim worked: arose → jeremic ✅
- Second claim failing: jeremic → test ❌

**To Debug:**

1. **Restart backend with new logging:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Try to claim as "test" user:**
   - Go to claim page with the claim token
   - Login as testchaindrop1@gmail.com
   - Try to claim
   - **CHECK THE BACKEND TERMINAL** for the full error

3. **Look for these specific log lines:**
   ```
   🎯 Claim request for token: ...
   📧 Verified identity: testchaindrop1@gmail.com
   ✅ Identity verified: ...
   📦 Deploying account with owner: ...
   ```

4. **If you see error:**
   - Copy the FULL error message
   - Look for "Error:" or "❌"
   - Check if it's identity verification or blockchain error

**Common Issues:**

- **Identity mismatch:** Logged in email doesn't match transfer recipient
- **Wallet not found:** Database issue
- **Blockchain error:** Smart contract deployment failing
- **Insufficient gas:** Admin wallet needs CRO

### 4. ⚠️ Email Notifications Not Sending

**Status:** You're working on buying a domain

**Notes:**
- Resend requires verified domain for custom FROM addresses
- Currently set to: `ChainDrop <notifications@chaindrop.app>`
- For testing: Use `onboarding@resend.dev` (100 emails/day limit)
- For production: Add and verify your domain at https://resend.com/domains

**To test emails work:**
1. Update EMAIL_FROM in .env to: `onboarding@resend.dev`
2. Restart backend
3. Send a transfer to your email
4. Check inbox (and spam folder!)

### 5. ⚠️ Auto Commit/Push to GitHub Stopped

**To Check:**
1. Check if there are uncommitted changes:
   ```bash
   git status
   ```

2. Check git configuration:
   ```bash
   git config --list | grep -E "(user|remote)"
   ```

3. Check if remote is properly set:
   ```bash
   git remote -v
   ```

4. Try manual push to test connection:
   ```bash
   git push origin main
   ```

**Common Issues:**
- Authentication expired (need to re-login to GitHub)
- Branch protection rules preventing push
- Merge conflicts
- No commits to push (nothing changed)

## Quick Fixes Applied

1. ✅ Better error logging in claim endpoint
2. ✅ Fixed wallet page text visibility
3. ✅ Made AI agent cards interactive
4. ✅ Added agent details modal

## Next Steps

1. **Debug claim error:** Check backend logs when test tries to claim
2. **Fix email domain:** Update to onboarding@resend.dev or add your domain
3. **Check git:** Test manual git push to see what's wrong

---

**When you find errors, report them with:**
- Exact error message from terminal
- Which step failed (identity check, blockchain, database?)
- What user was logged in
- What the transfer details were
