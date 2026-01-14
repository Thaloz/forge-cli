export interface ValidationError {
  file: string;
  message: string;
}

export interface ValidationResult {
  rule: string;
  passed: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface Validator {
  name: string;
  validate(cwd: string): Promise<ValidationResult>;
}
