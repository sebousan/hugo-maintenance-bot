// utils/git.js
import { execSync } from 'child_process';
import { logger } from './logger.js';
import fs from 'fs';

/**
 * Retrieves detailed differences for a file
 * @param {string} filePath - Path to the repository
 * @param {string} fileName - File name to compare
 * @returns {Array<string>} - Formatted diff lines
 */
export function getFileDiffs(filePath, fileName) {
  try {
    return execSync(`cd ${filePath} && git diff --unified=0 ${fileName}`)
      .toString()
      .trim()
      .split('\n')
      .filter(line => {
        // Keep diff lines and context
        return line.startsWith('+') ||
          line.startsWith('-') ||
          line.startsWith('@') ||
          line.trim() === '' ||
          line.startsWith('\\'); // For line continuations
      })
      .filter(line => {
        // Exclude file headers
        return !line.startsWith('+++') && !line.startsWith('---');
      });
  } catch (err) {
    logger.error(`❌ Failed to get diff for ${fileName}: ${err.message}`);
    return [];
  }
}

/**
 * Checks changes in go.mod/go.sum files
 * @param {string} filePath - Path to the repository
 * @returns {Array<{file: string, changes: string[]}>} - List of modified files with their diffs
 */
export function checkHugoModulesChanges(filePath) {
  const filesToCheck = ['go.mod', 'go.sum'];
  const result = [];

  for (const file of filesToCheck) {
    const fullPath = `${filePath}/${file}`;
    if (!fs.existsSync(fullPath)) continue;

    const diff = getFileDiffs(filePath, file);
    if (diff.length > 0) {
      result.push({
        file,
        changes: diff
      });
    }
  }

  return result;
}

/**
 * Configures Git user and email for CI environments
 * @param {string} email - Git user email
 * @param {string} name - Git user name
 */
export function configureGit(email, name) {
  if (process.env.CI) {
    try {
      execSync(`git config --global user.email "${email}"`);
      execSync(`git config --global user.name "${name}"`);
      logger.info('✅ Git configured for CI');
    } catch (err) {
      logger.error(`❌ Failed to configure Git: ${err.message}`);
    }
  }
}
