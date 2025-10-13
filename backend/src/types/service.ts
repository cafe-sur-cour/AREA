import type { ActionReactionSchema, Reaction } from './mapping';

export interface Service {
  id: string;
  name: string;
  description: string;
  version: string;
  icon?: string; // SVG string representation of the icon
  actions: ActionDefinition[];
  reactions: ReactionDefinition[];
  getCredentials?: (userId: number) => Promise<Record<string, string>>;
  oauth?: {
    enabled: boolean;
    supportsLogin?: boolean;
  };
}

export interface ActionDefinition {
  id: string;
  name: string;
  description: string;
  configSchema: ActionReactionSchema;
  inputSchema: ActionInputSchema;
  metadata: ActionMetadata;
}

export interface ReactionDefinition {
  id: string;
  name: string;
  description: string;
  configSchema: ActionReactionSchema;
  outputSchema: ReactionOutputSchema;
  metadata: ReactionMetadata;
}

export interface ActionInputSchema {
  type: 'object';
  properties: Record<string, InputProperty>;
  required?: string[];
}

export interface ReactionOutputSchema {
  type: 'object';
  properties: Record<string, OutputProperty>;
  required?: string[];
}

export interface InputProperty {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  example?: unknown;
  properties?: Record<string, InputProperty>;
  items?: InputProperty;
}

export interface OutputProperty {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  example?: unknown;
  properties?: Record<string, OutputProperty>;
  items?: OutputProperty;
}

export interface ActionMetadata {
  category: string;
  tags: string[];
  icon?: string;
  color?: string;
  requiresAuth: boolean;
  webhookPattern?: string;
  sharedEvents?: boolean;
  sharedEventFilter?: (
    event: {
      source: string | null | undefined;
      payload: Record<string, unknown>;
    },
    mapping: { action: { config?: Record<string, unknown> } }
  ) => boolean;
}

export interface ReactionMetadata {
  category: string;
  tags: string[];
  icon?: string;
  color?: string;
  requiresAuth: boolean;
  estimatedDuration?: number;
}

export interface ServiceModule {
  default: Service;
  executor?: ReactionExecutor;
  initialize?: (config: ServiceConfig) => Promise<void>;
  cleanup?: () => Promise<void>;
}

export interface ServiceConfig {
  credentials?: Record<string, string>;
  settings?: Record<string, unknown>;
  env?: Record<string, string | undefined>;
}

export interface ServiceRegistry {
  register(service: Service): void;
  unregister(serviceId: string): void;
  getService(serviceId: string): Service | undefined;
  getAllServices(): Service[];
  getAllActions(): ActionDefinition[];
  getAllReactions(): ReactionDefinition[];
  getActionByType(type: string): ActionDefinition | undefined;
  getReactionByType(type: string): ReactionDefinition | undefined;
}

export interface ReactionExecutionContext {
  reaction: Reaction;
  event: {
    id: number;
    action_type: string;
    user_id: number;
    payload: Record<string, unknown>;
    created_at: Date;
  };
  mapping: {
    id: number;
    name: string;
    created_by: number;
  };
  serviceConfig: ServiceConfig;
}

export interface ReactionExecutionResult {
  success: boolean;
  output?: Record<string, unknown>;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface ReactionExecutor {
  execute(context: ReactionExecutionContext): Promise<ReactionExecutionResult>;
}

export interface ReactionExecutorRegistry {
  register(serviceId: string, executor: ReactionExecutor): void;
  unregister(serviceId: string): void;
  getExecutor(serviceId: string): ReactionExecutor | undefined;
  executeReaction(
    reactionType: string,
    context: ReactionExecutionContext
  ): Promise<ReactionExecutionResult>;
}
