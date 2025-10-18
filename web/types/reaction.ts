export interface NumberValidator {
  min?: number;
  max?: number;
}

export interface ConfigField {
  name: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: Array<{
    value: string;
    label: string;
  }>;
  default?: string | number | boolean;
  dynamic?: boolean;
  dynamicPlaceholder?: string;
  validator?: NumberValidator;
}

export interface Reaction {
  serviceId: string;
  id: string;
  name: string;
  description: string;
  configSchema: {
    name: string;
    description: string;
    fields: ConfigField[];
  };
  outputSchema: {
    type: object;
    properties: object;
    required: [string];
  };
  metadata: {
    category: string;
    tags: [string];
    icon: string;
    color: string;
    requiresAuth: true;
    estimatedDuration: 0;
  };
  delay: number;
}

export interface ServiceReaction {
  id: string;
  name: string;
  description: string;
  version: string;
  reactions: Reaction[];
}

export interface formReaction {
  type: string;
  config: Record<string, unknown>;
  delay: number;
}
