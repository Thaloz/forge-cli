import { join, dirname } from "path";
import fg from "fast-glob";
import { readFile } from "../utils/fs.js";
import type { ValidationResult, Validator } from "./types.js";

export const crossFeatureValidator: Validator = {
  name: "Cross-feature imports",

  async validate(cwd: string): Promise<ValidationResult> {
    const errors: ValidationResult["errors"] = [];
    const warnings: ValidationResult["warnings"] = [];

    // Find all files in src/features
    const featureFiles = await fg("src/features/**/*.{ts,tsx}", {
      cwd,
      ignore: ["node_modules/**"],
    });

    for (const file of featureFiles) {
      // Extract the feature name from the path
      // src/features/<feature-name>/...
      const parts = file.split("/");
      const featureIndex = parts.indexOf("features");
      if (featureIndex === -1 || featureIndex + 1 >= parts.length) continue;

      const currentFeature = parts[featureIndex + 1];
      const fullPath = join(cwd, file);
      const content = await readFile(fullPath);

      // Parse imports
      const importMatches = content.matchAll(/import\s+.*?\s+from\s+["']([^"']+)["']/g);

      for (const match of importMatches) {
        const importPath = match[1];

        // Check for cross-feature imports
        // Patterns to detect:
        // - ~/features/<other>/...
        // - ../other-feature/...
        // - ../../other-feature/...

        // Check tilde imports
        const tildeMatch = importPath.match(/^~\/features\/([^/]+)/);
        if (tildeMatch) {
          const importedFeature = tildeMatch[1];
          if (importedFeature !== currentFeature) {
            errors.push({
              file,
              message: `Cross-feature import from "${currentFeature}" to "${importedFeature}"`,
            });
          }
          continue;
        }

        // Check relative imports that go to another feature
        if (importPath.startsWith("..")) {
          // Resolve the relative path to see if it crosses into another feature
          const fileDir = dirname(file);
          const resolvedParts = resolveRelativePath(fileDir, importPath);

          // Check if resolved path is in src/features/<different-feature>
          if (
            resolvedParts.length >= 3 &&
            resolvedParts[0] === "src" &&
            resolvedParts[1] === "features"
          ) {
            const importedFeature = resolvedParts[2];
            if (importedFeature !== currentFeature) {
              errors.push({
                file,
                message: `Cross-feature import from "${currentFeature}" to "${importedFeature}" via relative path`,
              });
            }
          }
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

function resolveRelativePath(fromDir: string, relativePath: string): string[] {
  const fromParts = fromDir.split("/").filter(Boolean);
  const relativeParts = relativePath.split("/").filter(Boolean);

  const result = [...fromParts];

  for (const part of relativeParts) {
    if (part === "..") {
      result.pop();
    } else if (part !== ".") {
      result.push(part);
    }
  }

  return result;
}
