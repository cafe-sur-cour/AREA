import { AppDataSource } from '../config/db';
import { UserServiceConfigs } from '../config/entity/UserServiceConfigs';
import type {
  UserServiceConfig,
  CreateUserServiceConfigRequest,
  UpdateUserServiceConfigRequest
} from '../models/UserServiceConfig';

export class UserServiceConfigService {
  private repository = AppDataSource.getRepository(UserServiceConfigs);

  async getUserServiceConfigs(userId: number): Promise<UserServiceConfig[]> {
    const configs = await this.repository.find({
      where: { user_id: userId, is_active: true },
      order: { created_at: 'DESC' }
    });

    return configs.map(config => ({
      id: config.id,
      user_id: config.user_id,
      service: config.service,
      credentials: config.credentials,
      settings: config.settings,
      is_active: config.is_active,
      created_at: config.created_at,
      updated_at: config.updated_at
    }));
  }

  async getUserServiceConfig(userId: number, service: string): Promise<UserServiceConfig | null> {
    const config = await this.repository.findOne({
      where: { user_id: userId, service, is_active: true }
    });

    if (!config) return null;

    return {
      id: config.id,
      user_id: config.user_id,
      service: config.service,
      credentials: config.credentials,
      settings: config.settings,
      is_active: config.is_active,
      created_at: config.created_at,
      updated_at: config.updated_at
    };
  }

  async upsertUserServiceConfig(
    userId: number,
    request: CreateUserServiceConfigRequest
  ): Promise<UserServiceConfig> {
    const existingConfig = await this.repository.findOne({
      where: { user_id: userId, service: request.service }
    });

    if (existingConfig) {
      existingConfig.credentials = request.credentials;
      if (request.settings) {
        existingConfig.settings = request.settings;
      }
      existingConfig.is_active = true;
      existingConfig.updated_at = new Date();

      await this.repository.save(existingConfig);

      return {
        id: existingConfig.id,
        user_id: existingConfig.user_id,
        service: existingConfig.service,
        credentials: existingConfig.credentials,
        settings: existingConfig.settings,
        is_active: existingConfig.is_active,
        created_at: existingConfig.created_at,
        updated_at: existingConfig.updated_at
      };
    } else {
      const newConfig = this.repository.create({
        user_id: userId,
        service: request.service,
        credentials: request.credentials,
        settings: request.settings || {},
        is_active: true
      });

      const savedConfig = await this.repository.save(newConfig);

      return {
        id: savedConfig.id,
        user_id: savedConfig.user_id,
        service: savedConfig.service,
        credentials: savedConfig.credentials,
        settings: savedConfig.settings,
        is_active: savedConfig.is_active,
        created_at: savedConfig.created_at,
        updated_at: savedConfig.updated_at
      };
    }
  }

  async updateUserServiceConfig(
    userId: number,
    service: string,
    request: UpdateUserServiceConfigRequest
  ): Promise<UserServiceConfig | null> {
    const config = await this.repository.findOne({
      where: { user_id: userId, service, is_active: true }
    });

    if (!config) return null;

    if (request.credentials) {
      config.credentials = request.credentials;
    }
    if (request.settings) {
      config.settings = request.settings;
    }
    if (request.is_active !== undefined) {
      config.is_active = request.is_active;
    }
    config.updated_at = new Date();

    await this.repository.save(config);

    return {
      id: config.id,
      user_id: config.user_id,
      service: config.service,
      credentials: config.credentials,
      settings: config.settings,
      is_active: config.is_active,
      created_at: config.created_at,
      updated_at: config.updated_at
    };
  }

  async deleteUserServiceConfig(userId: number, service: string): Promise<boolean> {
    const config = await this.repository.findOne({
      where: { user_id: userId, service, is_active: true }
    });

    if (!config) return false;

    config.is_active = false;
    config.updated_at = new Date();

    await this.repository.save(config);
    return true;
  }

  async hasServiceConfig(userId: number, service: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { user_id: userId, service, is_active: true }
    });
    return count > 0;
  }
}