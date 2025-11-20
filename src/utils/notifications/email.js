import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { logger } from '../logger.js';

const OAuth2 = google.auth.OAuth2;

let transporter;

async function getTransporter() {
  if (!transporter) {
    try {
      const oauth2Client = new OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        'https://developers.google.com/oauthplayground'
      );

      oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
      });

      const accessToken = await oauth2Client.getAccessToken();

      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: process.env.EMAIL_USER,
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
          accessToken: accessToken.token
        }
      });

      // Vérifie la connexion
      await transporter.verify();
      logger.success('✉️ Email transporter (OAuth2) is ready');
    } catch (err) {
      logger.error(`❌ Failed to initialize email transporter: ${err.message}`);
      throw err;
    }
  }
  return transporter;
}

export async function sendEmailNotification(to, subject, message, attachments = []) {
  try {
    const mailTransporter = await getTransporter();

    const mailOptions = {
      from: `"Hugo Modules Updater" <${process.env.EMAIL_USER}>`,
      to: to || process.env.EMAIL_USER,
      subject: `[Hugo Modules] ${subject}`,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Mise à jour des modules Hugo</h2>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <pre style="white-space: pre-wrap; margin: 0;">${message}</pre>
          </div>
          <footer style="margin-top: 20px; font-size: 0.8em; color: #6c757d;">
            <p>Ce message a été généré automatiquement par le système de mise à jour des modules Hugo.</p>
            <p>Pour vous désabonner, contactez l'administrateur.</p>
          </footer>
        </div>
      `,
      attachments: attachments.map(attach => ({
        filename: attach.filename,
        path: attach.path
      }))
    };

    const info = await mailTransporter.sendMail(mailOptions);
    logger.success(`✉️ Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    logger.error(`❌ Failed to send email: ${err.message}`);

    // Gestion des erreurs spécifiques
    if (err.code === 'EAUTH') {
      logger.error("🔒 Authentication failed. Check your OAuth2 credentials.");
    } else if (err.code === 'ENOTFOUND') {
      logger.error("🌐 Could not connect to SMTP server.");
    } else if (err.response && err.response.body) {
      logger.error(`📜 API Error: ${JSON.stringify(err.response.body)}`);
    }

    return { success: false, error: err.message };
  }
}
