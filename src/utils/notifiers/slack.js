// utils/notifiers/slack.js
import { buildNotificationPayload } from "./message.js";

/**
 * Sends a notification to a Slack channel via incoming webhook
 * @param {Object} params - Notification parameters (see buildNotificationPayload)
 * @returns {Promise<void>}
 */
export async function notifySlack(params) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const { title, isFail, fields } = buildNotificationPayload(params);

  // Build Slack Block Kit blocks
  const blocks = [
    {
      type: "header",
      text: { type: "plain_text", text: title, emoji: true }
    },
    { type: "divider" }
  ];

  // Map common fields to Slack section blocks
  fields.forEach(f => {
    blocks.push({
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*${f.name}*\n${f.value}` }
      ]
    });
  });

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blocks })
  });
}
