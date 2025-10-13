export interface Action {
  id: string;
  name: string;
  description: string;
  configSchema: {
    name: string;
    description: string;
    fields: [
      {
        name: string;
        type: string;
        label: string;
        required: true;
        placeholder: string;
        options: [
          {
            value: string;
            label: string;
          },
        ];
        default: string;
      },
    ];
  };
  inputSchema: {
    type: object;
    properties: object;
    required: [string];
  };
  payloadFields?: PayloadField[]; // Available payload fields for dynamic reactions
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
