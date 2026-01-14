import Handlebars from "handlebars";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { camelCase, pascalCase, kebabCase } from "./case.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Register Handlebars helpers
Handlebars.registerHelper("camelCase", (str: string) => camelCase(str));
Handlebars.registerHelper("pascalCase", (str: string) => pascalCase(str));
Handlebars.registerHelper("kebabCase", (str: string) => kebabCase(str));

/**
 * Get the templates directory path
 * Handles both dev (running from src/) and prod (running from dist/)
 */
function getTemplatesDir(): string {
  // Dev: running with tsx from src/
  const devPath = join(__dirname, "../../templates");
  if (existsSync(devPath)) return devPath;

  // Prod: running from dist/
  const prodPath = join(__dirname, "../templates");
  if (existsSync(prodPath)) return prodPath;

  throw new Error("Templates directory not found");
}

/**
 * Render a template with the given data
 * @param templatePath - Path relative to templates directory (e.g., "feature/convex/schema.ts.hbs")
 * @param data - Data to pass to the template
 */
export function renderTemplate(templatePath: string, data: Record<string, unknown>): string {
  const templatesDir = getTemplatesDir();
  const fullPath = join(templatesDir, templatePath);

  if (!existsSync(fullPath)) {
    throw new Error(`Template not found: ${fullPath}`);
  }

  const templateContent = readFileSync(fullPath, "utf-8");
  const template = Handlebars.compile(templateContent);
  return template(data);
}

/**
 * Get the templates directory for external use
 */
export function getTemplatesDirPath(): string {
  return getTemplatesDir();
}
