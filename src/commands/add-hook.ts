import { defineCommand } from "citty";
import { join } from "path";
import { logger } from "../utils/logger.js";
import { writeFile, fileExists, readFile } from "../utils/fs.js";
import { renderTemplate } from "../utils/template.js";
import { kebabCase, camelCase } from "../utils/case.js";

export default defineCommand({
  meta: {
    name: "add:hook",
    description: "Create a new React hook",
  },
  args: {
    name: {
      type: "positional",
      description: "Hook name (will be prefixed with 'use' if needed)",
      required: true,
    },
    feature: {
      type: "string",
      description: "Append to a feature's hooks.ts file",
    },
  },
  async run({ args }) {
    const cwd = process.cwd();
    const rawName = args.name as string;
    const feature = args.feature as string | undefined;

    // Ensure hook name starts with "use"
    let hookName = camelCase(rawName);
    if (!hookName.startsWith("use")) {
      hookName = `use${hookName.charAt(0).toUpperCase()}${hookName.slice(1)}`;
    }

    const templateData = {
      hookName,
      name: rawName,
    };

    logger.blank();

    if (feature) {
      // Append to feature's hooks.ts
      const featureName = kebabCase(feature);
      const hooksPath = join(cwd, "src/features", featureName, "hooks.ts");

      if (!(await fileExists(hooksPath))) {
        logger.error(`Feature "${featureName}" does not exist or has no hooks.ts`);
        logger.log(`  Run: forge add:feature ${featureName}`);
        process.exit(1);
      }

      const existing = await readFile(hooksPath);

      // Check if hook already exists
      if (existing.includes(`export function ${hookName}`)) {
        logger.error(`Hook "${hookName}" already exists in ${featureName}/hooks.ts`);
        process.exit(1);
      }

      // Append the hook
      const hookCode = renderTemplate("hook/feature-hook.ts.hbs", templateData);
      await writeFile(hooksPath, existing.trim() + "\n\n" + hookCode);
      logger.success(`Added ${hookName} to src/features/${featureName}/hooks.ts`);

      logger.blank();
      logger.log(`  Hook "${hookName}" added to feature "${featureName}"!`);
      logger.blank();
      logger.log("  Import:");
      logger.log(`    import { ${hookName} } from "~/features/${featureName}";`);
    } else {
      // Create global hook in src/hooks
      const hooksDir = join(cwd, "src/hooks");
      const hookFile = join(hooksDir, `${hookName}.ts`);
      const indexPath = join(hooksDir, "index.ts");

      if (await fileExists(hookFile)) {
        logger.error(`Hook "${hookName}" already exists at src/hooks/${hookName}.ts`);
        process.exit(1);
      }

      // Create hook file
      const content = renderTemplate("hook/global-hook.ts.hbs", templateData);
      await writeFile(hookFile, content);
      logger.success(`Created src/hooks/${hookName}.ts`);

      // Update or create index.ts
      const exportLine = `export { ${hookName} } from "./${hookName}";`;

      if (await fileExists(indexPath)) {
        const existing = await readFile(indexPath);
        if (!existing.includes(exportLine)) {
          await writeFile(indexPath, existing.trim() + "\n" + exportLine + "\n");
          logger.success("Updated src/hooks/index.ts");
        }
      } else {
        await writeFile(indexPath, exportLine + "\n");
        logger.success("Created src/hooks/index.ts");
      }

      logger.blank();
      logger.log(`  Hook "${hookName}" created!`);
      logger.blank();
      logger.log("  Location:");
      logger.log(`    src/hooks/${hookName}.ts`);
      logger.blank();
      logger.log("  Import:");
      logger.log(`    import { ${hookName} } from "~/hooks";`);
    }

    logger.blank();
  },
});
