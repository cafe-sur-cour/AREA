import type {
  ReactionExecutor,
  ReactionExecutorRegistry,
  ReactionExecutionContext,
  ReactionExecutionResult,
} from '../types/service';

export class ReactionExecutorRegistryImpl implements ReactionExecutorRegistry {
  private executors = new Map<string, ReactionExecutor>();

  register(serviceId: string, executor: ReactionExecutor): void {
    if (this.executors.has(serviceId)) {
      throw new Error(
        `Executor for service '${serviceId}' is already registered`
      );
    }

    this.executors.set(serviceId, executor);
    console.log(`Registered reaction executor for service: ${serviceId}`);
  }

  unregister(serviceId: string): void {
    if (!this.executors.has(serviceId)) {
      console.warn(`Executor for service '${serviceId}' is not registered`);
      return;
    }

    this.executors.delete(serviceId);
    console.log(`Unregistered reaction executor for service: ${serviceId}`);
  }

  getExecutor(serviceId: string): ReactionExecutor | undefined {
    return this.executors.get(serviceId);
  }

  async executeReaction(
    reactionType: string,
    context: ReactionExecutionContext
  ): Promise<ReactionExecutionResult> {
    const [serviceId] = reactionType.split('.');

    if (!serviceId) {
      return {
        success: false,
        error: `Invalid reaction type: ${reactionType}`,
      };
    }

    const executor = this.executors.get(serviceId);
    if (!executor) {
      return {
        success: false,
        error: `No executor registered for service: ${serviceId}`,
      };
    }

    try {
      return await executor.execute(context);
    } catch (error) {
      console.error(`Error executing reaction ${reactionType}:`, error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }
}

export const reactionExecutorRegistry = new ReactionExecutorRegistryImpl();
