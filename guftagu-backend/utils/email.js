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
 * Send email via Brevo
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.from - Sender email (optional)
 * @param {string} options.fromName - Sender name (optional)
 */
const sendEmail = async ({ to, subject, html, from, fromName }) => {
  if (!apiInstance) {
    apiInstance = initBrevo();
  }

  if (!apiInstance) {
    console.error('Email service not configured - BREVO_API_KEY missing');
    throw new Error('Email service not configured');
  }

  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  
  sendSmtpEmail.sender = {
    email: from || process.env.BREVO_SENDER_EMAIL || 'noreply@guftagu.com',
    name: fromName || process.env.BREVO_SENDER_NAME || 'Guftagu Support'
  };
  
  sendSmtpEmail.to = [{ email: to }];
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = html;

  try {
    console.log(`Attempting to send email to ${to} with subject: ${subject}`);
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✓ Email sent successfully to ${to}`, result);
    return result;
  } catch (error) {
    console.error(`✗ Failed to send email to ${to}:`, error.response?.body || error.message || error);
    throw error;
  }
};

module.exports = { sendEmail };
