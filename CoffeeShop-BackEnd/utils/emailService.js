const nodemailer = require('nodemailer');

// Create a real email transporter
const createTransporter = async () => {
  try {
    // For Gmail using App Password
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'beudeancarmen1@gmail.com',
        pass: process.env.EMAIL_PASS 
      }
    });
  } catch (error) {
    console.error('Error creating email transporter:', error);
    throw error;
  }
};

/**
 * Send verification email with code
 * @param {string} email - Recipient email address
 * @param {string} code - Verification code
 * @returns {Promise<boolean>} - Whether email was sent successfully
 */
const sendVerificationEmail = async (email, code) => {
  try {
    const transporter = await createTransporter();
    
    const info = await transporter.sendMail({
      from: '"Pirate Café" <beudeancarmen1@gmail.com>',
      to: email,
      subject: 'Your Verification Code - Pirate Café',
      text: `Your verification code is: ${code}. This code will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #7C90A0; text-align: center;">Pirate Café Verification</h2>
          <p>Hello,</p>
          <p>Your verification code for Pirate Café is:</p>
          <div style="text-align: center; margin: 20px 0;">
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; padding: 10px; background-color: #f7f7f7; border-radius: 4px; display: inline-block;">${code}</div>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #888;">
            <p>© ${new Date().getFullYear()} Pirate Café. All rights reserved.</p>
          </div>
        </div>
      `
    });
    
    console.log('Message sent: %s', info.messageId);
    console.log('Email sent to: %s', email);
    return true;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    if (error.response) {
      console.error('SMTP response:', error.response);
    }
    return false;
  }
};

module.exports = {
  sendVerificationEmail
};