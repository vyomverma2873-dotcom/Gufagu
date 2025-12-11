const ContactQuery = require('../models/ContactQuery');
const { sendEmail } = require('../utils/email');

// Submit contact query (public)
exports.submitQuery = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Basic validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Rate limiting - check recent submissions from same email
    // Skip rate limiting for admin email
    const isAdminEmail = email.toLowerCase() === 'vyomverma2873@gmail.com';
    
    if (!isAdminEmail) {
      const recentQuery = await ContactQuery.findOne({
        email: email.toLowerCase(),
        createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
      });

      if (recentQuery) {
        return res.status(429).json({ 
          error: 'You can only submit one query per hour. Please wait before submitting again.' 
        });
      }
    }

    // Get IP and user agent for spam prevention
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // Create contact query
    const contactQuery = new ContactQuery({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      subject: subject.trim(),
      message: message.trim(),
      ipAddress,
      userAgent,
    });

    await contactQuery.save();
    console.log(`Contact query saved: ${contactQuery._id} from ${email}`);

    // Send confirmation email to user
    try {
      console.log(`Sending confirmation email to: ${email}`);
      await sendEmail({
        to: email,
        subject: 'Thank You - Query Received',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Thank You for Contacting Us!</h2>
            <p>Hi ${name},</p>
            <p>We have received your query and our team will review it shortly.</p>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #555;">Query Details:</h3>
              <p style="margin: 5px 0;"><strong>Subject:</strong> ${subject}</p>
              <p style="margin: 5px 0;"><strong>Message:</strong></p>
              <p style="margin: 5px 0; padding: 10px; background: white; border-radius: 4px;">${message}</p>
            </div>
            
            <p>We'll get back to you as soon as possible.</p>
            <p style="color: #666; font-size: 14px;">If you didn't submit this query, please ignore this email.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">
              This is an automated message from Guftagu Support.<br>
              © ${new Date().getFullYear()} Guftagu. All rights reserved.
            </p>
          </div>
        `,
      });
      console.log(`✓ Confirmation email sent successfully to ${email}`);
    } catch (emailError) {
      console.error(`✗ Failed to send confirmation email to ${email}:`, emailError.response?.body || emailError.message || emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Your query has been submitted successfully. We will get back to you soon!',
      queryId: contactQuery._id,
    });
  } catch (error) {
    console.error('Submit contact query error:', error);
    res.status(500).json({ error: 'Failed to submit query. Please try again.' });
  }
};
