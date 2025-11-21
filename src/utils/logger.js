// utils/logger.js
import chalk from "chalk";

/**
 * Returns current timestamp in ISO format without milliseconds
 * @returns {string} Formatted timestamp string
 */
function timestamp() {
  return new Date().toISOString().replace("T", " ").split(".")[0];
}

export const logger = {
  info: (msg) => console.log(chalk.cyan(`[${timestamp()}] ℹ️  ${msg}`)),
  success: (msg) => console.log(chalk.green(`[${timestamp()}] ✅ ${msg}`)),
  warn: (msg) => console.warn(chalk.yellow(`[${timestamp()}] ⚠️  ${msg}`)),
  error: (msg) => console.error(chalk.red(`[${timestamp()}] ❌ ${msg}`)),
};
