// scripts/steps/createPullRequest.js
import { getOctokit } from '../utils/github.js';
import { logger } from '../utils/logger.js';
import { mergePullRequest } from './mergePullRequest.js';
import { generateFullReport } from "../utils/markownGenerator.js";

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
      siteName});
      
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
