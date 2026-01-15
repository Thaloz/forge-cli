import { defineCommand } from "citty";
import { join } from "path";
import { logger } from "../utils/logger.js";
import { writeFile, fileExists, readFile } from "../utils/fs.js";
import { renderTemplate } from "../utils/template.js";
import { kebabCase, pascalCase } from "../utils/case.js";

export default defineCommand({
  meta: {
    name: "add:component",
    description:
      "Create a React component. Creates: <target>/<Name>.tsx, updates index.ts. Default: src/components/ui/. Use --feature, --page, or --layout to target specific folders.",
  },
  args: {
    name: {
      type: "positional",
      description: "Component name (will be PascalCased)",
      required: true,
    },
    feature: {
      type: "string",
      description: "Add to a feature's components folder",
    },
    page: {
      type: "string",
      description: "Add to a page's components folder",
    },
    layout: {
      type: "string",
      description: "Add to a layout's components folder",
    },
  },
  async run({ args }) {
    const cwd = process.cwd();
    const rawName = args.name as string;
    const componentName = pascalCase(rawName);
    const feature = args.feature as string | undefined;
    const page = args.page as string | undefined;
    const layout = args.layout as string | undefined;

    // Determine target directory
    let targetDir: string;
    let indexPath: string;
    let locationLabel: string;

    if (feature) {
      const featureName = kebabCase(feature);
      targetDir = join(cwd, "src/features", featureName, "components");
      indexPath = join(targetDir, "index.ts");
      locationLabel = `src/features/${featureName}/components`;

      // Verify feature exists
      if (!(await fileExists(join(cwd, "src/features", featureName)))) {
        logger.error(`Feature "${featureName}" does not exist`);
        logger.log(`  Run: forge add:feature ${featureName}`);
        process.exit(1);
      }
    } else if (page) {
      const pageName = kebabCase(page);
      targetDir = join(cwd, "src/components", pageName);
      indexPath = join(targetDir, "index.ts");
      locationLabel = `src/components/${pageName}`;
    } else if (layout) {
      const layoutName = kebabCase(layout);
      targetDir = join(cwd, "src/components", layoutName);
      indexPath = join(targetDir, "index.ts");
      locationLabel = `src/components/${layoutName}`;
    } else {
      // Global component in src/components
      targetDir = join(cwd, "src/components/ui");
      indexPath = join(targetDir, "index.ts");
      locationLabel = "src/components/ui";
    }

    // Check if component already exists
    const componentPath = join(targetDir, `${componentName}.tsx`);
    if (await fileExists(componentPath)) {
      logger.error(`Component "${componentName}" already exists at ${locationLabel}`);
      process.exit(1);
    }

    logger.blank();

    const templateData = {
      componentName,
      name: kebabCase(rawName),
    };

    // Create component file
    const content = renderTemplate("component/Component.tsx.hbs", templateData);
    await writeFile(componentPath, content);
    logger.success(`Created ${locationLabel}/${componentName}.tsx`);

    // Update or create index.ts
    const exportLine = `export { ${componentName} } from "./${componentName}";`;

    if (await fileExists(indexPath)) {
      const existing = await readFile(indexPath);
      if (!existing.includes(exportLine)) {
        await writeFile(indexPath, existing.trim() + "\n" + exportLine + "\n");
        logger.success(`Updated ${locationLabel}/index.ts`);
      }
    } else {
      await writeFile(indexPath, exportLine + "\n");
      logger.success(`Created ${locationLabel}/index.ts`);
    }

    logger.blank();
    logger.log(`  Component "${componentName}" created!`);
    logger.blank();
    logger.log("  Location:");
    logger.log(`    ${locationLabel}/${componentName}.tsx`);
    logger.blank();
    logger.log("  Import:");
    if (feature) {
      logger.log(`    import { ${componentName} } from "~/features/${kebabCase(feature)}/components";`);
    } else if (page || layout) {
      const folder = page ? kebabCase(page) : kebabCase(layout!);
      logger.log(`    import { ${componentName} } from "~/components/${folder}";`);
    } else {
      logger.log(`    import { ${componentName} } from "~/components/ui";`);
    }
    logger.blank();
  },
});
