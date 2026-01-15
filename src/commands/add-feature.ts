import { defineCommand } from "citty";
import { join } from "path";
import { logger } from "../utils/logger.js";
import { renderTemplate } from "../utils/template.js";
import { writeFile, fileExists, readFile } from "../utils/fs.js";
import { kebabCase, camelCase, pascalCase } from "../utils/case.js";
import { insertAtMarker } from "../utils/markers.js";
import { ensureShadcnComponents } from "../utils/shadcn.js";

interface FileToCreate {
  templatePath: string;
  destPath: string;
}

export default defineCommand({
  meta: {
    name: "add:feature",
    description: "Create a new feature with vertical slice architecture",
  },
  args: {
    name: {
      type: "positional",
      description: "Name of the feature (will be converted to kebab-case)",
      required: true,
    },
  },
  async run({ args }) {
    const rawName = args.name as string;
    const name = kebabCase(rawName);
    const cwd = process.cwd();

    // Check if feature already exists
    const srcFeaturePath = join(cwd, "src/features", name);
    const convexFeaturePath = join(cwd, "convex/features", name);

    if (await fileExists(srcFeaturePath)) {
      logger.error(`Feature "${name}" already exists at src/features/${name}`);
      process.exit(1);
    }

    if (await fileExists(convexFeaturePath)) {
      logger.error(`Feature "${name}" already exists at convex/features/${name}`);
      process.exit(1);
    }

    logger.blank();

    // Ensure shadcn components are installed
    await ensureShadcnComponents(cwd, "feature");

    const pascal = pascalCase(name);
    const templateData = { name };

    // Define files to create
    const files: FileToCreate[] = [
      // Convex files
      {
        templatePath: "feature/convex/schema.ts.hbs",
        destPath: join(cwd, "convex/features", name, "schema.ts"),
      },
      {
        templatePath: "feature/convex/queries.ts.hbs",
        destPath: join(cwd, "convex/features", name, "queries.ts"),
      },
      {
        templatePath: "feature/convex/mutations.ts.hbs",
        destPath: join(cwd, "convex/features", name, "mutations.ts"),
      },
      {
        templatePath: "feature/convex/index.ts.hbs",
        destPath: join(cwd, "convex/features", name, "index.ts"),
      },
      // Src files - hooks and index
      {
        templatePath: "feature/src/hooks.ts.hbs",
        destPath: join(cwd, "src/features", name, "hooks.ts"),
      },
      {
        templatePath: "feature/src/index.ts.hbs",
        destPath: join(cwd, "src/features", name, "index.ts"),
      },
      // Components
      {
        templatePath: "feature/src/components/List.tsx.hbs",
        destPath: join(cwd, "src/features", name, "components", `${pascal}List.tsx`),
      },
      {
        templatePath: "feature/src/components/Card.tsx.hbs",
        destPath: join(cwd, "src/features", name, "components", `${pascal}Card.tsx`),
      },
      {
        templatePath: "feature/src/components/Form.tsx.hbs",
        destPath: join(cwd, "src/features", name, "components", `${pascal}Form.tsx`),
      },
      {
        templatePath: "feature/src/components/Detail.tsx.hbs",
        destPath: join(cwd, "src/features", name, "components", `${pascal}Detail.tsx`),
      },
      {
        templatePath: "feature/src/components/index.ts.hbs",
        destPath: join(cwd, "src/features", name, "components/index.ts"),
      },
      // Route files
      {
        templatePath: "feature/routes/index.tsx.hbs",
        destPath: join(cwd, "src/routes", name, "index.tsx"),
      },
      {
        templatePath: "feature/routes/$id.tsx.hbs",
        destPath: join(cwd, "src/routes", name, "$id.tsx"),
      },
    ];

    // Create all files
    for (const file of files) {
      const content = renderTemplate(file.templatePath, templateData);
      await writeFile(file.destPath, content);
      const relativePath = file.destPath.replace(cwd + "/", "");
      logger.success(`Created ${relativePath}`);
    }

    // Update convex/schema.ts
    await updateConvexSchema(cwd, name);

    logger.blank();
    logger.log(`  Feature "${name}" created successfully.`);
    logger.blank();
    logger.log("  Created:");
    logger.log(`    Backend: convex/features/${name}/`);
    logger.log(`    Components: ${pascal}List, ${pascal}Card, ${pascal}Form, ${pascal}Detail`);
    logger.log(`    Routes: /src/routes/${name}/`);
    logger.blank();
    logger.log("  Next steps:");
    logger.log(`    1. Define your schema in convex/features/${name}/schema.ts`);
    logger.log(`    2. Update form fields in ${pascal}Form.tsx`);
    logger.log(`    3. Customize ${pascal}Card.tsx display`);
    logger.log("    4. Run: npx convex dev");
    logger.blank();
  },
});

async function updateConvexSchema(cwd: string, featureName: string): Promise<void> {
  const schemaPath = join(cwd, "convex/schema.ts");
  const camelName = camelCase(featureName);

  if (!(await fileExists(schemaPath))) {
    logger.warn("convex/schema.ts not found - skipping schema registration");
    return;
  }

  let content = await readFile(schemaPath);

  const importLine = `import { ${camelName}Tables } from "./features/${featureName}/schema";`;
  const spreadLine = `  ...${camelName}Tables,`;

  // Insert import at marker
  const importResult = insertAtMarker(content, "imports", importLine, "ts");
  if (!importResult.success) {
    logger.warn("Markers not found in schema.ts - please add imports manually");
    logger.warn(`  Add: ${importLine}`);
    return;
  }
  if (importResult.alreadyPresent) {
    logger.warn("Schema import already exists - skipping");
    return;
  }
  content = importResult.content;

  // Insert table spread at marker
  const tableResult = insertAtMarker(content, "tables", spreadLine, "ts");
  if (!tableResult.success) {
    logger.warn("Table markers not found in schema.ts - please add table spread manually");
    logger.warn(`  Add: ${spreadLine}`);
    return;
  }
  content = tableResult.content;

  await writeFile(schemaPath, content);
  logger.success("Updated convex/schema.ts");
}
