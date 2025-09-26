import type {
  Service,
  ServiceRegistry,
  ActionDefinition,
  ReactionDefinition,
} from '../types/service';

export class ServiceRegistryImpl implements ServiceRegistry {
  private services = new Map<string, Service>();

  register(service: Service): void {
    if (this.services.has(service.id)) {
      throw new Error(`Service with id '${service.id}' is already registered`);
    }

    this.validateService(service);

    this.services.set(service.id, service);
    console.log(`Registered service: ${service.name} (${service.id})`);
  }

  unregister(serviceId: string): void {
    if (!this.services.has(serviceId)) {
      console.warn(`Service with id '${serviceId}' is not registered`);
      return;
    }

    this.services.delete(serviceId);
    console.log(`Unregistered service: ${serviceId}`);
  }

  getService(serviceId: string): Service | undefined {
    return this.services.get(serviceId);
  }

  getAllServices(): Service[] {
    return Array.from(this.services.values());
  }

  getAllActions(): ActionDefinition[] {
    const actions: ActionDefinition[] = [];
    for (const service of this.services.values()) {
      actions.push(...service.actions);
    }
    return actions;
  }

  getAllReactions(): ReactionDefinition[] {
    const reactions: ReactionDefinition[] = [];
    for (const service of this.services.values()) {
      reactions.push(...service.reactions);
    }
    return reactions;
  }

  getActionByType(type: string): ActionDefinition | undefined {
    for (const service of this.services.values()) {
      const action = service.actions.find(action => action.id === type);
      if (action) {
        return action;
      }
    }
    return undefined;
  }

  getReactionByType(type: string): ReactionDefinition | undefined {
    for (const service of this.services.values()) {
      const reaction = service.reactions.find(reaction => reaction.id === type);
      if (reaction) {
        return reaction;
      }
    }
    return undefined;
  }

  private validateService(service: Service): void {
    if (!service.id || typeof service.id !== 'string') {
      throw new Error('Service must have a valid id');
    }

    if (!service.name || typeof service.name !== 'string') {
      throw new Error('Service must have a valid name');
    }

    if (!Array.isArray(service.actions)) {
      throw new Error('Service actions must be an array');
    }

    if (!Array.isArray(service.reactions)) {
      throw new Error('Service reactions must be an array');
    }

    const actionIds = new Set<string>();
    for (const action of service.actions) {
      if (actionIds.has(action.id)) {
        throw new Error(
          `Duplicate action id '${action.id}' in service '${service.id}'`
        );
      }
      actionIds.add(action.id);
    }

    const reactionIds = new Set<string>();
    for (const reaction of service.reactions) {
      if (reactionIds.has(reaction.id)) {
        throw new Error(
          `Duplicate reaction id '${reaction.id}' in service '${service.id}'`
        );
      }
      reactionIds.add(reaction.id);
    }
  }
}

export const serviceRegistry = new ServiceRegistryImpl();
