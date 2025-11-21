// steps/cleanupTempDir.js
import { logger } from "../utils/logger.js";
import fs from 'fs';

/**
 * Cleans up a temporary directory
 * @param {string} tmpPath - Path to the directory to delete
 * @param {string} [siteName] - Site name (for logs)
 * @returns {Promise<boolean>} - True if deletion succeeded
 */
export async function cleanupTempDir(tmpPath, siteName = '') {
  if (!tmpPath) {
    logger.warn('⚠️ No temp path provided for cleanup');
    return false;
  }

  try {
    if (fs.existsSync(tmpPath)) {
      // Recursively delete the directory and its contents
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
