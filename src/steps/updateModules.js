// scripts/steps/updateModules.js
import { execSync } from 'child_process';
import { logger } from '../utils/logger.js';
import { checkHugoModulesChanges } from '../utils/git.js'
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Execute yarn with retry logic
 * @param {string} tmpPath - Temporary directory path
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} delayMs - Delay between retries in ms
 */
async function yarnWithRetry(tmpPath, maxRetries = 3, delayMs = 5000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`📦 Installing Node.js dependencies (attempt ${attempt}/${maxRetries})...`);
      execSync(`cd ${tmpPath} && yarn install`, { stdio: "inherit" });
      logger.success(`✅ Dependencies installed successfully`);
      return true;
    } catch (err) {
      if (attempt === maxRetries) {
        throw err;
      }

      // Check if it's a registry/network error
      const errorMsg = err.message || '';
      if (errorMsg.includes('500') || errorMsg.includes('registry') || errorMsg.includes('ENOTFOUND')) {
        logger.warn(`⚠️ Registry error, retrying in ${delayMs / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }

      // Other errors - fail immediately
      throw err;
    }
  }
}

export async function updateModules(site, date) {
  const tmpPath = path.join(os.tmpdir(), `${site.name}-${Date.now()}`);
  const token = process.env.GH_TOKEN;
  const repoUrl = token
    ? `https://${token}@github.com/${site.repository.repo}.git`
    : `git@github.com:${site.repository.repo}.git`;
  const branch = site.repository.branch || "main";
  const publicPath = path.join(tmpPath, "public");

  try {
    logger.info(`📥 Cloning repository into ${tmpPath}...`);
    execSync(`git clone --depth=1 --branch ${branch} ${repoUrl} ${tmpPath}`);

    if (!fs.existsSync(path.join(tmpPath, "go.mod"))) {
      logger.error("❌ No go.mod file found. This is not a Hugo project with modules.");
      return { status: "error", tmpPath: null, publicPath: null, hasChanges: false, changedFiles: [] };
    }

    logger.info("🔄 Updating Hugo modules...");
    execSync(`cd ${tmpPath} && hugo mod get -u && hugo mod tidy`, { stdio: "inherit" });

    // Check if there are changes to commit
    const status = execSync(`cd ${tmpPath} && git status --porcelain`).toString().trim();
    logger.info(`📊 Git status:\n${status}`);

    if (!status) {
      logger.warn(`⚠️ No changes to commit`);
      return { status: "unchanged", tmpPath, publicPath: null, hasChanges: false, changedFiles: [] };
    }

    // Skip if only go.sum changed
    const changedFiles = status.split('\n').map(line => line.trim().split(/\s+/).pop()).filter(f => f);
    const meaningfulChanges = changedFiles.filter(file => file !== 'go.sum');

    if (changedFiles.length === 1 && changedFiles[0] === 'go.sum') {
      logger.warn(`⚠️ Only go.sum changed. Skipping.`);
      return { status: "unchanged", tmpPath, publicPath: null, hasChanges: false, changedFiles: [] };
    }

    logger.info(`✅ Meaningful changes: ${meaningfulChanges.join(', ')}`);

    // Verify Hugo module changes
    const updatedModules = checkHugoModulesChanges(tmpPath);

    if (updatedModules.length === 0) {
      logger.info("ℹ️ No changes detected in Hugo modules.");
      return { status: "unchanged", tmpPath, publicPath: null, hasChanges: false, changedFiles: [] };
    }
    updatedModules.forEach(module => {
      logger.info(`📝 Modified files: ${module.file}`);
      logger.info(`📝 Changes: ${module.changes}`);
    });

    // Install Node.js dependencies if necessary
    if (fs.existsSync(path.join(tmpPath, "package.json"))) {
      try {
        await yarnWithRetry(tmpPath, 3, 5000);
      } catch (err) {
        logger.warn(`⚠️ Failed to install dependencies after retries, continuing with build...`);
        logger.info(`💡 Dependencies may be cached or not critical for this build`);
      }
    }

    // Build the site
    logger.info("🏗️ Building static site...");
    execSync(`cd ${tmpPath} && hugo --gc --minify`, { stdio: "inherit" });
    if (!fs.existsSync(publicPath)) {
      throw new Error("Build failed: public directory not created.");
    }

    logger.success(`✅ Site built successfully in ${publicPath}`);
    return {
      status: "updated",
      tmpPath,
      publicPath,
      hasChanges: true,
      updatedModules
    };
  } catch (err) {
    logger.error(`❌ Failed to update modules: ${err.message}`);
    return { status: "error", tmpPath: null, publicPath: null, hasChanges: false, changedFiles: [] };
  }
}