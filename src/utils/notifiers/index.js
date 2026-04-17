// utils/notifiers/index.js
import { logger } from "../logger.js";
import { notifyDiscord } from "./discord.js";
import { notifySlack } from "./slack.js";

// Registry of available notifiers, each activated by its env var
const NOTIFIERS = [
  { name: "discord", envVar: "DISCORD_WEBHOOK_URL", fn: notifyDiscord },
  { name: "slack",   envVar: "SLACK_WEBHOOK_URL",   fn: notifySlack   },
  // To add a new channel, register it here:
  // { name: "email", envVar: "SMTP_HOST", fn: notifyEmail },
];

/**
 * Sends notifications to all configured channels
 * @param {Object} params - Notification parameters
 * @param {string} params.siteName - Site name
 * @param {string} params.date - Date in YYYY-MM-DD format
 * @param {string} params.status - Status of the update (OK/Fail)
 * @param {string|null} params.prUrl - Pull request URL
 * @param {Array<string>} params.diffPages - Pages with visual differences
 * @param {Array<Object>} params.updatedModules - Updated Hugo modules
 * @returns {Promise<void>}
 */
export async function notify(params) {
  const active = NOTIFIERS.filter(n => process.env[n.envVar]);

  if (active.length === 0) {
    logger.info("ℹ️ No notifier configured, skipping notifications.");
    return;
  }

  await Promise.all(
    active.map(async (notifier) => {
      try {
        await notifier.fn(params);
        logger.success(`✅ Notification sent via ${notifier.name}`);
      } catch (err) {
        logger.error(`❌ Failed to send notification via ${notifier.name}: ${err.message}`);
      }
    })
  );
}
