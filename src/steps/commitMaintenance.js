// steps/commitMaintenance.js
import { execSync } from "child_process";
import { logger } from "../utils/logger.js";

/**
 * Commit and push screenshots and content to the maintenance repo
 * @param {string} siteName - Site name (e.g., "miriamlasserre")
 * @param {string} date - Date in YYYY-MM-DD format
 */
export async function commitMaintenance(siteName, date) {
  const repoDir = process.cwd(); // Root path of the maintenance repo

  try {
    logger.info(`📁 Committing screenshots and content for ${siteName} (${date})...`);

    // Add screenshots and content to git
    execSync(`cd ${repoDir} && git add -A`);

    // Check if there are changes
    const hasChanges = execSync(`cd ${repoDir} && git status --porcelain`).toString().trim();
    if (!hasChanges) {
      logger.info(`No changes to commit for ${siteName}. Skipping.`);
      return;
    }

    // Commit with a clear message
    execSync(`cd ${repoDir} && git commit -m "chore: add screenshots and content for ${siteName} (${date})"`);

    // Pull and rebase to main branch
    execSync(`cd ${repoDir} && git pull --rebase origin main`);

    // Push to main branch
    execSync(`cd ${repoDir} && git push origin main`);

    logger.success(`✅ Screenshots and content committed and pushed for ${siteName} (${date})`);
  } catch (err) {
    logger.error(`❌ Failed to commit screenshots and content: ${err.message}`);
    throw err;
  }
}
