import { defineCommand } from "citty";
import { join } from "path";
import { logger } from "../utils/logger.js";
import { writeFile, fileExists } from "../utils/fs.js";
import { renderTemplate } from "../utils/template.js";
import { kebabCase, pascalCase } from "../utils/case.js";
import { ensureShadcnComponents, type ShadcnDependencyType } from "../utils/shadcn.js";

const LAYOUT_PRESETS = ["dashboard", "auth", "marketing"] as const;
type LayoutPreset = (typeof LAYOUT_PRESETS)[number];

export default defineCommand({
  meta: {
    name: "add:layout",
    description: "Create a layout (dashboard, auth, marketing, or custom)",
  },
  args: {
    name: {
      type: "positional",
      description: `Layout name: ${LAYOUT_PRESETS.join(", ")} or custom name`,
      required: true,
    },
  },
  async run({ args }) {
    const cwd = process.cwd();
    const name = kebabCase(args.name as string);
    const isPreset = LAYOUT_PRESETS.includes(name as LayoutPreset);
    const pascalName = pascalCase(name);

    // Determine route folder structure
    // dashboard -> src/routes/dashboard/_layout.tsx
    // auth -> src/routes/(auth)/_layout.tsx (route group)
    const routeFolder = name === "auth" ? `(${name})` : name;
    const layoutFile = join(cwd, "src/routes", routeFolder, "_layout.tsx");

    if (await fileExists(layoutFile)) {
      logger.error(`Layout "${name}" already exists`);
      process.exit(1);
    }

    logger.blank();

    // Install shadcn components for presets
    if (isPreset && (name === "dashboard" || name === "marketing")) {
      await ensureShadcnComponents(cwd, name as ShadcnDependencyType);
    }

    const templateData = {
      name,
      pascalName,
    };

    // Determine which template to use
    const templateFolder = isPreset ? name : "base";

    // Create layout file
    const layoutContent = renderTemplate(`layout/${templateFolder}/_layout.tsx.hbs`, templateData);
    await writeFile(layoutFile, layoutContent);
    logger.success(`Created src/routes/${routeFolder}/_layout.tsx`);

    // Dashboard has extra components
    if (name === "dashboard") {
      const dashboardComponents = [
        {
          template: "layout/dashboard/components/Sidebar.tsx.hbs",
          dest: "src/components/layout/Sidebar.tsx",
        },
        {
          template: "layout/dashboard/components/Header.tsx.hbs",
          dest: "src/components/layout/Header.tsx",
        },
        {
          template: "layout/dashboard/components/index.ts.hbs",
          dest: "src/components/layout/index.ts",
        },
      ];

      for (const { template, dest } of dashboardComponents) {
        const content = renderTemplate(template, templateData);
        await writeFile(join(cwd, dest), content);
        logger.success(`Created ${dest}`);
      }
    }

    // Create example child route
    const exampleRoute = join(cwd, "src/routes", routeFolder, "index.tsx");
    if (!(await fileExists(exampleRoute))) {
      const exampleContent = renderTemplate(`layout/${templateFolder}/index.tsx.hbs`, templateData);
      await writeFile(exampleRoute, exampleContent);
      logger.success(`Created src/routes/${routeFolder}/index.tsx`);
    }

    logger.blank();
    logger.log(`  Layout "${name}" created!`);
    logger.blank();
    logger.log("  Files:");
    logger.log(`    - src/routes/${routeFolder}/_layout.tsx`);
    if (name === "dashboard") {
      logger.log("    - src/components/layout/Sidebar.tsx");
      logger.log("    - src/components/layout/Header.tsx");
    }
    logger.blank();
    logger.log(`  Routes inside src/routes/${routeFolder}/ will use this layout.`);
    logger.blank();
    if (name === "dashboard") {
      logger.log("  Example: http://localhost:3000/dashboard");
    } else if (name === "auth") {
      logger.log("  Example: Add login.tsx to the route group for /login");
    }
    logger.blank();
  },
});
