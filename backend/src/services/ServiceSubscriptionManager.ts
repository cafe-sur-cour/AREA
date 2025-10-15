import { AppDataSource } from '../config/db';
import { UserServiceSubscriptions } from '../config/entity/UserServiceSubscriptions';
import { ExternalWebhooks } from '../config/entity/ExternalWebhooks';
import { serviceRegistry } from './ServiceRegistry';

export class ServiceSubscriptionManager {
  async isUserSubscribed(userId: number, service: string): Promise<boolean> {
    const serviceDefinition = serviceRegistry.getService(service);

    if (serviceDefinition?.alwaysSubscribed) {
      return true;
    }

    const subscription = await AppDataSource.getRepository(
      UserServiceSubscriptions
    ).findOne({
      where: {
        user_id: userId,
        service: service,
      },
    });

    return subscription?.subscribed || false;
  }

  async getUserSubscription(
    userId: number,
    service: string
  ): Promise<UserServiceSubscriptions | null> {
    return await AppDataSource.getRepository(UserServiceSubscriptions).findOne({
      where: {
        user_id: userId,
        service: service,
      },
    });
  }

  async subscribeUser(
    userId: number,
    service: string
  ): Promise<UserServiceSubscriptions> {
    const repo = AppDataSource.getRepository(UserServiceSubscriptions);

    let subscription = await repo.findOne({
      where: {
        user_id: userId,
        service: service,
      },
    });

    if (subscription) {
      subscription.subscribed = true;
      subscription.subscribed_at = new Date();
      subscription.unsubscribed_at = null;
    } else {
      subscription = new UserServiceSubscriptions();
      subscription.user_id = userId;
      subscription.service = service;
      subscription.subscribed = true;
      subscription.subscribed_at = new Date();
    }

    return await repo.save(subscription);
  }

  async unsubscribeUser(
    userId: number,
    service: string
  ): Promise<UserServiceSubscriptions | null> {
    const repo = AppDataSource.getRepository(UserServiceSubscriptions);

    const subscription = await repo.findOne({
      where: {
        user_id: userId,
        service: service,
      },
    });

    if (!subscription) {
      return null;
    }

    try {
      await this.deleteActiveWebhooks(userId, service);
    } catch (error) {
      console.error(
        `Error deleting webhooks for user ${userId} service ${service}:`,
        error
      );
    }

    subscription.subscribed = false;
    subscription.unsubscribed_at = new Date();

    return await repo.save(subscription);
  }

  private async deleteActiveWebhooks(
    userId: number,
    service: string
  ): Promise<void> {
    const activeWebhooks = await AppDataSource.getRepository(
      ExternalWebhooks
    ).find({
      where: {
        user_id: userId,
        service: service,
        is_active: true,
      },
    });

    if (activeWebhooks.length === 0) {
      console.log(
        `No active webhooks found for user ${userId} service ${service}`
      );
      return;
    }

    console.log(
      `Deleting ${activeWebhooks.length} active webhooks for user ${userId} service ${service}`
    );

    const serviceDefinition = serviceRegistry.getService(service);

    for (const webhook of activeWebhooks) {
      try {
        if (serviceDefinition?.deleteWebhook) {
          await serviceDefinition.deleteWebhook(userId, webhook.id);
        }

        console.log(
          `Successfully deleted webhook ${webhook.id} from ${service}`
        );
      } catch (error) {
        console.error(
          `Failed to delete webhook ${webhook.id} from ${service}:`,
          error
        );
        webhook.is_active = false;
        await AppDataSource.getRepository(ExternalWebhooks).save(webhook);
      }
    }
  }

  async getUserSubscriptions(
    userId: number
  ): Promise<UserServiceSubscriptions[]> {
    return await AppDataSource.getRepository(UserServiceSubscriptions).find({
      where: {
        user_id: userId,
      },
      order: {
        service: 'ASC',
      },
    });
  }

  async autoSubscribeOnFirstLogin(
    userId: number,
    service: string
  ): Promise<UserServiceSubscriptions> {
    const existing = await this.getUserSubscription(userId, service);

    if (!existing) {
      return await this.subscribeUser(userId, service);
    }

    return existing;
  }
}

export const serviceSubscriptionManager = new ServiceSubscriptionManager();
