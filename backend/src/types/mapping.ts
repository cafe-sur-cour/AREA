// Mapping types for AREA Action-Reaction system
// This file defines the standard format for storing and mapping Actions to Reactions

export interface Action {
  type: string;
  config: Record<string, unknown>;
}

export interface Reaction {
  type: string;
  config: Record<string, unknown>;
  delay?: number;
}

export interface ActionReactionMapping {
  id: number;
  name: string;

  action: Action;
  reactions: Reaction[];

  is_active: boolean;
  description?: string;

  created_by: number;
  created_at: Date;
  updated_at?: Date;
}

/* Validation rules for ActionReactionMapping */
export const MAPPING_VALIDATION_RULES = {
  name: {
    maxLength: 100,
    required: true,
    unique: true,
  },
  action: {
    type: {
      required: true,
      pattern: /^[a-zA-Z0-9_]+\.[a-zA-Z0-9_]+$/ /* service.action format */,
    },
    config: {
      type: 'object',
      required: true,
    },
  },
  reactions: {
    type: 'array',
    minItems: 1,
    items: {
      type: 'object',
      properties: {
        type: {
          required: true,
          pattern:
            /^[a-zA-Z0-9_]+\.[a-zA-Z0-9_]+$/ /* service.reaction format */,
        },
        config: {
          type: 'object',
          required: true,
        },
      },
    },
  },
};

/* Field types for configuration schemas */
export type FieldType =
  | 'text'
  | 'email'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'number';

export interface SelectOption {
  value: string;
  label: string;
}

export interface ConfigField {
  name: string;
  type: FieldType;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: SelectOption[];
  default?: string | number | boolean;
  dynamic?: boolean; // Whether this field supports payload interpolation
  dynamicPlaceholder?: string; // Example of dynamic value usage
}

export interface ActionReactionSchema {
  name: string;
  description?: string;
  fields: ConfigField[];
}
