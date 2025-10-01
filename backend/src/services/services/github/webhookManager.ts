import fetch from 'node-fetch';
import crypto from 'crypto';
import { AppDataSource } from '../../../config/db';
import { ExternalWebhooks } from '../../../config/entity/ExternalWebhooks';
import { githubOAuth } from './oauth';

export interface GitHubWebhookConfig {
  repository: string;
  events: string[];
  secret?: string;
}

export class GitHubWebhookManager {
  private githubApiBaseUrl: string;

  constructor() {
    this.githubApiBaseUrl =
      process.env.SERVICE_GITHUB_API_BASE_URL || 'https://api.github.com';
  }

  async createWebhook(
    userId: number,
    config: GitHubWebhookConfig
  ): Promise<ExternalWebhooks> {
    const token = await githubOAuth.getUserToken(userId);
    if (!token) {
      throw new Error('GitHub token not found for user');
    }

    const webhookUrl = this.generateWebhookUrl();
    const secret = config.secret || this.generateSecret();

    const githubResponse = await fetch(
      `${this.githubApiBaseUrl}/repos/${config.repository}/hooks`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.token_value}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'AREA-App',
        },
        body: JSON.stringify({
          name: 'web',
          active: true,
          events: config.events,
          config: {
            url: webhookUrl,
            content_type: 'json',
            secret: secret,
          },
        }),
      }
    );

    if (!githubResponse.ok) {
      const error = await githubResponse.text();
      throw new Error(`Failed to create GitHub webhook: ${error}`);
    }

    const githubWebhook = (await githubResponse.json()) as { id: number };

    const externalWebhook = new ExternalWebhooks();
    externalWebhook.user_id = userId;
    externalWebhook.service = 'github';
    externalWebhook.external_id = githubWebhook.id.toString();
    externalWebhook.repository = config.repository;
    externalWebhook.url = webhookUrl;
    externalWebhook.secret = secret;
    externalWebhook.events = config.events;
    externalWebhook.is_active = true;

    const savedWebhook =
      await AppDataSource.getRepository(ExternalWebhooks).save(externalWebhook);

    return savedWebhook;
  }

  async deleteWebhook(userId: number, webhookId: number): Promise<void> {
    const webhook = await AppDataSource.getRepository(ExternalWebhooks).findOne(
      {
        where: {
          id: webhookId,
          user_id: userId,
          service: 'github',
        },
      }
    );

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    const token = await githubOAuth.getUserToken(userId);
    if (!token) {
      throw new Error('GitHub token not found for user');
    }

    if (webhook.external_id) {
      const githubResponse = await fetch(
        `${this.githubApiBaseUrl}/repos/${webhook.repository}/hooks/${webhook.external_id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token.token_value}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'AREA-App',
          },
        }
      );

      if (!githubResponse.ok && githubResponse.status !== 404) {
        console.warn(
          `Failed to delete webhook from GitHub: ${githubResponse.statusText}`
        );
      }
    }

    await AppDataSource.getRepository(ExternalWebhooks).remove(webhook);
  }

  async getUserWebhooks(userId: number): Promise<ExternalWebhooks[]> {
    return await AppDataSource.getRepository(ExternalWebhooks).find({
      where: {
        user_id: userId,
        service: 'github',
      },
      order: {
        created_at: 'DESC',
      },
    });
  }

  async updateWebhook(
    userId: number,
    webhookId: number,
    updates: Partial<GitHubWebhookConfig>
  ): Promise<ExternalWebhooks> {
    const webhook = await AppDataSource.getRepository(ExternalWebhooks).findOne(
      {
        where: {
          id: webhookId,
          user_id: userId,
          service: 'github',
        },
      }
    );

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    const token = await githubOAuth.getUserToken(userId);
    if (!token) {
      throw new Error('GitHub token not found for user');
    }

    const githubUpdates: {
      active: boolean;
      events: string[];
      config?: { secret: string };
    } = {
      active: webhook.is_active,
      events: updates.events || webhook.events || [],
    };

    if (updates.secret) {
      githubUpdates.config = {
        secret: updates.secret,
      };
    }

    const githubResponse = await fetch(
      `${this.githubApiBaseUrl}/repos/${webhook.repository}/hooks/${webhook.external_id}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token.token_value}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'AREA-App',
        },
        body: JSON.stringify(githubUpdates),
      }
    );

    if (!githubResponse.ok) {
      const error = await githubResponse.text();
      throw new Error(`Failed to update GitHub webhook: ${error}`);
    }

    if (updates.events) {
      webhook.events = updates.events;
    }
    if (updates.secret) {
      webhook.secret = updates.secret;
    }
    if (updates.repository) {
      webhook.repository = updates.repository;
    }

    webhook.updated_at = new Date();

    return await AppDataSource.getRepository(ExternalWebhooks).save(webhook);
  }

  private generateWebhookUrl(): string {
    const baseUrl = process.env.WEBHOOK_BASE_URL || '';
    return `${baseUrl}/api/webhooks/github`;
  }

  private generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

export const githubWebhookManager = new GitHubWebhookManager();
