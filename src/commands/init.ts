import { defineCommand } from "citty";
import { spawn } from "child_process";
import { join } from "path";
import { logger } from "../utils/logger.js";
import { renderTemplate } from "../utils/template.js";
import { writeFile, fileExists, ensureDir, readFile } from "../utils/fs.js";
import { kebabCase } from "../utils/case.js";
import pc from "picocolors";

/**
 * Run a command interactively (stdio: inherit)
 */
function runInteractive(
  cmd: string,
  args: string[],
  cwd?: string
): Promise<number> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, {
      stdio: "inherit",
      cwd,
    });
    proc.on("close", (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
    proc.on("error", reject);
  });
}

/**
 * Strip comments from JSON (for tsconfig.json which allows comments)
 */
function stripJsonComments(str: string): string {
  return str.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");
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
    logger.log(`  ${pc.bold("Forge CLI")} - Creating project "${name}"`);
    logger.blank();

    // Step 1: Run TanStack Start scaffolding
    logger.log(`  ${pc.cyan("Step 1/5:")} TanStack Start setup`);
    logger.blank();
    try {
      await runInteractive("pnpm", ["create", "@tanstack/start@latest", name]);
    } catch {
      logger.error("TanStack Start scaffolding failed");
      process.exit(1);
    }

    // Step 2: Add forge customizations
    logger.blank();
    const step2 = logger.step(`${pc.cyan("Step 2/5:")} Adding Forge customizations...`);

    try {
      // Add dependencies to package.json
      const pkgPath = join(projectDir, "package.json");
      const pkg = JSON.parse(await readFile(pkgPath));
      pkg.dependencies = {
        ...pkg.dependencies,
        convex: "^1.31.4",
        clsx: "^2.1.1",
        "tailwind-merge": "^3.4.0",
      };
      pkg.devDependencies = {
        ...pkg.devDependencies,
        "@biomejs/biome": "^1.9.4",
        autoprefixer: "^10.4.23",
        postcss: "^8.5.6",
        tailwindcss: "^3.4.19",
      };
      // Add biome scripts
      pkg.scripts = {
        ...pkg.scripts,
        lint: "biome check .",
        "lint:fix": "biome check . --write",
        format: "biome format . --write",
      };
      await writeFile(pkgPath, JSON.stringify(pkg, null, 2));

      // Add path aliases to tsconfig.json
      const tsconfigPath = join(projectDir, "tsconfig.json");
      const tsconfigContent = await readFile(tsconfigPath);
      const tsconfig = JSON.parse(stripJsonComments(tsconfigContent));
      tsconfig.compilerOptions = {
        ...tsconfig.compilerOptions,
        paths: {
          ...tsconfig.compilerOptions?.paths,
          "~/*": ["./src/*"],
          "@convex/*": ["./convex/*"],
        },
      };
      await writeFile(tsconfigPath, JSON.stringify(tsconfig, null, 2));

      const templateData = { name };

      // Write forge-specific files
      const forgeFiles = [
        { templatePath: "init/biome.json.hbs", destPath: join(projectDir, "biome.json") },
        { templatePath: "init/tailwind.config.ts.hbs", destPath: join(projectDir, "tailwind.config.ts") },
        { templatePath: "init/postcss.config.js.hbs", destPath: join(projectDir, "postcss.config.js") },
        { templatePath: "init/convex/schema.ts.hbs", destPath: join(projectDir, "convex/schema.ts") },
        { templatePath: "init/src/lib/cn.ts.hbs", destPath: join(projectDir, "src/lib/cn.ts") },
        { templatePath: "init/src/providers/index.tsx.hbs", destPath: join(projectDir, "src/providers/index.tsx") },
        { templatePath: "init/claude.md.hbs", destPath: join(projectDir, "CLAUDE.md") },
      ];

      for (const file of forgeFiles) {
        const content = renderTemplate(file.templatePath, templateData);
        await writeFile(file.destPath, content);
      }

      // Modify __root.tsx to add Providers
      const rootPath = join(projectDir, "src/routes/__root.tsx");
      if (await fileExists(rootPath)) {
        let rootContent = await readFile(rootPath);

        // Add Providers import
        if (!rootContent.includes("Providers")) {
          rootContent = `import { Providers } from "../providers";\n${rootContent}`;

          // Wrap body children with Providers
          // Look for pattern like: <body>...{children}...</body> or similar
          rootContent = rootContent.replace(
            /(<body[^>]*>)([\s\S]*?)(<\/body>)/,
            "$1<Providers>$2</Providers>$3"
          );

          await writeFile(rootPath, rootContent);
        }
      }

      // Create directory structure
      const emptyDirs = [
        join(projectDir, "src/components/ui"),
        join(projectDir, "src/features"),
        join(projectDir, "src/hooks"),
        join(projectDir, "convex/features"),
      ];

      for (const dir of emptyDirs) {
        await ensureDir(dir);
        await writeFile(join(dir, ".gitkeep"), "");
      }

      // Create styles.css with Tailwind directives
      const stylesPath = join(projectDir, "src/styles.css");
      const existingStyles = await fileExists(stylesPath) ? await readFile(stylesPath) : "";
      if (!existingStyles.includes("@tailwind")) {
        const tailwindDirectives = `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n`;
        await writeFile(stylesPath, tailwindDirectives + existingStyles);
      }

      // Update .gitignore
      const gitignorePath = join(projectDir, ".gitignore");
      let gitignore = await fileExists(gitignorePath) ? await readFile(gitignorePath) : "";
      const additions = [".env", ".env.local", ".output", "convex/_generated"];
      for (const item of additions) {
        if (!gitignore.includes(item)) {
          gitignore += `\n${item}`;
        }
      }
      await writeFile(gitignorePath, gitignore.trim() + "\n");

      // Create .env.example
      await writeFile(join(projectDir, ".env.example"), "VITE_CONVEX_URL=\n");

      step2.succeed(`${pc.cyan("Step 2/5:")} Forge customizations added`);
    } catch (err) {
      step2.fail(`${pc.cyan("Step 2/5:")} Failed to add customizations`);
      throw err;
    }

    // Step 3: Install dependencies
    logger.blank();
    logger.log(`  ${pc.cyan("Step 3/5:")} Installing dependencies...`);
    logger.blank();
    try {
      await runInteractive("pnpm", ["install"], projectDir);
    } catch {
      logger.error("Failed to install dependencies");
      process.exit(1);
    }

    // Step 4: Convex setup
    logger.blank();
    logger.log(`  ${pc.cyan("Step 4/5:")} Convex setup`);
    logger.blank();
    try {
      await runInteractive("npx", ["convex", "dev", "--once", "--configure=new"], projectDir);
    } catch {
      logger.warn("Convex setup skipped or failed - you can run it later");
    }

    // Step 5: shadcn setup
    logger.blank();
    logger.log(`  ${pc.cyan("Step 5/5:")} shadcn/ui setup`);
    logger.blank();
    try {
      await runInteractive("pnpm", ["dlx", "shadcn@latest", "init"], projectDir);
    } catch {
      logger.warn("shadcn setup skipped or failed - you can run it later");
    }

    // Done!
    logger.blank();
    logger.log(`  ${pc.green("✓")} ${pc.bold("Project created successfully!")}`);
    logger.blank();
    logger.log(`  ${pc.cyan("cd")} ${name}`);
    logger.log(`  ${pc.cyan("pnpm dev")}`);
    logger.blank();
    logger.log(`  ${pc.dim("CLAUDE.md is configured. Claude Code will use forge CLI automatically.")}`);
    logger.blank();
  },
});
