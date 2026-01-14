import fg from "fast-glob";
import type { ValidationResult, Validator } from "./types.js";

export const featureParityValidator: Validator = {
  name: "Feature parity",

  async validate(cwd: string): Promise<ValidationResult> {
    const errors: ValidationResult["errors"] = [];
    const warnings: ValidationResult["warnings"] = [];

    // Find all src features
    const srcFeatures = await fg("src/features/*", {
      cwd,
      onlyDirectories: true,
    });
    const srcFeatureNames = new Set(srcFeatures.map((f) => f.split("/").pop()!));

    // Find all convex features
    const convexFeatures = await fg("convex/features/*", {
      cwd,
      onlyDirectories: true,
    });
    const convexFeatureNames = new Set(convexFeatures.map((f) => f.split("/").pop()!));

    // Check for src features without convex counterpart
    for (const name of srcFeatureNames) {
      if (!convexFeatureNames.has(name)) {
        errors.push({
          file: `src/features/${name}`,
          message: `Feature "${name}" exists in src/features but not in convex/features`,
        });
      }
    }

    // Check for convex features without src counterpart
    for (const name of convexFeatureNames) {
      if (!srcFeatureNames.has(name)) {
        errors.push({
          file: `convex/features/${name}`,
          message: `Feature "${name}" exists in convex/features but not in src/features`,
        });
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
