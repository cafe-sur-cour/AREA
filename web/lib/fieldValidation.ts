export interface NumberValidator {
  min?: number;
  max?: number;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface ConfigField {
  name: string;
  type: 'text' | 'email' | 'textarea' | 'select' | 'checkbox' | 'number';
  label: string;
  required: boolean;
  placeholder?: string;
  options?: SelectOption[];
  default?: string | number | boolean;
  dynamic?: boolean;
  dynamicPlaceholder?: string;
  validator?: NumberValidator;
}

export interface ConfigSchema {
  name: string;
  description: string;
  fields: ConfigField[];
}

export function validateNumber(
  value: unknown,
  validator: NumberValidator,
  fieldLabel: string
): { valid: boolean; errors: string[] } {
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
): { valid: boolean; errors: string[] } {
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
