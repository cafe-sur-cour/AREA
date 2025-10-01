import { serviceRegistry } from '../../services/ServiceRegistry';
import type { ActionDefinition } from '../../types/service';

export class ActionService {
  /**
   * Get all available actions from all services
   */
  getAllActions(): ActionDefinition[] {
    return serviceRegistry.getAllActions();
  }

  /**
   * Get actions for a specific service
   */
  getActionsByService(serviceId: string): ActionDefinition[] {
    const service = serviceRegistry.getService(serviceId);
    if (!service) {
      return [];
    }
    return service.actions;
  }

  /**
   * Get actions grouped by service
   */
  getActionsGroupedByService(): Record<string, ActionDefinition[]> {
    const services = serviceRegistry.getAllServices();
    const groupedActions: Record<string, ActionDefinition[]> = {};

    services.forEach(service => {
      if (service.actions.length > 0) {
        groupedActions[service.id] = service.actions;
      }
    });

    return groupedActions;
  }

  /**
   * Get a specific action by type
   */
  getActionByType(type: string): ActionDefinition | undefined {
    return serviceRegistry.getActionByType(type);
  }
}
