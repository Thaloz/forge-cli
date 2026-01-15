import { defineCommand } from "citty";
import { join } from "path";
import { logger } from "../utils/logger.js";
import { writeFile, fileExists, readFile } from "../utils/fs.js";
import { renderTemplate } from "../utils/template.js";
import { kebabCase, camelCase } from "../utils/case.js";

export default defineCommand({
  meta: {
    name: "add:util",
    description: "Create a new utility function in src/lib",
  },
  args: {
    name: {
      type: "positional",
      description: "Utility name (will be camelCased)",
      required: true,
    },
  },
  async run({ args }) {
    const cwd = process.cwd();
    const rawName = args.name as string;
    const utilName = camelCase(rawName);
    const fileName = kebabCase(rawName);

    const libDir = join(cwd, "src/lib");
    const utilPath = join(libDir, `${fileName}.ts`);
    const indexPath = join(libDir, "index.ts");

    // Check if util already exists
    if (await fileExists(utilPath)) {
      logger.error(`Utility "${utilName}" already exists at src/lib/${fileName}.ts`);
      process.exit(1);
    }

    logger.blank();

    const templateData = {
      utilName,
      fileName,
    };

    // Create utility file
    const content = renderTemplate("util/util.ts.hbs", templateData);
    await writeFile(utilPath, content);
    logger.success(`Created src/lib/${fileName}.ts`);

    // Update or create index.ts
    const exportLine = `export { ${utilName} } from "./${fileName}";`;

    if (await fileExists(indexPath)) {
      const existing = await readFile(indexPath);
      if (!existing.includes(exportLine)) {
        await writeFile(indexPath, existing.trim() + "\n" + exportLine + "\n");
        logger.success("Updated src/lib/index.ts");
      }
    } else {
      await writeFile(indexPath, exportLine + "\n");
      logger.success("Created src/lib/index.ts");
    }

    logger.blank();
    logger.log(`  Utility "${utilName}" created!`);
    logger.blank();
    logger.log("  Location:");
    logger.log(`    src/lib/${fileName}.ts`);
    logger.blank();
    logger.log("  Import:");
    logger.log(`    import { ${utilName} } from "~/lib";`);
    logger.blank();
  },
});
