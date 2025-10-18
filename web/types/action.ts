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

export interface Action {
  serviceId: string;
  id: string;
  name: string;
  description: string;
  configSchema: {
    name: string;
    description: string;
    fields: ConfigField[];
  };
  inputSchema: {
    type: object;
    properties: object;
    required: [string];
  };
  payloadFields?: PayloadField[];
  metadata: {
    category: string;
    tags: [string];
    icon: string;
    color: string;
    requiresAuth: true;
    webhookPattern: string;
  };
}

export interface PayloadField {
  path: string;
  type: string;
  description: string;
  example?: string;
}

export interface ServiceAction {
  id: string;
  name: string;
  description: string;
  version: string;
  actions: Action[];
}

export interface formAction {
  type: string;
  config: Record<string, unknown>;
}
