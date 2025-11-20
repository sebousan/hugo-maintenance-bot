import axios from 'axios';
import { logger } from '../logger.js';

export async function sendSlackNotification(message) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  try {
    if (!webhookUrl) {
      logger.warn("⚠️ SLACK_WEBHOOK_URL is not defined. Skipping Slack notification.");
      return { success: false, error: "SLACK_WEBHOOK_URL not defined" };
    }

    await axios.post(webhookUrl, {
      text: message
    });

    logger.success("🤖 Slack notification sent");
    return { success: true };
  } catch (err) {
    logger.error(`❌ Failed to send Slack notification: ${err.message}`);
    return { success: false, error: err.message };
  }
}