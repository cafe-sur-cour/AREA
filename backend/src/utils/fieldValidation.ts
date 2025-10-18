import type { ConfigField, NumberValidator } from '../types/mapping';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateNumber(
  value: unknown,
  validator: NumberValidator,
  fieldLabel: string
): ValidationResult {
  const errors: string[] = [];

  const numValue =
    typeof value === 'string' ? parseFloat(value) : Number(value);

  if (isNaN(numValue)) {
    errors.push(`${fieldLabel} must be a valid number`);
    return { valid: false, errors };
  }

  if (validator.min !== undefined && numValue < validator.min) {
    errors.push(`${fieldLabel} must be at least ${validator.min}`);
  }

  if (validator.max !== undefined && numValue > validator.max) {
    errors.push(`${fieldLabel} must be at most ${validator.max}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateField(
  field: ConfigField,
  value: unknown
): ValidationResult {
  const errors: string[] = [];

  if (
    field.required &&
    (value === undefined || value === null || value === '')
  ) {
    errors.push(`${field.label} is required`);
    return { valid: false, errors };
  }

  if (
    !field.required &&
    (value === undefined || value === null || value === '')
  ) {
    return { valid: true, errors: [] };
  }

  if (field.type === 'number' && field.validator) {
    return validateNumber(value, field.validator, field.label);
  }

  return { valid: true, errors: [] };
}

export function validateConfig(
  fields: ConfigField[],
  config: Record<string, unknown>
): ValidationResult {
  const allErrors: string[] = [];

  for (const field of fields) {
    const value = config[field.name];
    const result = validateField(field, value);

    if (!result.valid) {
      allErrors.push(...result.errors);
    }
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}
