#!/usr/bin/env node

import { main } from "../src/run.js";
import { logger } from "../src/utils/logger.js";

const arg = process.argv[2] || null;

main(arg).catch(err => {
  logger.error(`💥 Fatal error: ${err.message}`);
  process.exit(1);
});
