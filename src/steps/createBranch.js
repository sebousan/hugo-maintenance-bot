// steps/createBranch.js
import { getOctokit } from '../utils/github.js';
import { logger } from '../utils/logger.js';
import { execSync } from 'child_process';
import { configureGit } from '../utils/git.js';

/**
 * Creates a new branch with module updates and pushes to GitHub
 * @param {Object} site - Site configuration object
 * @param {string} tmpPath - Temporary directory path
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object>} Object containing status and branchName
 */
export async function createBranch(site, tmpPath, date) {
  if (!site?.repository?.repo) {
    logger.error('❌ Invalid site configuration: missing repository.repo');
    return { status: "error", branchName: null };
  }

  const octokit = getOctokit();
  const branchName = `mods-update-${date}-${Date.now()}`;
  const [owner, repoName] = site.repository.repo.split('/');

  try {
    logger.info(`📌 Creating branch ${branchName} with modifications...`);

    // Check if there are changes to commit
    const status = execSync(`cd ${tmpPath} && git status --porcelain`).toString().trim();
    logger.info(`📊 Git status:\n${status}`);

    // 1. Create branch locally
    execSync(`cd ${tmpPath} && git checkout -b ${branchName}`);

    // 2. Add modifications
    try {
      execSync(`cd ${tmpPath} && git add -A`);
    } catch (err) {
      logger.error(`❌ Failed to add files: ${err.message}`);
      return { status: "error", branchName: null };
    }

    // 3. Configure git
    const gitEmail = process.env.GIT_USER_EMAIL;
    const gitName = process.env.GIT_USER_NAME || "[Bot] Maintenance";
    configureGit(gitEmail, gitName);

    // 4. Commit
    try {
      execSync(`cd ${tmpPath} && git commit -m "chore: update Hugo modules (${date})"`);
    } catch (err) {
      logger.error(`❌ Commit failed: ${err.message}`);
      return { status: "error", branchName: null };
    }

    // 5. Get commit SHA
    const newSha = execSync(`cd ${tmpPath} && git rev-parse HEAD`).toString().trim();
    logger.info(`📋 Commit SHA ${newSha}`);

    try {
      // 6. Try to create branch on GitHub
      await octokit.git.createRef({
        owner,
        repo: repoName,
        ref: `refs/heads/${branchName}`,
        sha: newSha,
      });
      logger.info(`📌 Branch ${branchName} created on GitHub.`);
    } catch (err) {
      if (err.status === 422) {
        logger.info(`📋 Branch ${branchName} already exists on GitHub.`);
      } else {
        throw err;
      }
    }

    // 7. Push branch
    execSync(`cd ${tmpPath} && git push --force origin ${branchName}`);
    logger.success(`✅ Branch ${branchName} pushed with modifications.`);
    return { status: "success", branchName };
  } catch (err) {
    logger.error(`❌ Failed to create branch: ${err.message}`);
    if (err.status === 403) {
      logger.error("🔒 Permission denied. Check your GitHub token permissions.");
    }
    return { status: "error", branchName: null };
  }
}