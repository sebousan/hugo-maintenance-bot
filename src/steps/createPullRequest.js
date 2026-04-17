// steps/createPullRequest.js
import { getOctokit } from '../utils/github.js';
import { logger } from '../utils/logger.js';
import { mergePullRequest } from './mergePullRequest.js';
import { generateFullReport } from "../utils/markdownGenerator.js";

/**
 * Creates a pull request on GitHub for Hugo module updates
 * @param {Object} site - Site configuration object
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} status - Status of the update (OK/Fail)
 * @param {Array<string>} diffPages - Array of pages with differences
 * @param {Array<Object>} updatedModules - Array of updated module objects
 * @param {string} branchName - Name of the branch to create PR from
 * @returns {Promise<string>} URL of the created pull request
 */
export async function createPullRequest(site, date, status, diffPages, updatedModules, branchName) {
  const octokit = getOctokit();
  const [owner, repo] = site.repository.repo.split('/');

  try {
    logger.info(`🔍 Checking if branch ${branchName} exists on remote...`);
    try {
      await octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${branchName}`,
      });
      logger.info(`✅ Branch ${branchName} found.`);
    } catch (err) {
      if (err.status === 404) {
        logger.error(`❌ Branch ${branchName} does not exist on remote.`);
        logger.error('💡 Did the git push succeed? Check the updateModules step.');
        throw new Error(`Branch ${branchName} not found on remote.`);
      } else {
        throw err;
      }
    }

    // PR Content
    let pages = site.website.pages;
    let siteName = site.name;
    let prContent = generateFullReport({
      date,
      status,
      diffPages,
      updatedModules,
      prUrl: false,
      pages,
      siteName,
      locale: site.locale
    });

    // Create PR
    logger.info(`🔗 Creating pull request for branch ${branchName}...`);
    const { data: pr } = await octokit.pulls.create({
      owner,
      repo,
      title: `chore: update Hugo modules (${date})`,
      head: branchName,
      base: site.repository.branch,
      body: prContent
    });
    logger.success(`✅ PR #${pr.number} created: ${pr.html_url}`);

    // Merge PR
    if (status !== "Fail") {
      await mergePullRequest(site, branchName, pr.number);
    }

    return pr.html_url;
  } catch (err) {
    logger.error(`❌ Failed to create pull request: ${err.message}`);
    throw err;
  }
}
