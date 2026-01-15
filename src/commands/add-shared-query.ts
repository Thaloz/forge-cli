import { defineCommand } from "citty";
import { join } from "path";
import { logger } from "../utils/logger.js";
import { writeFile, fileExists } from "../utils/fs.js";
import { renderTemplate } from "../utils/template.js";
import { kebabCase, camelCase } from "../utils/case.js";

export default defineCommand({
  meta: {
    name: "add:shared-query",
    description:
      "Create a shared Convex query file. Creates: convex/<name>.ts with query/mutation boilerplate. Use for global backend logic not tied to a feature.",
  },
  args: {
    name: {
      type: "positional",
      description: "Query file name (e.g., notifications, emails, analytics)",
      required: true,
    },
  },
  async run({ args }) {
    const cwd = process.cwd();
    const rawName = args.name as string;
    const fileName = kebabCase(rawName);
    const queryName = camelCase(rawName);

    const queryPath = join(cwd, "convex", `${fileName}.ts`);

    // Check if file already exists
    if (await fileExists(queryPath)) {
      logger.error(`Shared query "${fileName}" already exists at convex/${fileName}.ts`);
      process.exit(1);
    }

    // Check if convex directory exists
    const convexDir = join(cwd, "convex");
    if (!(await fileExists(convexDir))) {
      logger.error("convex/ directory not found. Is this a Convex project?");
      process.exit(1);
    }

    logger.blank();

    const templateData = {
      fileName,
      queryName,
    };

    // Create query file
    const content = renderTemplate("shared-query/query.ts.hbs", templateData);
    await writeFile(queryPath, content);
    logger.success(`Created convex/${fileName}.ts`);

    logger.blank();
    logger.log(`  Shared query "${fileName}" created!`);
    logger.blank();
    logger.log("  Location:");
    logger.log(`    convex/${fileName}.ts`);
    logger.blank();
    logger.log("  Usage:");
    logger.log(`    import { api } from "convex/_generated/api";`);
    logger.log(`    const data = useQuery(api.${fileName}.list);`);
    logger.log(`    const create = useMutation(api.${fileName}.create);`);
    logger.blank();
  },
});
