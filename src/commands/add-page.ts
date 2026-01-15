import { defineCommand } from "citty";
import { join } from "path";
import { logger } from "../utils/logger.js";
import { writeFile, fileExists, readFile } from "../utils/fs.js";
import { renderTemplate } from "../utils/template.js";
import { kebabCase, pascalCase } from "../utils/case.js";

export default defineCommand({
  meta: {
    name: "add:page",
    description: "Create a non-feature page (about, pricing, settings)",
  },
  args: {
    name: {
      type: "positional",
      description: "Page name or path (e.g., 'about' or 'settings/profile')",
      required: true,
    },
  },
  async run({ args }) {
    const cwd = process.cwd();
    const rawName = args.name as string;
    const name = kebabCase(rawName);

    // Handle nested paths (settings/profile -> settings.profile for file naming)
    const routePath = name.includes("/") ? name.replace(/\//g, ".") : name;
    const componentFolder = name.includes("/") ? name.split("/")[0] : name;
    const componentName = pascalCase(name.replace(/\//g, "-"));

    // Check if page already exists
    const routeFile = join(cwd, "src/routes", `${routePath}.tsx`);
    if (await fileExists(routeFile)) {
      logger.error(`Page "${name}" already exists at ${routeFile}`);
      process.exit(1);
    }

    logger.blank();

    const templateData = {
      name,
      routePath,
      componentFolder,
      componentName,
    };

    // Create route file
    const routeContent = renderTemplate("page/route.tsx.hbs", templateData);
    await writeFile(routeFile, routeContent);
    logger.success(`Created src/routes/${routePath}.tsx`);

    // Create component content file
    const contentPath = join(cwd, "src/components", componentFolder, `${componentName}Content.tsx`);
    const contentTemplate = renderTemplate("page/components/Content.tsx.hbs", templateData);
    await writeFile(contentPath, contentTemplate);
    logger.success(`Created src/components/${componentFolder}/${componentName}Content.tsx`);

    // Handle index.ts - append if exists, create if not
    const indexPath = join(cwd, "src/components", componentFolder, "index.ts");
    const exportLine = `export { ${componentName}Content } from "./${componentName}Content";`;

    if (await fileExists(indexPath)) {
      const existing = await readFile(indexPath);
      if (!existing.includes(exportLine)) {
        await writeFile(indexPath, existing.trim() + "\n" + exportLine + "\n");
        logger.success(`Updated src/components/${componentFolder}/index.ts`);
      }
    } else {
      const indexContent = renderTemplate("page/components/index.ts.hbs", templateData);
      await writeFile(indexPath, indexContent);
      logger.success(`Created src/components/${componentFolder}/index.ts`);
    }

    logger.blank();
    logger.log(`  Page "${name}" created!`);
    logger.blank();
    logger.log("  Files:");
    logger.log(`    - src/routes/${routePath}.tsx`);
    logger.log(`    - src/components/${componentFolder}/${componentName}Content.tsx`);
    logger.blank();
    logger.log(`  Visit: http://localhost:3000/${name.replace(/\./g, "/")}`);
    logger.blank();
  },
});
