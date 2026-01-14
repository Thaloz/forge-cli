import { defineCommand } from "citty";
import { join } from "path";
import { logger } from "../utils/logger.js";
import { renderTemplate } from "../utils/template.js";
import { writeFile, fileExists, readFile } from "../utils/fs.js";
import { kebabCase, camelCase } from "../utils/case.js";

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
      // Src files
      {
        templatePath: "feature/src/components/index.ts.hbs",
        destPath: join(cwd, "src/features", name, "components/index.ts"),
      },
      {
        templatePath: "feature/src/hooks.ts.hbs",
        destPath: join(cwd, "src/features", name, "hooks.ts"),
      },
      {
        templatePath: "feature/src/index.ts.hbs",
        destPath: join(cwd, "src/features", name, "index.ts"),
      },
      // Route files
      {
        templatePath: "feature/routes/index.tsx.hbs",
        destPath: join(cwd, "app/routes", name, "index.tsx"),
      },
      {
        templatePath: "feature/routes/$id.tsx.hbs",
        destPath: join(cwd, "app/routes", name, "$id.tsx"),
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
    logger.log("  Next steps:");
    logger.log(`    1. Define your schema in convex/features/${name}/schema.ts`);
    logger.log("    2. Run `npx convex dev` to sync");
    logger.log(`    3. Build components in src/features/${name}/components/`);
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

  // Add import before "export default defineSchema"
  const importLine = `import { ${camelName}Tables } from "./features/${featureName}/schema";`;
  const exportDefault = "export default defineSchema({";

  if (content.includes(importLine)) {
    logger.warn("Schema import already exists - skipping");
    return;
  }

  // Find the position to insert the import
  const exportPos = content.indexOf(exportDefault);
  if (exportPos === -1) {
    logger.warn("Could not find 'export default defineSchema({' in schema.ts - skipping");
    return;
  }

  // Insert import before export
  content = content.slice(0, exportPos) + importLine + "\n\n" + content.slice(exportPos);

  // Add spread inside defineSchema
  const spreadLine = `  ...${camelName}Tables,`;

  // Find the closing of defineSchema - look for the pattern with }); at the end
  // We need to insert before the closing });
  const defineSchemaStart = content.indexOf(exportDefault);
  const afterDefineSchema = content.slice(defineSchemaStart + exportDefault.length);

  // Find the matching closing });
  // Simple approach: find the last }); in the file
  const closingIndex = content.lastIndexOf("});");

  if (closingIndex === -1) {
    logger.warn("Could not find closing '});' in schema.ts - skipping spread");
    return;
  }

  // Check if spread already exists
  if (content.includes(spreadLine)) {
    logger.warn("Schema spread already exists - skipping");
  } else {
    // Insert spread before });
    content = content.slice(0, closingIndex) + spreadLine + "\n" + content.slice(closingIndex);
  }

  await writeFile(schemaPath, content);
  logger.success("Updated convex/schema.ts");
}
