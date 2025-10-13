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
    return value !== undefined ? String(value) : match;
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