const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const emailService = {
  /**
   * Send notification email when someone receives crypto
   */
  async sendTransferNotification(recipientEmail, amount, claimToken, senderAddress) {
    // Skip if no API key configured
    if (!resend) {
      console.log('⚠️  Email not sent - RESEND_API_KEY not configured');
      return { success: false, reason: 'Email service not configured' };
    }

    // Only send to email addresses (not phone numbers or Twitter handles)
    if (!recipientEmail.includes('@')) {
      console.log('📧 Skipping email - recipient is not an email address');
      return { success: false, reason: 'Recipient is not an email address' };
    }

    try {
      const claimLink = `${process.env.CLAIM_LINK_BASE_URL}/${claimToken}`;
      const explorerUrl = `${process.env.EXPLORER_URL || 'https://explorer.cronos.org/testnet'}/address/${senderAddress}`;

      // Format amount (convert from wei to CRO)
      const amountInCRO = (parseFloat(amount) / 1e18).toFixed(4);

      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'ChainDrop <notifications@chaindrop.app>',
        to: recipientEmail,
        subject: `You've received ${amountInCRO} CRO!`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f9fafb;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
      padding: 40px 32px;
      text-align: center;
    }
    .header h1 {
      color: white;
      margin: 0;
      font-size: 28px;
      font-weight: bold;
    }
    .gift-icon {
      font-size: 64px;
      margin-bottom: 16px;
    }
    .content {
      padding: 40px 32px;
    }
    .amount-box {
      background: linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%);
      border: 2px solid #99f6e4;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 24px 0;
    }
    .amount {
      font-size: 36px;
      font-weight: bold;
      color: #0d9488;
      margin: 0;
    }
    .info-box {
      background: #f0fdfa;
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
    }
    .info-box h3 {
      margin: 0 0 12px 0;
      font-size: 16px;
      color: #115e59;
    }
    .info-box ul {
      margin: 0;
      padding-left: 20px;
      color: #0f766e;
    }
    .info-box li {
      margin: 8px 0;
      font-size: 14px;
    }
    .claim-button {
      display: inline-block;
      background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
      color: white;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 12px;
      font-weight: bold;
      font-size: 18px;
      text-align: center;
      margin: 24px 0;
      box-shadow: 0 4px 6px rgba(20, 184, 166, 0.3);
    }
    .claim-button:hover {
      background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
    }
    .details {
      font-size: 14px;
      color: #6b7280;
      margin: 24px 0;
    }
    .details strong {
      color: #111827;
    }
    .footer {
      background: #f9fafb;
      padding: 24px 32px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    .footer a {
      color: #14b8a6;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="gift-icon">🎁</div>
      <h1>You've Got Crypto!</h1>
    </div>

    <div class="content">
      <p style="font-size: 18px; color: #374151; margin: 0 0 16px 0;">
        Someone just sent you crypto on the Cronos blockchain!
      </p>

      <div class="amount-box">
        <p class="amount">${amountInCRO} CRO</p>
        <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">
          ≈ $${(parseFloat(amountInCRO) * 0.07).toFixed(2)} USD
        </p>
      </div>

      <div style="text-align: center;">
        <a href="${claimLink}" class="claim-button">
          Claim Your Funds →
        </a>
      </div>

      <div class="info-box">
        <h3>💡 How it works:</h3>
        <ul>
          <li>Click the button above to visit your secure claim page</li>
          <li>Sign in with your email, phone, or Twitter</li>
          <li>We'll create a wallet for you automatically (if needed)</li>
          <li>Claim your funds instantly - no crypto knowledge required!</li>
        </ul>
      </div>

      <div class="details">
        <p><strong>From:</strong> <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${senderAddress.substring(0, 10)}...${senderAddress.slice(-8)}</code></p>
        <p><strong>Network:</strong> Cronos Testnet</p>
        <p style="margin-top: 16px; font-size: 12px; color: #9ca3af;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${claimLink}" style="color: #14b8a6; word-break: break-all;">${claimLink}</a>
        </p>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0 0 8px 0;">
        Powered by <strong>ChainDrop</strong> - The easiest way to send crypto
      </p>
      <p style="margin: 0; font-size: 12px;">
        Questions? Visit <a href="https://chaindrop.app">chaindrop.app</a>
      </p>
    </div>
  </div>
</body>
</html>
        `,
        text: `
You've received ${amountInCRO} CRO!

Someone just sent you crypto on the Cronos blockchain.

Claim your funds here: ${claimLink}

How it works:
• Click the link above to visit your secure claim page
• Sign in with your email, phone, or Twitter
• We'll create a wallet for you automatically (if needed)
• Claim your funds instantly - no crypto knowledge required!

From: ${senderAddress}
Network: Cronos Testnet

Powered by ChainDrop - The easiest way to send crypto
        `
      });

      if (error) {
        console.error('❌ Email send error:', error);
        return { success: false, error };
      }

      console.log(`✅ Email sent successfully to ${recipientEmail} - ID: ${data.id}`);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Email service error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Send claim confirmation email
   */
  async sendClaimConfirmation(recipientEmail, amount, txHash) {
    if (!resend || !recipientEmail.includes('@')) {
      return { success: false, reason: 'Skipped' };
    }

    try {
      const amountInCRO = (parseFloat(amount) / 1e18).toFixed(4);
      const explorerUrl = `${process.env.EXPLORER_URL || 'https://explorer.cronos.org/testnet'}/tx/${txHash}`;

      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'ChainDrop <notifications@chaindrop.app>',
        to: recipientEmail,
        subject: `Funds claimed! ${amountInCRO} CRO is now in your wallet`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f9fafb;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      padding: 40px 32px;
      text-align: center;
    }
    .header h1 {
      color: white;
      margin: 0;
      font-size: 28px;
      font-weight: bold;
    }
    .success-icon {
      font-size: 64px;
      margin-bottom: 16px;
    }
    .content {
      padding: 40px 32px;
    }
    .amount-box {
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      border: 2px solid #6ee7b7;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 24px 0;
    }
    .amount {
      font-size: 36px;
      font-weight: bold;
      color: #059669;
      margin: 0;
    }
    .explorer-button {
      display: inline-block;
      background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: bold;
      font-size: 16px;
      text-align: center;
      margin: 16px 0;
    }
    .footer {
      background: #f9fafb;
      padding: 24px 32px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="success-icon">✅</div>
      <h1>Funds Claimed!</h1>
    </div>

    <div class="content">
      <p style="font-size: 18px; color: #374151; margin: 0 0 16px 0; text-align: center;">
        Your crypto has been successfully transferred to your wallet!
      </p>

      <div class="amount-box">
        <p class="amount">${amountInCRO} CRO</p>
        <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">
          Now in your wallet
        </p>
      </div>

      <div style="text-align: center;">
        <a href="${explorerUrl}" class="explorer-button">
          View Transaction on Explorer →
        </a>
      </div>

      <p style="margin-top: 32px; color: #6b7280; font-size: 14px; text-align: center;">
        You can now use your wallet to send crypto to others or export it to use on other dApps.
      </p>
    </div>

    <div class="footer">
      <p style="margin: 0;">
        Powered by <strong>ChainDrop</strong>
      </p>
    </div>
  </div>
</body>
</html>
        `,
        text: `
Funds Claimed!

Your crypto has been successfully transferred to your wallet!

Amount: ${amountInCRO} CRO

View your transaction: ${explorerUrl}

You can now use your wallet to send crypto to others or export it to use on other dApps.

Powered by ChainDrop
        `
      });

      if (error) {
        console.error('❌ Claim confirmation email error:', error);
        return { success: false, error };
      }

      console.log(`✅ Claim confirmation sent to ${recipientEmail}`);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Email service error:', error);
      return { success: false, error: error.message };
    }
  }
};

module.exports = emailService;
