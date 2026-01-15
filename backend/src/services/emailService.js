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

      // Format sender address for display
      const senderShort = `${senderAddress.substring(0, 6)}...${senderAddress.slice(-4)}`;

      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'ChainDrop <notifications@chaindrop.app>',
        to: recipientEmail,
        replyTo: 'support@chaindrops.app',
        subject: `${amountInCRO} CRO sent to you via ChainDrop`,
        headers: {
          'X-Entity-Ref-ID': claimToken.substring(0, 16),
          'List-Unsubscribe': '<mailto:unsubscribe@chaindrops.app>'
        },
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #2dd4bf 100%); padding: 32px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 8px;">💸</div>
              <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 600;">Payment Received</h1>
            </td>
          </tr>

          <!-- Amount Card -->
          <tr>
            <td style="padding: 32px 24px 16px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%); border-radius: 12px; border: 1px solid #99f6e4;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <div style="font-size: 42px; font-weight: 700; color: #0d9488; letter-spacing: -1px;">${amountInCRO} CRO</div>
                    <div style="font-size: 14px; color: #6b7280; margin-top: 4px;">≈ $${(parseFloat(amountInCRO) * 0.07).toFixed(2)} USD</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Sender Info -->
          <tr>
            <td style="padding: 0 24px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; border-radius: 8px; border: 1px solid #e5e7eb;">
                <tr>
                  <td style="padding: 16px;">
                    <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">From</div>
                    <div style="display: flex; align-items: center;">
                      <span style="display: inline-block; width: 32px; height: 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 50%; margin-right: 12px; vertical-align: middle;"></span>
                      <span style="font-family: 'SF Mono', Monaco, monospace; font-size: 14px; color: #1f2937; background: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${senderShort}</span>
                    </div>
                    <div style="margin-top: 8px;">
                      <a href="${explorerUrl}" style="font-size: 12px; color: #0d9488; text-decoration: none;">View on Explorer →</a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 24px 24px;">
              <a href="${claimLink}" style="display: block; background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); color: white; text-decoration: none; padding: 16px 24px; border-radius: 10px; font-weight: 600; font-size: 16px; text-align: center; box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);">
                Claim Your ${amountInCRO} CRO →
              </a>
              <div style="text-align: center; margin-top: 12px; font-size: 12px; color: #9ca3af;">
                Expires in 48 hours
              </div>
            </td>
          </tr>

          <!-- How it works -->
          <tr>
            <td style="padding: 0 24px 24px;">
              <div style="font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 12px;">How to claim:</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 8px 0; font-size: 13px; color: #6b7280;">
                    <span style="display: inline-block; width: 20px; height: 20px; background: #f0fdfa; border-radius: 50%; text-align: center; line-height: 20px; font-size: 11px; color: #0d9488; margin-right: 8px;">1</span>
                    Click the button above
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 13px; color: #6b7280;">
                    <span style="display: inline-block; width: 20px; height: 20px; background: #f0fdfa; border-radius: 50%; text-align: center; line-height: 20px; font-size: 11px; color: #0d9488; margin-right: 8px;">2</span>
                    Sign in with this email address
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 13px; color: #6b7280;">
                    <span style="display: inline-block; width: 20px; height: 20px; background: #f0fdfa; border-radius: 50%; text-align: center; line-height: 20px; font-size: 11px; color: #0d9488; margin-right: 8px;">3</span>
                    Funds transfer instantly to your wallet
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f8fafc; padding: 20px 24px; border-top: 1px solid #e5e7eb;">
              <div style="text-align: center; font-size: 12px; color: #9ca3af;">
                Sent via <strong style="color: #6b7280;">ChainDrop</strong> on Cronos Network
              </div>
              <div style="text-align: center; margin-top: 8px; font-size: 11px; color: #9ca3af;">
                <a href="mailto:unsubscribe@chaindrops.app" style="color: #9ca3af;">Unsubscribe</a>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
        text: `Payment Received: ${amountInCRO} CRO

From: ${senderShort}

Claim your funds: ${claimLink}

Steps:
1. Click the link above
2. Sign in with this email address
3. Funds transfer instantly to your wallet

Expires in 48 hours.

Sent via ChainDrop on Cronos Network
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
        replyTo: 'support@chaindrops.app',
        subject: `✅ Funds claimed! ${amountInCRO} CRO is now in your wallet`,
        headers: {
          'X-Entity-Ref-ID': txHash.substring(0, 16),
          'List-Unsubscribe': '<mailto:unsubscribe@chaindrops.app>',
          'Precedence': 'bulk'
        },
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
      <p style="margin: 0 0 8px 0;">
        Powered by <strong>ChainDrop</strong>
      </p>
      <p style="margin: 0; font-size: 11px; color: #9ca3af;">
        This is a transactional email confirming your claim. <a href="mailto:unsubscribe@chaindrops.app" style="color: #9ca3af;">Unsubscribe</a>
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
