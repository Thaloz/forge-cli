import fg from "fast-glob";
import type { ValidationResult, Validator } from "./types.js";

export const componentLocationValidator: Validator = {
  name: "Component locations",

  async validate(cwd: string): Promise<ValidationResult> {
    const errors: ValidationResult["errors"] = [];
    const warnings: ValidationResult["warnings"] = [];

    // Find all .tsx files
    const tsxFiles = await fg("**/*.tsx", {
      cwd,
      ignore: [
        "node_modules/**",
        "dist/**",
        ".vinxi/**",
        ".output/**",
        "app/**", // Legacy TanStack Start routes
        "src/routes/**", // Route files (allowed JSX)
        "src/router.tsx", // Router config
        "src/features/*/components/**", // Valid location
        "src/components/**", // Valid location
        "src/providers/**", // Provider wrappers
      ],
    });

    for (const file of tsxFiles) {
      // If we find a .tsx file outside valid locations, it's an error
      errors.push({
        file,
        message: "Component outside valid location (should be in src/features/*/components/ or src/components/)",
      });
    }

    return {
      rule: this.name,
      passed: errors.length === 0,
      errors,
      warnings,
    };
  },
};

export const hookLocationValidator: Validator = {
  name: "Hook locations",

  async validate(cwd: string): Promise<ValidationResult> {
    const errors: ValidationResult["errors"] = [];
    const warnings: ValidationResult["warnings"] = [];

    // Find all files that might contain hooks (files with "hook" in name or use*.ts pattern)
    const potentialHookFiles = await fg(["**/use*.ts", "**/use*.tsx", "**/*hook*.ts", "**/*hook*.tsx"], {
      cwd,
      ignore: [
        "node_modules/**",
        "dist/**",
        "src/features/*/hooks.ts", // Valid location
        "src/hooks/**", // Valid location
        "src/hooks.ts", // Valid location (root hooks file)
      ],
    });

    for (const file of potentialHookFiles) {
      // Skip if it's inside routes (route files can have hooks inline)
      if (file.startsWith("app/routes/") || file.startsWith("src/routes/")) continue;

      errors.push({
        file,
        message: "Hook file outside valid location (should be in src/features/*/hooks.ts or src/hooks/)",
      });
    }

    return {
      rule: this.name,
      passed: errors.length === 0,
      errors,
      warnings,
    };
  },
};
