export interface Reaction {
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
}
