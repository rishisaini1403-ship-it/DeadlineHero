import { Resend } from 'resend';

let resend: Resend | null = null;

export const initializeEmail = (): Resend | null => {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️  RESEND_API_KEY not configured. Email service disabled.');
    return null;
  }

  resend = new Resend(apiKey);
  console.log('✅ Email service initialized with Resend');
  return resend;
};

export const getEmailClient = (): Resend | null => {
  return resend;
};
