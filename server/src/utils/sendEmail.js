import nodemailer from 'nodemailer';
import env from '../config/env.js';
import logger from '../config/logger.js';

/**
 * Sends an email if SMTP is configured; otherwise logs the message (dev mode),
 * so password-reset flows work locally without an SMTP server.
 */
export default async function sendEmail({ to, subject, html, text }) {
  if (!env.mail.host || !env.mail.user) {
    logger.info(`✉️  [DEV email] To: ${to} | ${subject}\n${text || html}`);
    return { mocked: true };
  }

  const transporter = nodemailer.createTransport({
    host: env.mail.host,
    port: env.mail.port,
    secure: env.mail.port === 465,
    auth: { user: env.mail.user, pass: env.mail.pass },
  });

  const info = await transporter.sendMail({ from: env.mail.from, to, subject, text, html });
  logger.info(`✉️  Email sent: ${info.messageId}`);
  return info;
}
