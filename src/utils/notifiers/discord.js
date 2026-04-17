// utils/notifiers/discord.js

/**
 * Sends a notification to a Discord channel via webhook
 * @param {Object} params - Notification parameters
 * @param {string} params.siteName - Site name
 * @param {string} params.date - Date in YYYY-MM-DD format
 * @param {string} params.status - Status of the update (OK/Fail)
 * @param {string|null} params.prUrl - Pull request URL
 * @param {Array<string>} params.diffPages - Pages with visual differences
 * @param {Array<Object>} params.updatedModules - Updated Hugo modules
 * @returns {Promise<void>}
 */
export async function notifyDiscord({ siteName, date, status, prUrl, diffPages, updatedModules }) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const isFail = status === "Fail";
  const color = isFail ? 0xe74c3c : 0x2ecc71; // red / green

  const fields = [];

  // Updated modules list
  if (updatedModules?.length > 0) {
    const moduleNames = updatedModules.map(m => `\`${m.file}\``).join(", ");
    fields.push({ name: "Updated modules", value: moduleNames, inline: false });
  }

  // Diff pages if any
  if (isFail && diffPages?.length > 0) {
    fields.push({
      name: "Pages with visual differences",
      value: diffPages.map(p => `\`${p || "/"}\``).join("\n"),
      inline: false
    });
  }

  // Pull request link
  if (prUrl) {
    fields.push({ name: "Pull request", value: prUrl, inline: false });
  }

  const embed = {
    title: `${isFail ? "❌" : "✅"} ${siteName} — Hugo modules update`,
    color,
    fields,
    footer: { text: "hugo-maintenance-bot" },
    timestamp: new Date().toISOString()
  };

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [embed] })
  });
}
