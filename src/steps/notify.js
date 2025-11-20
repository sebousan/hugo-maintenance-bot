// scripts/steps/notify.js
import { logger } from "../utils/logger.js";
import { sendEmailNotification } from "../utils/notifications/email.js";
import { sendSlackNotification } from "../utils/notifications/slack.js";
import { sendWhatsappNotification } from "../utils/notifications/whatsapp.js";

export async function notify(site, prUrl, status) {
  const subject = `Mise à jour modules ${status} pour ${site.title}`;
  const message = `
🤖 *Hugo Maintenance Bot*

📌 *Site*: ${site.title} (${site.website.url})
📊 *Statut*: ${status === 'succès' ? '✅ Succès' : '❌ Échec'}
🔗 *PR*: ${prUrl || 'N/A'}

_Ceci est un message automatique._
`;

  logger.info(`📢 Sending notifications for ${site.title}...`);

  const results = await Promise.allSettled([
    sendEmailNotification(null, subject, message), // null 'to' uses env var
    sendSlackNotification(message),
    sendWhatsappNotification(message)
  ]);

  const failures = results.filter(r => r.status === 'rejected' || (r.value && !r.value.success));

  if (failures.length === 0) {
    logger.success("✅ All notifications sent successfully");
  } else {
    logger.warn(`⚠️ Some notifications failed or were skipped`);
  }
}
