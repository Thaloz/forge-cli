import { join } from "path";
import fg from "fast-glob";
import { fileExists } from "../utils/fs.js";
import type { ValidationResult, Validator } from "./types.js";

const REQUIRED_SRC_FILES = ["components/index.ts", "hooks.ts", "index.ts"];
const REQUIRED_CONVEX_FILES = ["schema.ts", "queries.ts", "mutations.ts", "index.ts"];

export const featureStructureValidator: Validator = {
  name: "Feature structure",

  async validate(cwd: string): Promise<ValidationResult> {
    const errors: ValidationResult["errors"] = [];
    const warnings: ValidationResult["warnings"] = [];

    // Find all src features
    const srcFeatures = await fg("src/features/*", {
      cwd,
      onlyDirectories: true,
    });

    // Check each src feature has required files
    for (const featurePath of srcFeatures) {
      const featureName = featurePath.split("/").pop()!;

      for (const requiredFile of REQUIRED_SRC_FILES) {
        const filePath = join(cwd, featurePath, requiredFile);
        if (!(await fileExists(filePath))) {
          errors.push({
            file: join(featurePath, requiredFile),
            message: `Missing required file in feature "${featureName}"`,
          });
        }
      }
    }

    // Find all convex features
    const convexFeatures = await fg("convex/features/*", {
      cwd,
      onlyDirectories: true,
    });

    // Check each convex feature has required files
    for (const featurePath of convexFeatures) {
      const featureName = featurePath.split("/").pop()!;

      for (const requiredFile of REQUIRED_CONVEX_FILES) {
        const filePath = join(cwd, featurePath, requiredFile);
        if (!(await fileExists(filePath))) {
          errors.push({
            file: join(featurePath, requiredFile),
            message: `Missing required file in feature "${featureName}"`,
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
