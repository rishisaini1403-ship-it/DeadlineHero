const { Resend } = require('resend');
let resend = null;
const initializeEmail = () => {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️  RESEND_API_KEY not configured. Email service disabled.');
    return null;
  }

  resend = new Resend(apiKey);
  console.log('✅ Email service initialized with Resend');
  return resend;
};
const getEmailClient = () => {
  return resend;
};

module.exports = { initializeEmail, getEmailClient };
