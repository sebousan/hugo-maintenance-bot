// scripts/steps/mergePullRequest.js
import { getOctokit } from '../utils/github.js';
import { logger } from '../utils/logger.js';

/**
 * Wait for PR checks to complete
 * @param {Object} octokit - GitHub API client
 * @param {string} owner - Repository owner
 * @param {string} repoName - Repository name
 * @param {number} prNumber - PR number
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} delayMs - Delay between retries in ms
 */
async function waitForChecks(octokit, owner, repoName, prNumber, maxRetries = 30, delayMs = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const { data: pr } = await octokit.pulls.get({
        owner,
        repo: repoName,
        pull_number: prNumber
      });

      logger.info(`🔍 Check PR status (attempt ${i + 1}/${maxRetries}): mergeable=${pr.mergeable}, state=${pr.mergeable_state}`);

      // mergeable_state: clean = ready, dirty = conflicts, blocked = checks failing, unknown = pending
      if (pr.mergeable_state === 'clean') {
        logger.success(`✅ PR checks passed, ready to merge`);
        return true;
      }

      if (pr.mergeable_state === 'dirty') {
        logger.error(`❌ PR has conflicts, cannot merge`);
        return false;
      }

      if (pr.mergeable_state === 'blocked') {
        logger.warn(`⏳ PR checks are failing, waiting...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }

      // unknown or other states - wait and retry
      logger.info(`⏳ PR state is ${pr.mergeable_state}, waiting for checks...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    } catch (err) {
      logger.error(`⚠️ Error checking PR status: ${err.message}`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  logger.error(`❌ Checks did not pass after ${maxRetries * delayMs / 1000}s`);
  return false;
}

/**
 * Merge a Pull Request if all checks are OK
 * @param {Object} site - Site configuration
 * @param {string} branchName - Branch name to merge
 * @param {number} prNumber - PR number (optional)
 * @param {string} [mergeMethod='squash'] - Merge method (squash, merge, rebase)
 * @returns {Promise<{status: string, mergeSha?: string, error?: string}>}
 */
export async function mergePullRequest(site, branchName, prNumber = null, mergeMethod = 'squash') {
  if (!site?.repository?.repo) {
    logger.error('❌ Invalid site configuration: missing repository.repo');
    return { status: "error", error: "Invalid site configuration" };
  }

  const octokit = getOctokit();
  const [owner, repoName] = site.repository.repo.split('/');
  const baseBranch = site.repository.branch || 'main';

  try {
    logger.info(`🔄 Attempting to merge PR for branch ${branchName}...`);

    // 1. Get PR if number not provided
    if (!prNumber) {
      const { data: prs } = await octokit.pulls.list({
        owner,
        repo: repoName,
        head: `${owner}:${branchName}`,
        base: baseBranch,
        state: 'open'
      });

      if (prs.length === 0) {
        logger.error(`❌ No open PR found for branch ${branchName}`);
        return { status: "error", error: "No open PR found" };
      }
      prNumber = prs[0].number;
      logger.info(`📋 Found PR #${prNumber} for branch ${branchName}`);
    }

    // 2. Check if already merged
    const { data: prCheck } = await octokit.pulls.get({
      owner,
      repo: repoName,
      pull_number: prNumber
    });

    if (prCheck.merged) {
      logger.info(`ℹ️ PR #${prNumber} is already merged`);
      return { status: "already_merged", mergeSha: prCheck.merge_commit_sha };
    }

    // 3. Wait for checks to pass
    logger.info(`⏳ Waiting for PR checks to complete...`);
    const checksReady = await waitForChecks(octokit, owner, repoName, prNumber);

    if (!checksReady) {
      logger.error(`❌ PR #${prNumber} checks failed or timed out`);
      return { status: "error", error: "Checks failed or timed out" };
    }

    // 4. Final check before merge
    const { data: prFinal } = await octokit.pulls.get({
      owner,
      repo: repoName,
      pull_number: prNumber
    });

    if (!prFinal.mergeable) {
      logger.error(`❌ PR #${prNumber} is not mergeable`);
      return { status: "error", error: "PR not mergeable" };
    }

    // 5. Merge the PR
    const { data: mergeResult } = await octokit.pulls.merge({
      owner,
      repo: repoName,
      pull_number: prNumber,
      merge_method: mergeMethod,
      commit_title: `chore: merge ${branchName} updates`,
      commit_message: `Automated merge of Hugo modules updates from ${branchName}`
    });

    logger.success(`✅ Successfully merged PR #${prNumber} with method ${mergeMethod}`);

    // 6. Delete the branch after successful merge
    try {
      logger.info(`🗑️ Deleting branch ${branchName}...`);
      await octokit.git.deleteRef({
        owner,
        repo: repoName,
        ref: `heads/${branchName}`
      });
      logger.success(`✅ Branch ${branchName} deleted`);
    } catch (err) {
      logger.warn(`⚠️ Failed to delete branch ${branchName}: ${err.message}`);
      // Don't fail the merge if branch deletion fails
    }

    return {
      status: "success",
      mergeSha: mergeResult.sha,
      prNumber: prFinal.number
    };
  } catch (err) {
    logger.error(`❌ Failed to merge PR: ${err.message}`);

    if (err.status === 405) {
      logger.error("🔒 Merge method not allowed or PR not mergeable");
      return { status: "error", error: "Merge not allowed" };
    } else if (err.status === 404) {
      logger.error("📋 PR not found");
      return { status: "error", error: "PR not found" };
    } else if (err.status === 403) {
      logger.error("🔒 Permission denied. Check your GitHub token permissions.");
      return { status: "error", error: "Permission denied" };
    }

    return { status: "error", error: err.message };
  }
}