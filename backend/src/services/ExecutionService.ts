import { AppDataSource } from '../config/db';
import { WebhookConfigs } from '../config/entity/WebhookConfigs';
import { WebhookEvents } from '../config/entity/WebhookEvents';
import { WebhookReactions } from '../config/entity/WebhookReactions';
import { WebhookFailures } from '../config/entity/WebhookFailures';
import type { Action, Reaction } from '../types/mapping';
import { serviceRegistry } from './ServiceRegistry';
import { reactionExecutorRegistry } from './ReactionExecutorRegistry';
import { UserServiceConfigService } from './UserServiceConfigService';
import type { ReactionExecutionContext } from '../types/service';

export class ExecutionService {
  private isRunning = false;
  private processingInterval: NodeJS.Timeout | undefined;
  private userServiceConfigService = new UserServiceConfigService();

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Execution service is already running');
      return;
    }

    console.log('Starting AREA execution service...');
    this.isRunning = true;

    await this.processPendingEvents();
    this.processingInterval = setInterval(() => {
      this.processPendingEvents();
    }, 5000); /* Process every 5 seconds */

    console.log('AREA execution service started successfully');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log('Stopping AREA execution service...');
    this.isRunning = false;

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }

    console.log('AREA execution service stopped');
  }

  private async processPendingEvents(): Promise<void> {
    try {
      const eventRepository = AppDataSource.getRepository(WebhookEvents);

      const pendingEvents = await eventRepository.find({
        where: { status: 'received' },
        order: { created_at: 'ASC' },
        take: 10,
      });

      if (pendingEvents.length === 0) {
        return;
      }

      for (const event of pendingEvents) {
        await this.processEvent(event);
      }
    } catch (error) {
      console.error('Error processing pending events:', error);
    }
  }

  private async processEvent(event: WebhookEvents): Promise<void> {
    const startTime = Date.now();

    try {
      console.log(
        `🔄 [ExecutionService] Processing event ${event.id} - Action: ${event.action_type}`
      );

      const actionDefinition = serviceRegistry.getActionByType(
        event.action_type
      );
      if (!actionDefinition) {
        console.warn(
          `⚠️  [ExecutionService] Unknown action type: ${event.action_type}`
        );
        await this.markEventProcessed(
          event,
          'failed',
          startTime,
          `Unknown action type: ${event.action_type}`
        );
        return;
      }
      const mappings = await this.loadMappingsForAction(
        event.action_type,
        event.user_id
      );

      console.log(
        `📋 [ExecutionService] Found ${mappings.length} active mapping(s) for user ${event.user_id}`
      );

      if (mappings.length === 0) {
        console.log(
          `ℹ️  [ExecutionService] No active mappings found, marking event as completed`
        );
        await this.markEventProcessed(event, 'completed', startTime);
        return;
      }

      for (const mapping of mappings) {
        for (const reaction of mapping.reactions) {
          const reactionDefinition = serviceRegistry.getReactionByType(
            reaction.type
          );
          if (!reactionDefinition) {
            console.warn(
              `Unknown reaction type in mapping ${mapping.id}: ${reaction.type}`
            );
          }
        }
      }

      const reactionPromises = mappings.map(mapping =>
        this.executeMappingReactions(event, mapping)
      );

      await Promise.allSettled(reactionPromises);

      console.log(
        `✅ [ExecutionService] Event ${event.id} processed successfully`
      );
      await this.markEventProcessed(event, 'completed', startTime);
    } catch (error) {
      console.error(`Error processing event ${event.id}:`, error);
      await this.markEventProcessed(
        event,
        'failed',
        startTime,
        (error as Error).message
      );
    }
  }

  private async loadMappingsForAction(
    actionType: string,
    userId: number
  ): Promise<WebhookConfigs[]> {
    const mappingRepository = AppDataSource.getRepository(WebhookConfigs);

    return await mappingRepository.find({
      where: {
        is_active: true,
        created_by: userId,
        action: {
          type: actionType,
        } as Partial<Action>,
      },
    });
  }

  private async executeMappingReactions(
    event: WebhookEvents,
    mapping: WebhookConfigs
  ): Promise<void> {
    for (const reaction of mapping.reactions) {
      await this.executeReaction(event, mapping, reaction);
    }
  }

  private async executeReaction(
    event: WebhookEvents,
    mapping: WebhookConfigs,
    reaction: Reaction
  ): Promise<void> {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        await this.attemptReactionExecution(event, mapping, reaction);
        return;
      } catch (error) {
        attempt++;
        if (attempt >= maxRetries) {
          await this.recordReactionFailure(
            event,
            mapping,
            reaction,
            error as Error
          );
          throw error;
        }

        await new Promise(resolve =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }

  private async attemptReactionExecution(
    event: WebhookEvents,
    mapping: WebhookConfigs,
    reaction: Reaction
  ): Promise<Record<string, unknown>> {
    const reactionStartTime = Date.now();

    const reactionRecord = await this.createReactionRecord(
      event.id,
      reaction.type
    );

    try {
      const context: ReactionExecutionContext = {
        reaction,
        event: {
          id: event.id,
          action_type: event.action_type,
          user_id: event.user_id,
          payload: event.payload,
          created_at: event.created_at,
        },
        mapping: {
          id: mapping.id,
          name: mapping.name,
          created_by: mapping.created_by || event.user_id,
        },
        serviceConfig: await this.loadServiceConfig(
          reaction.type,
          event.user_id
        ),
      };

      const result = await reactionExecutorRegistry.executeReaction(
        reaction.type,
        context
      );

      if (!result.success) {
        throw new Error(result.error || 'Reaction execution failed');
      }

      await this.updateReactionRecord(
        reactionRecord,
        'completed',
        result.output,
        reactionStartTime
      );

      console.log(
        `🎯 [ExecutionService] Reaction "${reaction.type}" executed successfully (${Date.now() - reactionStartTime}ms)`
      );

      return result.output || {};
    } catch (error) {
      await this.updateReactionRecord(
        reactionRecord,
        'failed',
        undefined,
        reactionStartTime,
        (error as Error).message
      );
      throw error;
    }
  }

  private async createReactionRecord(
    eventId: number,
    reactionName: string
  ): Promise<WebhookReactions> {
    const reactionRepository = AppDataSource.getRepository(WebhookReactions);

    const reaction = reactionRepository.create({
      webhook_event_id: eventId,
      reaction_name: reactionName,
      status: 'pending',
    });

    return await reactionRepository.save(reaction);
  }

  private async updateReactionRecord(
    reaction: WebhookReactions,
    status: string,
    outputData?: Record<string, unknown>,
    startTime?: number,
    errorMessage?: string
  ): Promise<void> {
    const reactionRepository = AppDataSource.getRepository(WebhookReactions);

    reaction.status = status;
    if (outputData) {
      reaction.output_data = outputData;
    }
    if (errorMessage) {
      reaction.error_message = errorMessage;
    }
    if (startTime) {
      reaction.execution_time_ms = Date.now() - startTime;
    }
    reaction.executed_at = new Date();

    await reactionRepository.save(reaction);
  }

  private async recordReactionFailure(
    event: WebhookEvents,
    mapping: WebhookConfigs,
    reaction: Reaction,
    error: Error
  ): Promise<void> {
    const failureRepository = AppDataSource.getRepository(WebhookFailures);

    const failure = failureRepository.create({
      action_type: event.action_type,
      payload: event.payload,
      error_message: error.message,
      retry_count: 3,
      user_agent: event.user_agent || null,
    });

    await failureRepository.save(failure);
  }

  private async markEventProcessed(
    event: WebhookEvents,
    status: string,
    startTime: number,
    errorMessage?: string
  ): Promise<void> {
    const eventRepository = AppDataSource.getRepository(WebhookEvents);

    event.status = status;
    event.processed_at = new Date();
    event.processing_time_ms = Date.now() - startTime;
    if (errorMessage) {
      event.error_message = errorMessage;
    }

    await eventRepository.save(event);
  }

  private async loadServiceConfig(
    reactionType: string,
    userId: number
  ): Promise<{
    credentials: Record<string, string>;
    settings: Record<string, unknown>;
    env: NodeJS.ProcessEnv;
  }> {
    const serviceName = reactionType.split('.')[0];

    if (!serviceName) {
      return {
        credentials: {},
        settings: {},
        env: process.env,
      };
    }

    try {
      const userConfig =
        await this.userServiceConfigService.getUserServiceConfig(
          userId,
          serviceName
        );

      if (userConfig) {
        return {
          credentials: userConfig.credentials,
          settings: userConfig.settings,
          env: process.env,
        };
      }
    } catch (error) {
      console.warn(`Failed to load service config for ${serviceName}:`, error);
    }

    return {
      credentials: {},
      settings: {},
      env: process.env,
    };
  }
}

export const executionService = new ExecutionService();
