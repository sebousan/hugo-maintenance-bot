// scripts/steps/cleanupTempDir.js
import { logger } from "../utils/logger.js";
import fs from 'fs';

/**
 * Nettoie un dossier temporaire
 * @param {string} tmpPath - Chemin du dossier à supprimer
 * @param {string} [siteName] - Nom du site (pour les logs)
 * @returns {Promise<boolean>} - True si la suppression a réussi
 */
export async function cleanupTempDir(tmpPath, siteName = '') {
  if (!tmpPath) {
    logger.warn('⚠️ No temp path provided for cleanup');
    return false;
  }

  try {
    if (fs.existsSync(tmpPath)) {
      // Supprime récursivement le dossier et son contenu
      fs.rmSync(tmpPath, { recursive: true, force: true });
      logger.info(`🧹 Cleaned up temp directory for ${siteName || 'site'}: ${tmpPath}`);
      return true;
    }
    logger.info(`ℹ️ Temp directory not found (already cleaned): ${tmpPath}`);
    return true;
  } catch (err) {
    logger.error(`❌ Failed to clean up temp directory ${tmpPath}: ${err.message}`);
    return false;
  }
}
