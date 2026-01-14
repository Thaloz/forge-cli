import { defineCommand } from "citty";
import { join } from "path";
import { logger } from "../utils/logger.js";
import { renderTemplate } from "../utils/template.js";
import { writeFile, fileExists, ensureDir } from "../utils/fs.js";
import { kebabCase } from "../utils/case.js";
import pc from "picocolors";

interface FileToCreate {
  templatePath: string;
  destPath: string;
}

export default defineCommand({
  meta: {
    name: "init",
    description: "Create a new project with TanStack Start + Convex + Tailwind",
  },
  args: {
    name: {
      type: "positional",
      description: "Name of the project",
      required: true,
    },
  },
  async run({ args }) {
    const rawName = args.name as string;
    const name = kebabCase(rawName);
    const cwd = process.cwd();
    const projectDir = join(cwd, name);

    // Check if directory already exists
    if (await fileExists(projectDir)) {
      logger.error(`Directory "${name}" already exists`);
      process.exit(1);
    }

    logger.blank();
    logger.log(`  Creating project "${name}"...`);
    logger.blank();

    const templateData = { name };

    // Define files to create
    const files: FileToCreate[] = [
      // Root config files
      { templatePath: "init/package.json.hbs", destPath: join(projectDir, "package.json") },
      { templatePath: "init/tsconfig.json.hbs", destPath: join(projectDir, "tsconfig.json") },
      { templatePath: "init/biome.json.hbs", destPath: join(projectDir, "biome.json") },
      { templatePath: "init/tailwind.config.ts.hbs", destPath: join(projectDir, "tailwind.config.ts") },
      { templatePath: "init/postcss.config.js.hbs", destPath: join(projectDir, "postcss.config.js") },
      { templatePath: "init/app.config.ts.hbs", destPath: join(projectDir, "app.config.ts") },

      // App files
      { templatePath: "init/app/client.tsx.hbs", destPath: join(projectDir, "app/client.tsx") },
      { templatePath: "init/app/ssr.tsx.hbs", destPath: join(projectDir, "app/ssr.tsx") },
      { templatePath: "init/app/router.tsx.hbs", destPath: join(projectDir, "app/router.tsx") },
      { templatePath: "init/app/routes/__root.tsx.hbs", destPath: join(projectDir, "app/routes/__root.tsx") },
      { templatePath: "init/app/routes/index.tsx.hbs", destPath: join(projectDir, "app/routes/index.tsx") },

      // Src files
      { templatePath: "init/src/lib/cn.ts.hbs", destPath: join(projectDir, "src/lib/cn.ts") },
      { templatePath: "init/src/providers/index.tsx.hbs", destPath: join(projectDir, "src/providers/index.tsx") },

      // Convex files
      { templatePath: "init/convex/schema.ts.hbs", destPath: join(projectDir, "convex/schema.ts") },

      // CLAUDE.md - THE HOOK
      { templatePath: "init/claude.md.hbs", destPath: join(projectDir, "CLAUDE.md") },
    ];

    // Create all files
    for (const file of files) {
      const content = renderTemplate(file.templatePath, templateData);
      await writeFile(file.destPath, content);
      const relativePath = file.destPath.replace(projectDir + "/", "");
      logger.success(`Created ${relativePath}`);
    }

    // Create empty directories
    const emptyDirs = [
      join(projectDir, "src/components/ui"),
      join(projectDir, "src/features"),
      join(projectDir, "src/hooks"),
      join(projectDir, "convex/features"),
    ];

    for (const dir of emptyDirs) {
      await ensureDir(dir);
      // Create .gitkeep to track empty directories
      await writeFile(join(dir, ".gitkeep"), "");
    }

    // Create global CSS file
    const globalCss = `@tailwind base;
@tailwind components;
@tailwind utilities;
`;
    await writeFile(join(projectDir, "src/styles.css"), globalCss);
    logger.success("Created src/styles.css");

    // Create .gitignore
    const gitignore = `node_modules
dist
.vinxi
.env
.env.local
`;
    await writeFile(join(projectDir, ".gitignore"), gitignore);
    logger.success("Created .gitignore");

    // Create .env.example
    const envExample = `VITE_CONVEX_URL=
`;
    await writeFile(join(projectDir, ".env.example"), envExample);
    logger.success("Created .env.example");

    logger.blank();
    logger.log(`  ${pc.green("Project created successfully!")}`);
    logger.blank();
    logger.log("  Next steps:");
    logger.log(`    1. ${pc.cyan(`cd ${name}`)}`);
    logger.log(`    2. ${pc.cyan("pnpm install")}`);
    logger.log(`    3. ${pc.cyan("npx convex init")}`);
    logger.log(`    4. ${pc.cyan("pnpm dlx shadcn@latest init")}`);
    logger.log(`    5. ${pc.cyan("pnpm dev")}`);
    logger.blank();
    logger.log(`  ${pc.dim("CLAUDE.md is configured. Claude Code will use forge CLI automatically.")}`);
    logger.blank();
  },
});
