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
    throw new Error('Email service not configured');
  }

  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  
  sendSmtpEmail.sender = {
    email: from || 'noreply@guftagu.com',
    name: fromName || 'Guftagu Support'
  };
  
  sendSmtpEmail.to = [{ email: to }];
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = html;

  try {
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`Email sent successfully to ${to}`);
    return result;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};

module.exports = { sendEmail };
