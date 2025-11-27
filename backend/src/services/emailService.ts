import nodemailer from 'nodemailer';
import { logger } from '../config/logger';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const sendVerificationEmail = async (email: string, token: string) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
  
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Verifica tu cuenta - Galleros.Net',
    html: `
      <h1>Verifica tu cuenta</h1>
      <p>Haz clic en el siguiente enlace para verificar tu cuenta:</p>
      <a href="${verificationUrl}">Verificar cuenta</a>
      <p>Este enlace expira en 24 horas.</p>
    `
  };
  
  await transporter.sendMail(mailOptions);
  logger.info(`Verification email sent to ${email}`);
};