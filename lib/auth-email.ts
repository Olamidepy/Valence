/**
 * Valence Auth Email Delivery Service (Resend REST API)
 * Sends live OTP verification codes to Gmail / personal email.
 */

interface SendEmailOtpParams {
  toEmail: string;
  otpCode: string;
}

interface SendEmailOtpResult {
  success: boolean;
  messageId?: string;
  isMock?: boolean;
  error?: string;
}

export async function sendEmailOtp({
  toEmail,
  otpCode,
}: SendEmailOtpParams): Promise<SendEmailOtpResult> {
  const apiKey = process.env.RESEND_API_KEY;
  // Resend default onboarding sender or verified domain
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Valence Security <onboarding@resend.dev>";

  // If no RESEND_API_KEY configured yet, log in dev and return mock info
  if (!apiKey || apiKey === "re_mock_key" || apiKey.trim() === "") {
    console.log(
      `[DEV MODE - RESEND_API_KEY not set] Simulated OTP for ${toEmail}: ${otpCode}`
    );
    return {
      success: true,
      isMock: true,
      error: "RESEND_API_KEY is not configured in .env. Test code logged to terminal.",
    };
  }

  // HTML Email Template for Valence Verification Code
  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Valence Authentication Code</title>
</head>
<body style="background-color: #09080c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff; padding: 40px 20px; margin: 0;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background: #0e0d16; border: 1px solid rgba(255,255,255,0.12); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
    <!-- Header -->
    <tr>
      <td style="padding: 36px 36px 20px 36px; text-align: center; background: linear-gradient(180deg, rgba(124, 58, 237, 0.2) 0%, transparent 100%);">
        <div style="display: inline-block; padding: 10px 18px; border-radius: 9999px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); margin-bottom: 16px;">
          <span style="color: #a855f7; font-weight: 700; font-size: 13px; letter-spacing: 1px;">VALENCE &bull; ROBINHOOD CHAIN</span>
        </div>
        <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">Verification Code</h1>
        <p style="color: rgba(255,255,255,0.6); font-size: 14px; margin-top: 8px;">Use this 6-digit code to securely sign in to your autonomous portfolio.</p>
      </td>
    </tr>

    <!-- OTP Code Display -->
    <tr>
      <td style="padding: 10px 36px 24px 36px; text-align: center;">
        <div style="background: rgba(124, 58, 237, 0.1); border: 2px dashed #7c3aed; border-radius: 16px; padding: 22px; margin: 10px 0;">
          <span style="font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #c084fc; text-shadow: 0 0 16px rgba(192, 132, 252, 0.4);">
            ${otpCode}
          </span>
        </div>
        <p style="color: rgba(255,255,255,0.45); font-size: 12px; margin-top: 14px;">
          This code expires in <strong>10 minutes</strong>. Never share this code with anyone.
        </p>
      </td>
    </tr>

    <!-- Security Information -->
    <tr>
      <td style="padding: 20px 36px 36px 36px; border-top: 1px solid rgba(255,255,255,0.08); background: #0a0910;">
        <table width="100%" border="0" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size: 12px; color: rgba(255,255,255,0.5); line-height: 1.6;">
              &bull; <strong>Robinhood Chain Non-Custodial:</strong> We never hold private keys.<br>
              &bull; If you did not request this login code, you can safely ignore this email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- Footer -->
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; margin-top: 20px;">
    <tr>
      <td style="text-align: center; font-size: 11px; color: rgba(255,255,255,0.3);">
        &copy; ${new Date().getFullYear()} Valence Protocol. All rights reserved.
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: `Your Valence Login Code: ${otpCode}`,
        html: emailHtml,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[Resend API Error]:", data);
      return {
        success: false,
        error: data.message || "Failed to send email via Resend.",
      };
    }

    return {
      success: true,
      messageId: data.id,
      isMock: false,
    };
  } catch (err: any) {
    console.error("[Email Dispatch Exception]:", err);
    return {
      success: false,
      error: err.message || "Network exception sending email.",
    };
  }
}
