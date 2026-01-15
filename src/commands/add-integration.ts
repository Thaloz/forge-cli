import { defineCommand } from "citty";
import { spawn } from "child_process";
import { join } from "path";
import { logger } from "../utils/logger.js";
import { renderTemplate } from "../utils/template.js";
import { writeFile, fileExists, readFile } from "../utils/fs.js";
import { insertAtMarker } from "../utils/markers.js";
import { ensureShadcnComponents } from "../utils/shadcn.js";
import pc from "picocolors";

const INTEGRATIONS = ["auth", "storage"] as const;
type Integration = (typeof INTEGRATIONS)[number];

function runCommand(cmd: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: "inherit", cwd });
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with code ${code}`));
    });
    proc.on("error", reject);
  });
}

export default defineCommand({
  meta: {
    name: "add:integration",
    description:
      "Add infrastructure. auth: creates convex/auth.ts, src/components/auth/ (LoginForm, SignupForm, AuthGuard, UserMenu), routes. storage: creates convex/lib/storage.ts, src/components/storage/ (FileUpload, FilePreview).",
  },
  args: {
    name: {
      type: "positional",
      description: `Integration to add: ${INTEGRATIONS.join(", ")}`,
      required: true,
    },
  },
  async run({ args }) {
    const name = args.name as string;
    const cwd = process.cwd();

    if (!INTEGRATIONS.includes(name as Integration)) {
      logger.error(`Unknown integration: ${name}`);
      logger.log(`  Available: ${INTEGRATIONS.join(", ")}`);
      process.exit(1);
    }

    logger.blank();

    if (name === "auth") {
      await setupAuth(cwd);
    } else if (name === "storage") {
      await setupStorage(cwd);
    }
  },
});

async function setupAuth(cwd: string): Promise<void> {
  const authPath = join(cwd, "convex/auth.ts");
  if (await fileExists(authPath)) {
    logger.error("Auth already configured (convex/auth.ts exists)");
    process.exit(1);
  }

  logger.log(`  ${pc.bold("Setting up Convex Auth...")}`);
  logger.blank();

  // Install dependencies
  const step1 = logger.step("Installing dependencies...");
  try {
    await runCommand("pnpm", ["add", "@convex-dev/auth", "@auth/core"], cwd);
    step1.succeed("Dependencies installed");
  } catch {
    step1.fail("Failed to install dependencies");
    process.exit(1);
  }

  // Ensure shadcn components
  await ensureShadcnComponents(cwd, "auth");

  // Create backend files
  const step2 = logger.step("Creating backend files...");
  try {
    const backendFiles = [
      { template: "integration/auth/convex/auth.ts.hbs", dest: "convex/auth.ts" },
      { template: "integration/auth/convex/auth.config.ts.hbs", dest: "convex/auth.config.ts" },
      { template: "integration/auth/convex/http.ts.hbs", dest: "convex/http.ts" },
      { template: "integration/auth/src/lib/auth.ts.hbs", dest: "src/lib/auth.ts" },
    ];

    for (const file of backendFiles) {
      const content = renderTemplate(file.template, {});
      await writeFile(join(cwd, file.dest), content);
    }
    step2.succeed("Backend files created");
  } catch (err) {
    step2.fail("Failed to create backend files");
    throw err;
  }

  // Create UI components
  const step3 = logger.step("Creating UI components...");
  try {
    const uiFiles = [
      { template: "integration/auth/src/components/auth/LoginForm.tsx.hbs", dest: "src/components/auth/LoginForm.tsx" },
      { template: "integration/auth/src/components/auth/SignupForm.tsx.hbs", dest: "src/components/auth/SignupForm.tsx" },
      { template: "integration/auth/src/components/auth/AuthGuard.tsx.hbs", dest: "src/components/auth/AuthGuard.tsx" },
      { template: "integration/auth/src/components/auth/UserMenu.tsx.hbs", dest: "src/components/auth/UserMenu.tsx" },
      { template: "integration/auth/src/components/auth/index.ts.hbs", dest: "src/components/auth/index.ts" },
    ];

    for (const file of uiFiles) {
      const content = renderTemplate(file.template, {});
      await writeFile(join(cwd, file.dest), content);
    }
    step3.succeed("UI components created");
  } catch (err) {
    step3.fail("Failed to create UI components");
    throw err;
  }

  // Create route files
  const step4 = logger.step("Creating routes...");
  try {
    const routeFiles = [
      { template: "integration/auth/src/routes/login.tsx.hbs", dest: "src/routes/login.tsx" },
      { template: "integration/auth/src/routes/signup.tsx.hbs", dest: "src/routes/signup.tsx" },
    ];

    for (const file of routeFiles) {
      const content = renderTemplate(file.template, {});
      await writeFile(join(cwd, file.dest), content);
    }
    step4.succeed("Routes created");
  } catch (err) {
    step4.fail("Failed to create routes");
    throw err;
  }

  // Update schema.ts
  const step5 = logger.step("Updating convex/schema.ts...");
  try {
    await updateSchemaForAuth(cwd);
    step5.succeed("Schema updated");
  } catch {
    step5.fail("Failed to update schema");
  }

  // Update providers
  const step6 = logger.step("Updating providers...");
  try {
    await updateProvidersForAuth(cwd);
    step6.succeed("Providers updated");
  } catch {
    step6.fail("Failed to update providers");
  }

  // Update .env.example
  const step7 = logger.step("Updating .env.example...");
  try {
    const envPath = join(cwd, ".env.example");
    let env = (await fileExists(envPath)) ? await readFile(envPath) : "";
    const authVars = `
