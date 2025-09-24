import { AppDataSource } from '../config/db';
import { WebhookConfigs } from '../config/entity/WebhookConfigs';
import { WebhookEvents } from '../config/entity/WebhookEvents';
import { WebhookReactions } from '../config/entity/WebhookReactions';
import { WebhookFailures } from '../config/entity/WebhookFailures';
import type { Action, Reaction } from '../types/mapping';

export class ExecutionService {
  private isRunning = false;
  private processingInterval: NodeJS.Timeout | undefined;

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
      const mappings = await this.loadMappingsForAction(
        event.action_type,
        event.user_id
      );

      if (mappings.length === 0) {
        await this.markEventProcessed(event, 'completed', startTime);
        return;
      }

      const reactionPromises = mappings.map(mapping =>
        this.executeMappingReactions(event, mapping)
      );

      await Promise.allSettled(reactionPromises);

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
  ): Promise<void> {
    const reactionStartTime = Date.now();

    const reactionRecord = await this.createReactionRecord(
      event.id,
      reaction.type
    );

    try {
      // TODO: Replace placeholder with actual reaction execution logic
      const result = await this.executeReactionPlaceholder(
        reaction,
        event.payload
      );

      await this.updateReactionRecord(
        reactionRecord,
        'completed',
        result,
        reactionStartTime
      );
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

  /**
   * PLACEHOLDER: This is a temporary implementation for reaction execution.
   * Replace this method with actual service integrations (Discord, GitHub, etc.)
   */
  private async executeReactionPlaceholder(
    reaction: Reaction,
    eventPayload: Record<string, unknown> // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<Record<string, unknown>> {
    // PLACEHOLDER: Simulate random failures for testing (10% failure rate)
    if (Math.random() < 0.1) {
      throw new Error(`Simulated failure for reaction: ${reaction.type}`);
    }

    // PLACEHOLDER: Return mock success response
    return {
      status: 'success',
      executed_at: new Date().toISOString(),
      reaction_type: reaction.type,
    };
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
}

export const executionService = new ExecutionService();
