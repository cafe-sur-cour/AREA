import fetch from 'node-fetch';
import crypto from 'crypto';
import { AppDataSource } from '../../../config/db';
import { ExternalWebhooks } from '../../../config/entity/ExternalWebhooks';
import { gitlabOAuth } from './oauth';

export interface GitLabWebhookConfig {
  project: string;
  events: string[];
  secret?: string;
}

export class GitLabWebhookManager {
  private gitlabApiBaseUrl: string;

  constructor() {
    this.gitlabApiBaseUrl =
      process.env.SERVICE_GITLAB_API_BASE_URL || 'https://gitlab.com/api/v4';
  }

  async createWebhook(
    userId: number,
    config: GitLabWebhookConfig
  ): Promise<ExternalWebhooks> {
    console.log(
      `🔧 [WEBHOOK] Creating webhook for ${config.project} (user: ${userId}) with events: [${config.events.join(', ')}]`
    );

    const existingWebhooks = await AppDataSource.getRepository(
      ExternalWebhooks
    ).find({
      where: {
        user_id: userId,
        service: 'gitlab',
        repository: config.project,
        is_active: true,
      },
    });

    const existingWebhookInDb = existingWebhooks.find(webhook =>
      this.arraysEqual((webhook.events || []).sort(), config.events.sort())
    );

    if (existingWebhookInDb) {
      console.log(
        `♻️  [WEBHOOK] Using existing webhook (ID: ${existingWebhookInDb.id}) for events [${config.events.join(', ')}]`
      );
      return existingWebhookInDb;
    }

    const token = await gitlabOAuth.getUserToken(userId);
    if (!token) {
      console.error('❌ [WEBHOOK] GitLab token not found for user');
      throw new Error('GitLab token not found for user');
    }

    const webhookUrl = this.generateWebhookUrl();
    const secret = config.secret || this.getDefaultSecret();

    const gitlabEvents = this.mapEventsToGitLab(config.events);

    const requestBody = {
      url: webhookUrl,
      token: secret,
      enable_ssl_verification: true,
      ...gitlabEvents,
    };

    const gitlabApiUrl = `${this.gitlabApiBaseUrl}/projects/${encodeURIComponent(config.project)}/hooks`;

    const gitlabResponse = await fetch(gitlabApiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.token_value}`,
        'Content-Type': 'application/json',
        'User-Agent': 'AREA-App',
      },
      body: JSON.stringify(requestBody),
    });

    let gitlabWebhook: { id: number };

    if (!gitlabResponse.ok) {
      const error = await gitlabResponse.text();

      if (gitlabResponse.status === 422) {
        console.log(
          `🔍 [WEBHOOK] Webhook already exists on GitLab, finding it...`
        );
        const existingWebhook = await this.findExistingWebhook(
          token.token_value,
          config.project,
          webhookUrl
        );
        if (existingWebhook) {
          console.log(
            `✅ [WEBHOOK] Using existing GitLab webhook (ID: ${existingWebhook.id})`
          );
          gitlabWebhook = existingWebhook;
        } else {
          throw new Error(`Failed to find existing webhook: ${error}`);
        }
      } else {
        throw new Error(`Failed to create GitLab webhook: ${error}`);
      }
    } else {
      gitlabWebhook = (await gitlabResponse.json()) as { id: number };
      console.log(
        `✅ [WEBHOOK] GitLab webhook created (ID: ${gitlabWebhook.id})`
      );
    }

    const existingDbWebhook = await AppDataSource.getRepository(
      ExternalWebhooks
    ).findOne({
      where: {
        user_id: userId,
        service: 'gitlab',
        external_id: gitlabWebhook.id.toString(),
        repository: config.project,
      },
    });

    if (existingDbWebhook) {
      console.log(
        `♻️  [WEBHOOK] Using existing database record (ID: ${existingDbWebhook.id})`
      );
      return existingDbWebhook;
    }

    const externalWebhook = new ExternalWebhooks();
    externalWebhook.user_id = userId;
    externalWebhook.service = 'gitlab';
    externalWebhook.external_id = gitlabWebhook.id.toString();
    externalWebhook.repository = config.project;
    externalWebhook.url = webhookUrl;
    externalWebhook.secret = secret;
    externalWebhook.events = config.events;
    externalWebhook.is_active = true;

    const savedWebhook =
      await AppDataSource.getRepository(ExternalWebhooks).save(externalWebhook);

    console.log(
      `✅ [WEBHOOK] Webhook saved to database (ID: ${savedWebhook.id})`
    );

    return savedWebhook;
  }

  async deleteWebhook(userId: number, webhookId: number): Promise<void> {
    const webhook = await AppDataSource.getRepository(ExternalWebhooks).findOne(
      {
        where: {
          id: webhookId,
          user_id: userId,
          service: 'gitlab',
        },
      }
    );

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    const token = await gitlabOAuth.getUserToken(userId);
    if (!token) {
      throw new Error('GitLab token not found for user');
    }

    if (webhook.external_id) {
      const gitlabResponse = await fetch(
        `${this.gitlabApiBaseUrl}/projects/${encodeURIComponent(webhook.repository)}/hooks/${webhook.external_id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token.token_value}`,
            'User-Agent': 'AREA-App',
          },
        }
      );

      if (!gitlabResponse.ok && gitlabResponse.status !== 404) {
        console.warn(
          `Failed to delete webhook from GitLab: ${gitlabResponse.statusText}`
        );
      }
    }

    await AppDataSource.getRepository(ExternalWebhooks).remove(webhook);
  }

  async getUserWebhooks(userId: number): Promise<ExternalWebhooks[]> {
    return await AppDataSource.getRepository(ExternalWebhooks).find({
      where: {
        user_id: userId,
        service: 'gitlab',
      },
      order: {
        created_at: 'DESC',
      },
    });
  }

  async updateWebhook(
    userId: number,
    webhookId: number,
    updates: Partial<GitLabWebhookConfig>
  ): Promise<ExternalWebhooks> {
    const webhook = await AppDataSource.getRepository(ExternalWebhooks).findOne(
      {
        where: {
          id: webhookId,
          user_id: userId,
          service: 'gitlab',
        },
      }
    );

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    const token = await gitlabOAuth.getUserToken(userId);
    if (!token) {
      throw new Error('GitLab token not found for user');
    }

    const gitlabUpdates: Record<string, boolean | string> = {};

    if (updates.events) {
      const gitlabEvents = this.mapEventsToGitLab(updates.events);
      Object.assign(gitlabUpdates, gitlabEvents);
    }

    if (updates.secret) {
      gitlabUpdates.token = updates.secret;
    }

    const gitlabResponse = await fetch(
      `${this.gitlabApiBaseUrl}/projects/${encodeURIComponent(webhook.repository)}/hooks/${webhook.external_id}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token.token_value}`,
          'Content-Type': 'application/json',
          'User-Agent': 'AREA-App',
        },
        body: JSON.stringify(gitlabUpdates),
      }
    );

    if (!gitlabResponse.ok) {
      const error = await gitlabResponse.text();
      throw new Error(`Failed to update GitLab webhook: ${error}`);
    }

    if (updates.events) {
      webhook.events = updates.events;
    }
    if (updates.secret) {
      webhook.secret = updates.secret;
    }
    if (updates.project) {
      webhook.repository = updates.project;
    }

    webhook.updated_at = new Date();

    return await AppDataSource.getRepository(ExternalWebhooks).save(webhook);
  }

  private async findExistingWebhook(
    token: string,
    project: string,
    expectedUrl: string
  ): Promise<{ id: number } | null> {
    try {
      const response = await fetch(
        `${this.gitlabApiBaseUrl}/projects/${encodeURIComponent(project)}/hooks`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'User-Agent': 'AREA-App',
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const webhooks = (await response.json()) as Array<{
        id: number;
        url: string;
        push_events: boolean;
        issues_events: boolean;
        merge_requests_events: boolean;
      }>;

      for (const webhook of webhooks) {
        if (webhook.url === expectedUrl) {
          return { id: webhook.id };
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  private mapEventsToGitLab(events: string[]): Record<string, boolean> {
    const eventMap: Record<string, boolean> = {};

    for (const event of events) {
      switch (event) {
        case 'Push Hook':
          eventMap.push_events = true;
          break;
        case 'Merge Request Hook':
          eventMap.merge_requests_events = true;
          break;
        case 'Issue Hook':
          eventMap.issues_events = true;
          break;
        default:
          console.warn(`Unknown GitLab event: ${event}`);
      }
    }

    return eventMap;
  }

  private generateWebhookUrl(): string {
    const baseUrl = process.env.WEBHOOK_BASE_URL || '';
    return `${baseUrl}/api/webhooks/gitlab`;
  }

  private getDefaultSecret(): string {
    const envSecret = process.env.WEBHOOK_SECRET;
    if (envSecret && envSecret.trim() !== '') {
      return envSecret.trim();
    }

    console.warn(
      '⚠️  [WEBHOOK] WEBHOOK_SECRET not set, generating random secret'
    );
    return this.generateSecret();
  }

  private generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private arraysEqual(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
}

export const gitlabWebhookManager = new GitLabWebhookManager();