# Auth (get from GitHub/Google OAuth apps)
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
`;
    if (!env.includes("AUTH_GITHUB_ID")) {
      await writeFile(envPath, env.trim() + "\n" + authVars);
    }
    step7.succeed(".env.example updated");
  } catch {
    step7.fail("Failed to update .env.example");
  }

  logger.blank();
  logger.log(`  ${pc.green("✓")} ${pc.bold("Convex Auth configured!")}`);
  logger.blank();
  logger.log("  Created:");
  logger.log("    Backend: convex/auth.ts, convex/auth.config.ts");
  logger.log("    Components: LoginForm, SignupForm, AuthGuard, UserMenu");
  logger.log("    Routes: /login, /signup");
  logger.blank();
  logger.log("  Next steps:");
  logger.log("    1. Set up auth secrets: npx @convex-dev/auth");
  logger.log("    2. Run: npx convex dev");
  logger.log("    3. Visit: http://localhost:3000/login");
  logger.blank();
  logger.log("  Usage:");
  logger.log("    - Protect routes: <AuthGuard><YourComponent /></AuthGuard>");
  logger.log("    - Add to header: <UserMenu />");
  logger.blank();
}

async function setupStorage(cwd: string): Promise<void> {
  const storagePath = join(cwd, "convex/lib/storage.ts");
  if (await fileExists(storagePath)) {
    logger.error("Storage already configured (convex/lib/storage.ts exists)");
    process.exit(1);
  }

  logger.log(`  ${pc.bold("Setting up Convex Storage...")}`);
  logger.blank();

  // Ensure shadcn components
  await ensureShadcnComponents(cwd, "storage");

  // Create backend files
  const step1 = logger.step("Creating backend files...");
  try {
    const backendFiles = [
      { template: "integration/storage/convex/lib/storage.ts.hbs", dest: "convex/lib/storage.ts" },
      { template: "integration/storage/src/lib/storage.ts.hbs", dest: "src/lib/storage.ts" },
    ];

    for (const file of backendFiles) {
      const content = renderTemplate(file.template, {});
      await writeFile(join(cwd, file.dest), content);
    }
    step1.succeed("Backend files created");
  } catch (err) {
    step1.fail("Failed to create backend files");
    throw err;
  }

  // Create UI components
  const step2 = logger.step("Creating UI components...");
  try {
    const uiFiles = [
      { template: "integration/storage/src/components/storage/FileUpload.tsx.hbs", dest: "src/components/storage/FileUpload.tsx" },
      { template: "integration/storage/src/components/storage/FilePreview.tsx.hbs", dest: "src/components/storage/FilePreview.tsx" },
      { template: "integration/storage/src/components/storage/index.ts.hbs", dest: "src/components/storage/index.ts" },
    ];

    for (const file of uiFiles) {
      const content = renderTemplate(file.template, {});
      await writeFile(join(cwd, file.dest), content);
    }
    step2.succeed("UI components created");
  } catch (err) {
    step2.fail("Failed to create UI components");
    throw err;
  }

  logger.blank();
  logger.log(`  ${pc.green("✓")} ${pc.bold("Convex Storage configured!")}`);
  logger.blank();
  logger.log("  Created:");
  logger.log("    Backend: convex/lib/storage.ts");
  logger.log("    Lib: src/lib/storage.ts");
  logger.log("    Components: FileUpload, FilePreview");
  logger.blank();
  logger.log("  Usage:");
  logger.log('    import { FileUpload, FilePreview } from "~/components/storage";');
  logger.log('    import { useUpload, useFileUrl } from "~/lib/storage";');
  logger.blank();
  logger.log("    <FileUpload onUpload={(id) => console.log(id)} />");
  logger.log("    <FilePreview storageId={someId} />");
  logger.blank();
}

async function updateSchemaForAuth(cwd: string): Promise<void> {
  const schemaPath = join(cwd, "convex/schema.ts");
  if (!(await fileExists(schemaPath))) {
    logger.warn("convex/schema.ts not found - skipping");
    return;
  }

  let content = await readFile(schemaPath);

  const importLine = 'import { authTables } from "@convex-dev/auth/server";';
  const spreadLine = "  ...authTables,";

  // Insert import at marker
  const importResult = insertAtMarker(content, "imports", importLine, "ts");
  if (!importResult.success) {
    logger.warn("Markers not found in schema.ts - please add auth import manually");
    return;
  }
  if (importResult.alreadyPresent) {
    return; // Already configured
  }
  content = importResult.content;

  // Insert table spread at marker
  const tableResult = insertAtMarker(content, "tables", spreadLine, "ts");
  if (!tableResult.success) {
    logger.warn("Table markers not found in schema.ts - please add auth tables manually");
    return;
  }
  content = tableResult.content;

  await writeFile(schemaPath, content);
}

async function updateProvidersForAuth(cwd: string): Promise<void> {
  const providersPath = join(cwd, "src/providers/index.tsx");
  if (!(await fileExists(providersPath))) {
    logger.warn("src/providers/index.tsx not found - skipping");
    return;
  }

  let content = await readFile(providersPath);

  // Check if already configured
  if (content.includes("ConvexAuthProvider")) {
    return; // Already configured
  }

  // Add auth provider import at marker
  const importLine = 'import { ConvexAuthProvider } from "@convex-dev/auth/react";';
  const importResult = insertAtMarker(content, "imports", importLine, "ts");
  if (!importResult.success) {
    logger.warn("Import markers not found in providers - please add auth import manually");
    return;
  }
  content = importResult.content;

  // Replace ConvexProvider with ConvexAuthProvider (string replacement)
  content = content.replace(
    'import { ConvexProvider, ConvexReactClient } from "convex/react";',
    'import { ConvexReactClient } from "convex/react";'
  );
  content = content.replace(/<ConvexProvider/g, "<ConvexAuthProvider");
  content = content.replace(/<\/ConvexProvider>/g, "</ConvexAuthProvider>");

  await writeFile(providersPath, content);
}
