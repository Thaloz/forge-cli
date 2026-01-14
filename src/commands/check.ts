import { defineCommand } from "citty";
import { logger } from "../utils/logger.js";
import { runAllValidators } from "../validators/index.js";
import pc from "picocolors";

export default defineCommand({
  meta: {
    name: "check",
    description: "Validate project structure and conventions",
  },
  async run() {
    const cwd = process.cwd();

    logger.blank();
    logger.log("  Checking project structure...");
    logger.blank();

    const results = await runAllValidators(cwd);

    let totalErrors = 0;
    let totalWarnings = 0;

    for (const result of results) {
      if (result.passed && result.warnings.length === 0) {
        logger.success(`${result.rule} valid`);
      } else if (result.passed && result.warnings.length > 0) {
        logger.warn(`${result.rule} (${result.warnings.length} warning${result.warnings.length > 1 ? "s" : ""})`);
        for (const warning of result.warnings) {
          logger.log(`    ${pc.yellow("→")} ${warning.file}: ${warning.message}`);
        }
        totalWarnings += result.warnings.length;
      } else {
        logger.error(`${result.rule} violated`);
        for (const error of result.errors) {
          logger.log(`    ${pc.red("→")} ${error.file}: ${error.message}`);
        }
        for (const warning of result.warnings) {
          logger.log(`    ${pc.yellow("→")} ${warning.file}: ${warning.message}`);
        }
        totalErrors += result.errors.length;
        totalWarnings += result.warnings.length;
      }
    }

    logger.blank();

    if (totalErrors > 0) {
      logger.log(`  ${pc.red(`${totalErrors} error${totalErrors > 1 ? "s" : ""} found.`)}`);
      if (totalWarnings > 0) {
        logger.log(`  ${pc.yellow(`${totalWarnings} warning${totalWarnings > 1 ? "s" : ""}.`)}`);
      }
      logger.blank();
      process.exit(1);
    } else if (totalWarnings > 0) {
      logger.log(`  ${pc.yellow(`${totalWarnings} warning${totalWarnings > 1 ? "s" : ""} found.`)}`);
      logger.blank();
    } else {
      logger.log(`  ${pc.green("All checks passed!")}`);
      logger.blank();
    }
  },
});
