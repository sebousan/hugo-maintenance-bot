import axios from 'axios';
import { logger } from '../logger.js';

export async function sendWhatsappNotification(message) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM; // e.g., "whatsapp:+14155238886"
  const toNumber = process.env.TWILIO_WHATSAPP_TO;     // e.g., "whatsapp:+1234567890"

  if (!accountSid || !authToken || !fromNumber || !toNumber) {
    logger.warn("⚠️ Twilio credentials (SID, TOKEN, FROM, TO) are missing. Skipping WhatsApp notification.");
    return { success: false, error: "Missing Twilio credentials" };
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const data = new URLSearchParams();
    data.append('To', toNumber);
    data.append('From', fromNumber);
    data.append('Body', message);

    const auth = {
      username: accountSid,
      password: authToken
    };

    await axios.post(url, data, { auth });

    logger.success("📱 WhatsApp notification sent via Twilio");
    return { success: true };
  } catch (err) {
    logger.error(`❌ Failed to send WhatsApp notification: ${err.message}`);
    if (err.response) {
      logger.error(`Twilio Error: ${JSON.stringify(err.response.data)}`);
    }
    return { success: false, error: err.message };
  }
}
