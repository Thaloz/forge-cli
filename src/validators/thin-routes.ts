import { join } from "path";
import fg from "fast-glob";
import { readFile } from "../utils/fs.js";
import type { ValidationResult, Validator } from "./types.js";

const ALLOWED_IMPORT_PATTERNS = [
  /^~/,                           // ~/features/, ~/components/, ~/lib/
  /^@tanstack\//,                 // @tanstack/react-router, etc.
  /^convex\//,                    // convex/react, etc.
  /^@convex\//,                   // @convex/_generated/
  /^react$/,                      // react
  /^react-dom$/,                  // react-dom
];

const LINE_THRESHOLD = 50;

export const thinRoutesValidator: Validator = {
  name: "Thin routes",

  async validate(cwd: string): Promise<ValidationResult> {
    const errors: ValidationResult["errors"] = [];
    const warnings: ValidationResult["warnings"] = [];

    // Find all route files
    const routeFiles = await fg("app/routes/**/*.{ts,tsx}", {
      cwd,
      ignore: ["node_modules/**"],
    });

    for (const file of routeFiles) {
      const fullPath = join(cwd, file);
      const content = await readFile(fullPath);
      const lines = content.split("\n");

      // Check line count
      if (lines.length > LINE_THRESHOLD) {
        warnings.push({
          file,
          message: `Route file exceeds ${LINE_THRESHOLD} lines (${lines.length} lines) - consider moving logic to feature`,
        });
      }

      // Parse imports (simple regex approach)
      const importMatches = content.matchAll(/import\s+.*?\s+from\s+["']([^"']+)["']/g);

      for (const match of importMatches) {
        const importPath = match[1];

        // Skip relative imports within routes (like ./__root)
        if (importPath.startsWith(".")) continue;

        // Check if import is allowed
        const isAllowed = ALLOWED_IMPORT_PATTERNS.some((pattern) => pattern.test(importPath));

        if (!isAllowed) {
          errors.push({
            file,
            message: `Invalid import "${importPath}" - routes should only import from ~/features/, ~/components/, ~/lib/, or framework packages`,
          });
        }
      }
    }

    return {
      rule: this.name,
      passed: errors.length === 0,
      errors,
      warnings,
    };
  },
};
