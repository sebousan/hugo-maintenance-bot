// utils/git.js
import { execSync } from 'child_process';
import { logger } from './logger.js';
import fs from 'fs';

/**
 * Récupère les différences détaillées pour un fichier
 * @param {string} filePath - Chemin vers le dépôt
 * @param {string} fileName - Nom du fichier à comparer
 * @returns {Array<string>} - Lignes de diff formatées
 */
export function getFileDiffs(filePath, fileName) {
  try {
    return execSync(`cd ${filePath} && git diff --unified=0 ${fileName}`)
      .toString()
      .trim()
      .split('\n')
      .filter(line => {
        // Garde les lignes de diff et le contexte
        return line.startsWith('+') ||
          line.startsWith('-') ||
          line.startsWith('@') ||
          line.trim() === '' ||
          line.startsWith('\\'); // Pour les continuations de ligne
      })
      .filter(line => {
        // Exclut les headers de fichier
        return !line.startsWith('+++') && !line.startsWith('---');
      });
  } catch (err) {
    logger.error(`❌ Failed to get diff for ${fileName}: ${err.message}`);
    return [];
  }
}

/**
 * Vérifie les changements dans les fichiers go.mod/go.sum
 * @param {string} filePath - Chemin vers le dépôt
 * @returns {Array<{file: string, changes: string[]}>} - Liste des fichiers modifiés avec leurs diffs
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
