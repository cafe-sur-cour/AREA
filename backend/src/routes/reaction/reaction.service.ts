import { serviceRegistry } from '../../services/ServiceRegistry';
import type { ReactionDefinition } from '../../types/service';

export class ReactionService {
  /**
   * Get all available reactions from all services
   */
  getAllReactions(): ReactionDefinition[] {
    return serviceRegistry.getAllReactions();
  }

  /**
   * Get reactions for a specific service
   */
  getReactionsByService(serviceId: string): ReactionDefinition[] {
    const service = serviceRegistry.getService(serviceId);
    if (!service) {
      return [];
    }
    return service.reactions;
  }

  /**
   * Get reactions grouped by service
   */
  getReactionsGroupedByService(): Record<string, ReactionDefinition[]> {
    const services = serviceRegistry.getAllServices();
    const groupedReactions: Record<string, ReactionDefinition[]> = {};

    services.forEach(service => {
      if (service.reactions.length > 0) {
        groupedReactions[service.id] = service.reactions;
      }
    });

    return groupedReactions;
  }

  /**
   * Get a specific reaction by type
   */
  getReactionByType(type: string): ReactionDefinition | undefined {
    return serviceRegistry.getReactionByType(type);
  }
}
