import { Request, Response } from 'express';

export interface WebhookHandler {
  service: string;
  handle(req: Request, res: Response): Promise<Response>;
}

export interface WebhookModule {
  default: WebhookHandler;
  initialize?: (config: WebhookConfig) => Promise<void>;
  cleanup?: () => Promise<void>;
}

export interface WebhookConfig {
  credentials?: Record<string, string>;
  settings?: Record<string, unknown>;
  env?: Record<string, string | undefined>;
}
