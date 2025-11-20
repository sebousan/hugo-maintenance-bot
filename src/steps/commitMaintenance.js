// scripts/steps/commitMaintenance.js
import { execSync } from "child_process";
import { logger } from "../utils/logger.js";

/**
 * Commit et push les screenshots et le contenu vers le repo maintenance.uncinq.dev
 * @param {string} siteName - Nom du site (ex: "miriamlasserre")
 * @param {string} date - Date au format YYYY-MM-DD
 */
export async function commitMaintenance(siteName, date) {
  const repoDir = process.cwd(); // Chemin racine du repo maintenance.uncinq.dev

  try {
    logger.info(`📁 Committing screenshots and content for ${siteName} (${date})...`);

    // Ajoute les screenshots et le contenu à git
    execSync(`cd ${repoDir} && git add -A`);

    // Vérifie s'il y a des changements
    const hasChanges = execSync(`cd ${repoDir} && git status --porcelain`).toString().trim();
    if (!hasChanges) {
      logger.info(`No changes to commit for ${siteName}. Skipping.`);
      return;
    }

    // Commit avec un message clair
    execSync(`cd ${repoDir} && git commit -m "chore: add screenshots and content for ${siteName} (${date})"`);

    // Push vers la branche main
    execSync(`cd ${repoDir} && git push origin main`);

    logger.success(`✅ Screenshots and content committed and pushed for ${siteName} (${date})`);
  } catch (err) {
    logger.error(`❌ Failed to commit screenshots and content: ${err.message}`);
    throw err;
  }
}
