// scripts/steps/notifyEmail.js
import { logger } from "../utils/logger.js";

export async function notify(site, prUrl, status) {
  const subject = `Mise à jour modules ${status} pour ${site.title}`;
  const message = `
Statut: ${status}
PR: ${prUrl}
Site: ${site.website.url}
`;

  // TODO
}
