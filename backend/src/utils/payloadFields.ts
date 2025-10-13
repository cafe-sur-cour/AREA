/**
 * Utility functions for extracting payload fields from action schemas
 */

import type { ActionDefinition } from '../types/service';

export interface PayloadField {
  path: string;
  type: string;
  description: string;
  example?: string;
}

export function extractPayloadFields(action: ActionDefinition): PayloadField[] {
  const fields: PayloadField[] = [];

  if (!action.inputSchema?.properties) {
    return fields;
  }

  function extractFields(obj: Record<string, unknown>, prefix = ''): void {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'object' && value !== null && 'type' in value && 'properties' in value) {
        const valueObj = value as { type: string; properties: Record<string, unknown>; description?: string; example?: string };
        if (valueObj.type === 'object' && valueObj.properties) {
          // Recursively extract nested object fields
          extractFields(valueObj.properties, currentPath);
        }
      } else if (typeof value === 'object' && value !== null && 'type' in value && 'items' in value) {
        const valueObj = value as { type: string; items: { type?: string; properties?: Record<string, unknown> }; description?: string; example?: string };
        if (valueObj.type === 'array' && valueObj.items) {
          // Handle arrays - add the array field itself and potentially its items
          fields.push({
            path: currentPath,
            type: `${valueObj.type}<${valueObj.items.type || 'object'}>`,
            description: valueObj.description || `Array of ${valueObj.items.type || 'items'}`,
            ...(valueObj.example && { example: valueObj.example }),
          });

          // If items are objects, extract their fields with [0] indexing
          if (valueObj.items.type === 'object' && valueObj.items.properties) {
            extractFields(valueObj.items.properties, `${currentPath}[0]`);
          }
        }
      } else if (typeof value === 'object' && value !== null && 'type' in value) {
        const valueObj = value as { type: string; description?: string; example?: string };
        // Simple field
        fields.push({
          path: currentPath,
          type: valueObj.type,
          description: valueObj.description || `Field: ${key}`,
          ...(valueObj.example && { example: valueObj.example }),
        });
      }
    }
  }

  extractFields(action.inputSchema.properties);
  return fields;
}