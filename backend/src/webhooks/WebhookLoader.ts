import * as fs from 'fs';
import * as path from 'path';
import type { WebhookHandler, WebhookConfig } from '../types/webhook';

export class WebhookLoader {
  private servicesPath: string;
  private handlers: Map<string, WebhookHandler> = new Map();

  constructor(
    servicesPath: string = path.join(
      process.cwd(),
      'src',
      'services',
      'services'
    )
  ) {
    this.servicesPath = servicesPath;
  }

  async loadAllWebhooks(): Promise<void> {
    if (!fs.existsSync(this.servicesPath)) {
      console.warn(`Services directory not found: ${this.servicesPath}`);
      return;
    }

    const entries = fs.readdirSync(this.servicesPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const webhookPath = path.join(this.servicesPath, entry.name, 'webhook');
        if (fs.existsSync(webhookPath)) {
          await this.loadWebhook(entry.name);
        }
      }
    }
  }

  async loadWebhook(serviceName: string): Promise<void> {
    const webhookPath = path.join(this.servicesPath, serviceName, 'webhook');

    if (!fs.existsSync(webhookPath)) {
      throw new Error(`Webhook directory not found: ${webhookPath}`);
    }

    const indexPath = path.join(webhookPath, 'index.ts');
    const indexJsPath = path.join(webhookPath, 'index.js');

    let modulePath: string;
    if (fs.existsSync(indexPath)) {
      modulePath = indexPath;
    } else if (fs.existsSync(indexJsPath)) {
      modulePath = indexJsPath;
    } else {
      throw new Error(`Webhook index file not found in: ${webhookPath}`);
    }

    try {
      const module = await import(`${modulePath}?t=${Date.now()}`);

      if (!module.default) {
        throw new Error(
          `Webhook module must export a default WebhookHandler instance: ${serviceName}`
        );
      }

      const handler: WebhookHandler = module.default;

      if (handler.service !== serviceName) {
        throw new Error(
          `Webhook service '${handler.service}' does not match directory name '${serviceName}'`
        );
      }

      if (module.initialize) {
        const config = this.loadWebhookConfig(serviceName);
        await module.initialize(config);
      }

      this.handlers.set(serviceName, handler);
    } catch (error) {
      console.error(`Failed to load webhook '${serviceName}':`, error);
      throw error;
    }
  }

  async unloadWebhook(serviceName: string): Promise<void> {
    const webhookPath = path.join(this.servicesPath, serviceName, 'webhook');
    const indexPath = path.join(webhookPath, 'index.ts');

    try {
      const module = await import(indexPath);
      if (module.cleanup) {
        await module.cleanup();
      }
    } catch (error) {
      console.warn(`Failed to cleanup webhook '${serviceName}':`, error);
    }

    this.handlers.delete(serviceName);
  }

  async reloadWebhook(serviceName: string): Promise<void> {
    await this.unloadWebhook(serviceName);
    await this.loadWebhook(serviceName);
  }

  getHandler(serviceName: string): WebhookHandler | undefined {
    return this.handlers.get(serviceName);
  }

  getAllHandlers(): WebhookHandler[] {
    return Array.from(this.handlers.values());
  }

  getAvailableWebhooks(): string[] {
    if (!fs.existsSync(this.servicesPath)) {
      return [];
    }

    return fs
      .readdirSync(this.servicesPath, { withFileTypes: true })
      .filter(entry => {
        if (!entry.isDirectory()) return false;
        const webhookPath = path.join(this.servicesPath, entry.name, 'webhook');
        return fs.existsSync(webhookPath);
      })
      .map(entry => entry.name);
  }

  private loadWebhookConfig(serviceName: string): WebhookConfig {
    const config: WebhookConfig = {
      credentials: {},
      settings: {},
      env: process.env,
    };

    const prefix = `${serviceName.toUpperCase()}_`;
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith(prefix) && value) {
        const configKey = key.substring(prefix.length).toLowerCase();
        config.credentials![configKey] = value;
      }
    }

    return config;
  }
}

export const webhookLoader = new WebhookLoader();
