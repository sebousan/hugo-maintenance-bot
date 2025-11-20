// scripts/utils/logger.js
import chalk from "chalk";

function timestamp() {
  return new Date().toISOString().replace("T", " ").split(".")[0];
}

export const logger = {
  info: (msg) => console.log(chalk.cyan(`[${timestamp()}] ℹ️  ${msg}`)),
  success: (msg) => console.log(chalk.green(`[${timestamp()}] ✅ ${msg}`)),
  warn: (msg) => console.warn(chalk.yellow(`[${timestamp()}] ⚠️  ${msg}`)),
  error: (msg) => console.error(chalk.red(`[${timestamp()}] ❌ ${msg}`)),
};
