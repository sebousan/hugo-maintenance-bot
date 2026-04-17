// index.js
import { cleanupTempDir } from "./steps/cleanupTempDir.js";
import { commitMaintenance } from "./steps/commitMaintenance.js";
import { compareScreenshots } from "./steps/compareScreenshots.js";
import { createBranch } from "./steps/createBranch.js";
import { createContent } from "./steps/createContent.js";
import { createScreenshots } from "./steps/createScreenshots.js";
import { createPullRequest } from "./steps/createPullRequest.js";
import { updateModules } from "./steps/updateModules.js";
import { loadSites } from "./utils/websites.js";
import { logger } from "./utils/logger.js";
import { notify } from "./utils/notifiers/index.js";
import dotenv from "dotenv";
dotenv.config();

/**
 * Main function to process Hugo maintenance for sites
 * @param {string|null} arg - Command argument (null = all, 'folder' = by folder, 'site' = by name)
 * @returns {Promise<void>}
 */
export async function main(arg) {
  const sites = loadSites(arg);
  const date = new Date().toISOString().split("T")[0];

  if (sites.length === 0) {
    logger.error(`❌ No sites found. Usage:`);
    process.exit(1);
  }

  logger.info(`📦 Processing ${sites.length} site(s)...`);

  for (const site of sites) {
    logger.info(`Processing site: ${site.name} (${date})`);
    try {
      // 1. Update modules
      logger.info("🔄 Updating Hugo modules...");
      const { status: statusUpdate, tmpPath, publicPath, hasChanges, updatedModules } = await updateModules(site, date);

      // Stop if error or no module changes
      if (statusUpdate === "error") {
        logger.error(`❌ Failed to process ${site.name}. Skipping.`);
        continue;
      }
      if (statusUpdate === "build_error") {
        logger.error(`❌ Build failed for ${site.name}. Skipping.`);
        continue;
      }
      if (!hasChanges) {
        logger.info(`⏭️ No changes for ${site.name}. Skipping screenshots.`);
        logger.info("🔍 Delete temp directory...");
        await cleanupTempDir(tmpPath, site.name);
        continue;
      }

      // 2. Screenshots (before)
      logger.info("📸 Capturing 'online' screenshots...");
      await createScreenshots(site, "before", date);

      // 3. Screenshots (after)
      logger.info("📸 Capturing 'local' screenshots...");
      await createScreenshots(site, "after", date, publicPath);

      // 4. Compare screenshots
      logger.info("🔍 Comparing screenshots...");
      const { status, diffPages } = await compareScreenshots(site, date);

      // 5. Create branch
      logger.info("🏹 Creating branch...");
      const { status: statusBranch, branchName } = await createBranch(site, tmpPath, date);
      if (statusBranch === "error") {
        await cleanupTempDir(tmpPath, site.name);
        continue;
      }

      // 6. Create pull request
      logger.info("🔗 Creating pull request...");
      const prUrl = await createPullRequest(site, date, status, diffPages, updatedModules, branchName);

      // 7. Create content
      logger.info("📝 Creating content...");
      await createContent(site, date, status, diffPages, updatedModules, prUrl);

      // 8. Commit screenshots and content
      await commitMaintenance(site.name, date);

      // 9. Clean
      logger.info("🔍 Delete temp directory...");
      await cleanupTempDir(tmpPath, site.name);

      // 10. Notify
      await notify({ siteName: site.name, date, status, prUrl, siteUrl: site.website.url, diffPages, updatedModules });

    } catch (err) {
      logger.error(`❌ Failed to process site ${site.name}: ${err.message}`);
    }
  }
}