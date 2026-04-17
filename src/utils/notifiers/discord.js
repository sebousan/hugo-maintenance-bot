// utils/notifiers/discord.js
import { buildNotificationPayload } from "./message.js";

/**
 * Sends a notification to a Discord channel via webhook
 * @param {Object} params - Notification parameters (see buildNotificationPayload)
 * @returns {Promise<void>}
 */
export async function notifyDiscord(params) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const { title, isFail, fields } = buildNotificationPayload(params);
  const color = isFail ? 0xe74c3c : 0x2ecc71; // red / green

  // Map common fields to Discord embed format
  const embedFields = fields.map(f => ({ name: f.name, value: f.value, inline: false }));

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [{
        title,
        color,
        fields: embedFields,
        footer: { text: "hugo-maintenance-bot" },
        timestamp: new Date().toISOString()
      }]
    })
  });
}
