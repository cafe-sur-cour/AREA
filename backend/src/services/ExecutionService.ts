import { AppDataSource } from '../config/db';
import { WebhookConfigs } from '../config/entity/WebhookConfigs';
import { WebhookEvents } from '../config/entity/WebhookEvents';
import { WebhookReactions } from '../config/entity/WebhookReactions';
import { WebhookFailures } from '../config/entity/WebhookFailures';
import { Raw } from 'typeorm';
import type { Reaction } from '../types/mapping';
import { serviceRegistry } from './ServiceRegistry';
import { reactionExecutorRegistry } from './ReactionExecutorRegistry';
import type { ReactionExecutionContext } from '../types/service';
import { interpolatePayload } from '../utils/payloadInterpolation';

export class ExecutionService {
  private isRunning = false;
  private processingInterval: NodeJS.Timeout | undefined;
  private scheduledReactions = new Map<string, NodeJS.Timeout>();

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

    for (const [reactionId, timeoutId] of this.scheduledReactions.entries()) {
      clearTimeout(timeoutId);
      console.log(
        `🚫 [ExecutionService] Cancelled scheduled reaction ${reactionId} due to service stop`
      );
    }
    this.scheduledReactions.clear();

    console.log('AREA execution service stopped');
  }

  public cancelScheduledReaction(reactionId: string): boolean {
    const timeoutId = this.scheduledReactions.get(reactionId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.scheduledReactions.delete(reactionId);
      console.log(
        `🚫 [ExecutionService] Cancelled scheduled reaction ${reactionId}`
      );
      return true;
    }
    return false;
  }

  public getScheduledReactions(): string[] {
    return Array.from(this.scheduledReactions.keys());
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
        `🔄 [ExecutionService] Processing event ${event.id} - Action: ${event.action_type}, mapping_id: ${event.mapping_id}`
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
      console.log(
        `🚀 [ExecutionService] Processing event ${event.id} - Action: ${event.action_type}`
      );

      const mappings = await this.loadMappingsForAction(
        event,
        event.mapping_id ?? undefined
      );

      console.log(
        `📋 [ExecutionService] Found ${mappings.length} active mapping(s) for user ${event.user_id}`
      );

      if (mappings.length === 0) {
        console.log(
          `ℹ️  [ExecutionService] No active mappings found for action type '${event.action_type}', marking event as completed`
        );
        await this.markEventProcessed(event, 'completed', startTime);
        return;
      }

      console.log(
        `🎯 [ExecutionService] Starting execution of ${mappings.length} mapping(s)...`
      );

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
    event: WebhookEvents,
    mappingId?: number
  ): Promise<WebhookConfigs[]> {
    const actionType = event.action_type;
    const userId = event.user_id;

    console.log(
      `🔍 [ExecutionService] Loading mappings for action: ${actionType}, user: ${userId}${mappingId ? `, specific mapping: ${mappingId}` : ''}`
    );

    const mappingRepository = AppDataSource.getRepository(WebhookConfigs);

    if (mappingId) {
      const mapping = await mappingRepository.findOne({
        where: {
          id: mappingId,
          created_by: userId,
          is_active: true,
        },
      });
      const result = mapping ? [mapping] : [];
      console.log(
        `📊 [ExecutionService] Loaded specific mapping: ${result.length} found`
      );
      if (result.length > 0 && result[0]) {
        console.log(`📋 [ExecutionService] Mapping details:`, {
          id: result[0].id,
          name: result[0].name,
          action_type: result[0].action.type,
          reactions_count: result[0].reactions.length,
        });
      }
      return result;
    }

    const actionDefinition = serviceRegistry.getActionByType(actionType);
    if (actionDefinition?.metadata?.sharedEvents) {
      console.log(
        `🔍 [ExecutionService] Searching for mappings with shared action type: ${actionType} for all users`
      );

      const result = await mappingRepository.find({
        where: {
          is_active: true,
          action: Raw(alias => `${alias} ->> 'type' = :type`, {
            type: actionType,
          }),
        },
      });

      let filteredResult = result;
      if (actionDefinition.metadata?.sharedEventFilter) {
        if (
          actionDefinition.metadata.sharedEventFilter.constructor.name ===
          'AsyncFunction'
        ) {
          filteredResult = [];
          for (const mapping of result) {
            try {
              const shouldInclude =
                await actionDefinition.metadata.sharedEventFilter(
                  { source: event.source, payload: event.payload },
                  { action: mapping.action || {} },
                  mapping.created_by || event.user_id
                );
              if (shouldInclude) {
                filteredResult.push(mapping);
              }
            } catch (error) {
              console.error(
                `❌ [ExecutionService] Error in async filter for mapping ${mapping.id}:`,
                error
              );
            }
          }
        } else {
          filteredResult = result.filter(mapping => {
            try {
              const shouldInclude = actionDefinition.metadata!
                .sharedEventFilter!(
                { source: event.source, payload: event.payload },
                { action: mapping.action || {} },
                mapping.created_by || event.user_id
              );
              return shouldInclude;
            } catch (error) {
              console.error(
                `❌ [ExecutionService] Error in sync filter for mapping ${mapping.id}:`,
                error
              );
              return false;
            }
          });
        }
      }

      console.log(
        `📊 [ExecutionService] Found ${filteredResult.length} active mappings for shared action ${actionType} across all users`
      );

      return filteredResult;
    }

    console.log(
      `🔍 [ExecutionService] Searching for mappings with action type: ${actionType} for user: ${userId}`
    );

    const result = await mappingRepository.find({
      where: {
        is_active: true,
        created_by: userId,
        action: Raw(alias => `${alias} ->> 'type' = :type`, {
          type: actionType,
        }),
      },
    });

    console.log(
      `📊 [ExecutionService] Found ${result.length} active mappings for user ${userId}`
    );

    return result;
  }

  private async executeMappingReactions(
    event: WebhookEvents,
    mapping: WebhookConfigs
  ): Promise<void> {
    for (const [index, reaction] of mapping.reactions.entries()) {
      if (reaction.delay && reaction.delay > 0) {
        const reactionId = `${event.id}-${mapping.id}-${index}`;

        console.log(
          `⏰ [ExecutionService] Scheduling reaction ${reaction.type} with ${reaction.delay}s delay (ID: ${reactionId})`
        );

        const timeoutId = setTimeout(async () => {
          try {
            console.log(
              `🚀 [ExecutionService] Executing delayed reaction ${reaction.type} after ${reaction.delay}s (ID: ${reactionId})`
            );
            await this.executeReaction(event, mapping, reaction);

            this.scheduledReactions.delete(reactionId);

            console.log(
              `✅ [ExecutionService] Successfully executed delayed reaction ${reaction.type} (ID: ${reactionId})`
            );
          } catch (error) {
            console.error(
              `❌ [ExecutionService] Failed to execute delayed reaction ${reaction.type} (ID: ${reactionId}):`,
              error
            );
            this.scheduledReactions.delete(reactionId);
          }
        }, reaction.delay * 1000);

        this.scheduledReactions.set(reactionId, timeoutId);
      } else {
        console.log(
          `⚡ [ExecutionService] Executing immediate reaction ${reaction.type}`
        );
        await this.executeReaction(event, mapping, reaction);
      }
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
        console.error(
          `❌ [ExecutionService] Reaction attempt ${attempt} failed for ${reaction.type}:`,
          (error as Error).message
        );
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
      const mappingOwnerId = mapping.created_by;
      if (!mappingOwnerId) {
        console.error(
          `❌ [ExecutionService] Mapping ${mapping.id} (${mapping.name}) has no owner (created_by: ${mapping.created_by})`
        );
        throw new Error(
          `Mapping ${mapping.id} has no owner (created_by is null/undefined)`
        );
      }

      console.log(
        `🔑 [ExecutionService] Executing reaction for mapping ${mapping.id} (${mapping.name}) owned by user ${mappingOwnerId}`
      );

      const interpolatedConfig = interpolatePayload(
        reaction.config,
        event.payload
      );

      const context: ReactionExecutionContext = {
        reaction: {
          ...reaction,
          config: interpolatedConfig,
        },
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
          created_by: mappingOwnerId,
        },
        serviceConfig: await this.loadServiceConfig(
          reaction.type,
          mappingOwnerId
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
      const service = serviceRegistry.getService(serviceName);
      if (service?.getCredentials) {
        const credentials = await service.getCredentials(userId);
        return {
          credentials,
          settings: {},
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

  async ensureExternalWebhooksForMapping(
    mapping: WebhookConfigs,
    userId: number
  ): Promise<void> {
    const actionDefinition = serviceRegistry.getActionByType(
      mapping.action.type
    );
    if (!actionDefinition || !actionDefinition.metadata?.webhookPattern) {
      return;
    }

    const serviceId = mapping.action.type.split('.')[0];
    if (!serviceId) {
      return;
    }

    const serviceDefinition = serviceRegistry.getService(serviceId);

    if (serviceDefinition?.ensureWebhookForMapping) {
      await serviceDefinition.ensureWebhookForMapping(
        mapping,
        userId,
        actionDefinition
      );
    }
  }
}

export const executionService = new ExecutionService();
