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

// Email footer template
const getEmailFooter = () => `
  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
    <div style="text-align: center;">
      <h3 style="color: #1a1a1a; font-size: 18px; margin: 0 0 10px 0;">Guftagu</h3>
      <p style="color: #666; font-size: 13px; margin: 0 0 15px 0;">Connect with the world</p>
      
      <div style="margin: 15px 0;">
        <p style="color: #666; font-size: 12px; margin: 5px 0;">
          <strong>Email:</strong> vyomverma2873@gmail.com
        </p>
        <p style="color: #666; font-size: 12px; margin: 5px 0;">
          <strong>Phone:</strong> +91 8766355495
        </p>
      </div>
      
      <p style="color: #999; font-size: 11px; margin: 15px 0 5px 0;">
        Made by Vyom Verma, Full-Stack Developer
      </p>
      <p style="color: #999; font-size: 11px; margin: 0;">
        &copy; ${new Date().getFullYear()} Guftagu. All rights reserved.
      </p>
    </div>
  </div>
`;

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

/**
 * Send ban notification email
 */
const sendBanNotificationEmail = async (userEmail, username, banDetails) => {
  if (!apiInstance) {
    initBrevo();
  }

  if (!apiInstance) {
    console.log(`[DEV MODE] Ban notification for ${userEmail}`);
    return { success: true, messageId: 'dev-mode' };
  }

  const { reason, banType, banUntil, description, duration } = banDetails;
  
  // Format ban reason for display
  const reasonLabels = {
    'inappropriate_content': 'Inappropriate Content',
    'harassment': 'Harassment',
    'spam': 'Spam',
    'multiple_reports': 'Multiple Reports',
    'admin_discretion': 'Admin Discretion',
    'underage': 'Underage User',
    'impersonation': 'Impersonation',
    'terms_violation': 'Terms of Service Violation',
    'other': 'Policy Violation'
  };
  
  const formattedReason = reasonLabels[reason] || reason;
  
  // Calculate human-readable duration
  let banDurationText = 'Permanent';
  if (banType !== 'permanent' && banUntil) {
    const now = new Date();
    const endDate = new Date(banUntil);
    const diffMs = endDate - now;
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 1) {
      banDurationText = `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else if (diffHours >= 1) {
      banDurationText = `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    } else {
      banDurationText = 'Less than 1 hour';
    }
  }
  
  const banExpiryFormatted = banType === 'permanent' 
    ? 'Never (Permanent Ban)' 
    : new Date(banUntil).toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });

  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.to = [{ email: userEmail }];
  sendSmtpEmail.sender = {
    email: process.env.BREVO_SENDER_EMAIL || 'noreply@guftagu.com',
    name: process.env.BREVO_SENDER_NAME || 'Guftagu',
  };
  sendSmtpEmail.subject = 'You Have Been Banned';
  sendSmtpEmail.htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
      <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1a1a1a; font-size: 28px; margin: 0;">Guftagu</h1>
          <p style="color: #666; margin-top: 8px;">Account Notification</p>
        </div>
        
        <div style="background: #fee2e2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <h2 style="color: #dc2626; font-size: 18px; margin: 0 0 8px 0;">⚠️ Account Banned</h2>
          <p style="color: #991b1b; font-size: 14px; margin: 0;">Your Guftagu account has been suspended.</p>
        </div>
        
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Dear ${username || 'User'},
        </p>
        
        <p style="color: #333; font-size: 15px; line-height: 1.6;">
          We regret to inform you that your Guftagu account has been banned due to a violation of our community guidelines.
        </p>
        
        <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="color: #666; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Reason:</td>
              <td style="color: #1a1a1a; font-size: 14px; font-weight: 600; padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${formattedReason}</td>
            </tr>
            <tr>
              <td style="color: #666; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Ban Type:</td>
              <td style="color: #1a1a1a; font-size: 14px; font-weight: 600; padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${banType === 'permanent' ? 'Permanent' : 'Temporary'}</td>
            </tr>
            <tr>
              <td style="color: #666; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Duration:</td>
              <td style="color: #1a1a1a; font-size: 14px; font-weight: 600; padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${banDurationText}</td>
            </tr>
            <tr>
              <td style="color: #666; font-size: 14px; padding: 8px 0;">Expires:</td>
              <td style="color: #1a1a1a; font-size: 14px; font-weight: 600; padding: 8px 0; text-align: right;">${banExpiryFormatted}</td>
            </tr>
          </table>
          ${description ? `
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
              <p style="color: #666; font-size: 13px; margin: 0 0 8px 0;">Additional Details:</p>
              <p style="color: #333; font-size: 14px; margin: 0;">${description}</p>
            </div>
          ` : ''}
        </div>
        
        <p style="color: #333; font-size: 15px; line-height: 1.6;">
          During this ban period, you will not be able to:
        </p>
        <ul style="color: #666; font-size: 14px; line-height: 1.8; padding-left: 20px;">
          <li>Log in to your account</li>
          <li>Send or receive messages</li>
          <li>Make video or voice calls</li>
          <li>Access any Guftagu features</li>
        </ul>
        
        <p style="color: #333; font-size: 15px; line-height: 1.6;">
          If you believe this ban was issued in error, you may contact our support team at <a href="mailto:vyomverma2873@gmail.com" style="color: #2563eb;">vyomverma2873@gmail.com</a> to appeal this decision.
        </p>
        
        <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 24px;">
          Please review our <a href="https://guftagu.vercel.app/terms" style="color: #2563eb;">Terms of Service</a> and <a href="https://guftagu.vercel.app/privacy" style="color: #2563eb;">Privacy Policy</a> for more information about our community guidelines.
        </p>
        
        ${getEmailFooter()}
      </div>
    </body>
    </html>
  `;

  try {
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`Ban notification sent to ${userEmail}`);
    return { success: true, messageId: response.messageId };
  } catch (error) {
    console.error('Ban notification email error:', error);
    // Don't throw - ban should still succeed even if email fails
    return { success: false, error: error.message };
  }
};

module.exports = {
  initBrevo,
  sendOTPEmail,
  sendBanNotificationEmail,
};
