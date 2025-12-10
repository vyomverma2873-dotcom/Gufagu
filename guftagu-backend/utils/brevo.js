const SibApiV3Sdk = require('sib-api-v3-sdk');

// Initialize Brevo (Sendinblue) API client
let apiInstance = null;

const initBrevo = () => {
  if (!process.env.BREVO_API_KEY) {
    console.warn('Brevo API key not configured. Email sending will be disabled.');
    return null;
  }

  const defaultClient = SibApiV3Sdk.ApiClient.instance;
  const apiKey = defaultClient.authentications['api-key'];
  apiKey.apiKey = process.env.BREVO_API_KEY;

  apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  return apiInstance;
};

/**
 * Send OTP email via Brevo
 */
const sendOTPEmail = async (email, otp) => {
  if (!apiInstance) {
    initBrevo();
  }

  if (!apiInstance) {
    console.log(`[DEV MODE] OTP for ${email}: ${otp}`);
    return { success: true, messageId: 'dev-mode' };
  }

  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.to = [{ email }];
  sendSmtpEmail.sender = {
    email: process.env.BREVO_SENDER_EMAIL || 'noreply@guftagu.com',
    name: process.env.BREVO_SENDER_NAME || 'Guftagu',
  };
  sendSmtpEmail.subject = 'Your Guftagu Login Code';
  sendSmtpEmail.htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
      <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1a1a1a; font-size: 28px; margin: 0;">Guftagu</h1>
          <p style="color: #666; margin-top: 8px;">Connect with the world</p>
        </div>
        
        <p style="color: #333; font-size: 16px; line-height: 1.5;">
          Your verification code is:
        </p>
        
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: white;">${otp}</span>
        </div>
        
        <p style="color: #666; font-size: 14px; line-height: 1.5;">
          This code will expire in <strong>10 minutes</strong>. Do not share this code with anyone.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          If you didn't request this code, you can safely ignore this email.
        </p>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    return { success: true, messageId: response.messageId };
  } catch (error) {
    console.error('Brevo email error:', error);
    throw new Error('Failed to send OTP email');
  }
};

module.exports = {
  initBrevo,
  sendOTPEmail,
};
