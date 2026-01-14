import { featureStructureValidator } from "./feature-structure.js";
import { componentLocationValidator, hookLocationValidator } from "./locations.js";
import { thinRoutesValidator } from "./thin-routes.js";
import { crossFeatureValidator } from "./cross-feature.js";
import { featureParityValidator } from "./feature-parity.js";
import type { Validator, ValidationResult } from "./types.js";

export type { ValidationResult, Validator };

export const validators: Validator[] = [
  featureStructureValidator,
  componentLocationValidator,
  hookLocationValidator,
  thinRoutesValidator,
  crossFeatureValidator,
  featureParityValidator,
];

export async function runAllValidators(cwd: string): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  for (const validator of validators) {
    const result = await validator.validate(cwd);
    results.push(result);
  }

  return results;
}
