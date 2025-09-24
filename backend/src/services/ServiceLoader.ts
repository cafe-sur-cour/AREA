import * as fs from 'fs';
import * as path from 'path';
import type { Service, ServiceConfig } from '../types/service';
import { serviceRegistry } from './ServiceRegistry';
import { reactionExecutorRegistry } from './ReactionExecutorRegistry';

export class ServiceLoader {
  private servicesPath: string;

  constructor(servicesPath: string = path.join(__dirname, 'services')) {
    this.servicesPath = servicesPath;
  }

  async loadAllServices(): Promise<void> {
    if (!fs.existsSync(this.servicesPath)) {
      console.warn(`Services directory not found: ${this.servicesPath}`);
      return;
    }

    const entries = fs.readdirSync(this.servicesPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        await this.loadService(entry.name);
      }
    }
  }

  async loadService(serviceName: string): Promise<void> {
    const servicePath = path.join(this.servicesPath, serviceName);

    if (!fs.existsSync(servicePath)) {
      throw new Error(`Service directory not found: ${servicePath}`);
    }

    const indexPath = path.join(servicePath, 'index.ts');

    let modulePath: string;
    if (fs.existsSync(indexPath)) {
      modulePath = indexPath;
    } else {
      throw new Error(`Service index file not found in: ${servicePath}`);
    }

    try {
      const module = await import(`${modulePath}?t=${Date.now()}`);

      if (!module.default) {
        throw new Error(
          `Service module must export a default Service instance: ${serviceName}`
        );
      }

      const service: Service = module.default;

      if (service.id !== serviceName) {
        throw new Error(
          `Service id '${service.id}' does not match directory name '${serviceName}'`
        );
      }

      if (module.initialize) {
        const config = this.loadServiceConfig(serviceName);
        await module.initialize(config);
      }

      serviceRegistry.register(service);

      if (module.executor) {
        reactionExecutorRegistry.register(service.id, module.executor);
      }
    } catch (error) {
      console.error(`Failed to load service '${serviceName}':`, error);
      throw error;
    }
  }

  async unloadService(serviceName: string): Promise<void> {
    const servicePath = path.join(this.servicesPath, serviceName);
    const indexPath = path.join(servicePath, 'index.ts');

    try {
      const module = await import(indexPath);
      if (module.cleanup) {
        await module.cleanup();
      }
    } catch (error) {
      console.warn(`Failed to cleanup service '${serviceName}':`, error);
    }

    serviceRegistry.unregister(serviceName);
    reactionExecutorRegistry.unregister(serviceName);
  }

  async reloadService(serviceName: string): Promise<void> {
    await this.unloadService(serviceName);
    await this.loadService(serviceName);
  }

  private loadServiceConfig(serviceName: string): ServiceConfig {
    const config: ServiceConfig = {
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

  getAvailableServices(): string[] {
    if (!fs.existsSync(this.servicesPath)) {
      return [];
    }

    return fs
      .readdirSync(this.servicesPath, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
  }
}

export const serviceLoader = new ServiceLoader();
