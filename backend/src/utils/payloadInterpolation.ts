/**
 * Payload interpolation utilities for actions and reactions
 */

/**
 * Interpolate payload values into a configuration object
 * Supports template syntax like {{action.payload.field}} or {{action.payload.nested.field}}
 */
export function interpolatePayload(
  config: Record<string, unknown>,
  actionPayload: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...config };

  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'string') {
      result[key] = interpolateString(value, { action: { payload: actionPayload } });
    } else if (typeof value === 'object' && value !== null) {
      result[key] = interpolatePayload(value as Record<string, unknown>, actionPayload);
    }
  }

  return result;
}

/**
 * Interpolate template strings with context data
 * Supports {{context.path}} syntax
 */
export function interpolateString(
  template: string,
  context: Record<string, unknown>
): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const value = getValueByPath(context, path.trim());
    return value !== undefined ? valueToString(value) : match;
  });
}

/**
 * Get a value from an object using dot notation path
 */
function getValueByPath(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Convert a value to string for template interpolation
 * Handles arrays and objects specially
 */
function valueToString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '';
    }
    // For arrays of primitives, join them
    if (value.every(item => typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean')) {
      return value.join(', ');
    }
    // For arrays of objects, show a summary
    return `[${value.length} item${value.length > 1 ? 's' : ''}]`;
  }

  if (typeof value === 'object') {
    // For objects, try to JSON stringify, but limit length
    try {
      const json = JSON.stringify(value);
      return json.length > 100 ? '[Object]' : json;
    } catch {
      return '[Object]';
    }
  }

  return String(value);
}