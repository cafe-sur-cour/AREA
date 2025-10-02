import { AppDataSource } from '../../config/db';
import { WebhookConfigs } from '../../config/entity/WebhookConfigs';
import { Not } from 'typeorm';
import type { Action, Reaction } from '../../types/mapping';

export class MappingService {
  private mappingRepository = AppDataSource.getRepository(WebhookConfigs);

  generateDefaultName(action: Action, reactions: Reaction[]): string {
    const actionPart = action.type.replace(/\./g, ' ').replace(/_/g, ' ');

    if (reactions.length === 1 && reactions[0]) {
      const reactionPart = reactions[0].type
        .replace(/\./g, ' ')
        .replace(/_/g, ' ');
      return `${actionPart} → ${reactionPart}`;
    } else {
      return `${actionPart} → ${reactions.length} reactions`;
    }
  }

  async generateUniqueName(
    baseName: string,
    userId: number,
    excludeId?: number
  ): Promise<string> {
    let uniqueName = baseName;
    let counter = 1;

    while (await this.isNameTaken(uniqueName, userId, excludeId)) {
      uniqueName = `${baseName} (${counter})`;
      counter++;
    }

    return uniqueName;
  }

  async isNameTaken(
    name: string,
    userId: number,
    excludeId?: number
  ): Promise<boolean> {
    if (excludeId) {
      const existing = await this.mappingRepository.findOne({
        where: {
          name,
          created_by: userId,
          id: Not(excludeId),
        },
      });
      return !!existing;
    }

    const existing = await this.mappingRepository.findOne({
      where: {
        name,
        created_by: userId,
      },
    });

    return !!existing;
  }

  async createMapping(data: {
    name?: string;
    description?: string;
    action: Action;
    reactions: Reaction[];
    is_active?: boolean;
    created_by: number;
  }): Promise<WebhookConfigs> {
    const {
      name,
      description,
      action,
      reactions,
      is_active = true,
      created_by,
    } = data;

    console.log('Creating mapping with action:', JSON.stringify(action));
    console.log('Creating mapping with reactions:', JSON.stringify(reactions));

    let finalName: string;
    if (name) {
      finalName = await this.generateUniqueName(name, created_by);
    } else {
      const defaultName = this.generateDefaultName(action, reactions);
      finalName = await this.generateUniqueName(defaultName, created_by);
    }

    const newMapping = new WebhookConfigs();
    newMapping.name = finalName;
    newMapping.description = description || null;
    newMapping.action = action;
    newMapping.reactions = reactions;
    newMapping.is_active = is_active;
    newMapping.created_by = created_by;

    const saved = await this.mappingRepository.save(newMapping);
    console.log(
      'Saved mapping:',
      saved.id,
      'action:',
      saved.action,
      'reactions:',
      saved.reactions
    );

    return saved;
  }

  async getUserMappings(userId: number): Promise<WebhookConfigs[]> {
    return await this.mappingRepository.find({
      where: {
        created_by: userId,
      },
      order: {
        created_at: 'DESC',
      },
    });
  }

  async getMappingById(
    id: number,
    userId: number
  ): Promise<WebhookConfigs | null> {
    return await this.mappingRepository.findOne({
      where: {
        id,
        created_by: userId,
      },
    });
  }

  async deleteMapping(id: number, userId: number): Promise<boolean> {
    const mapping = await this.getMappingById(id, userId);
    if (!mapping) {
      return false;
    }

    await this.mappingRepository.remove(mapping);
    return true;
  }

  async updateMapping(
    id: number,
    userId: number,
    updates: {
      name?: string;
      description?: string;
      action?: Action;
      reactions?: Reaction[];
      is_active?: boolean;
    }
  ): Promise<WebhookConfigs | null> {
    const mapping = await this.getMappingById(id, userId);
    if (!mapping) {
      return null;
    }

    if (updates.name !== undefined) {
      mapping.name = await this.generateUniqueName(updates.name, userId, id);
    }

    if (updates.description !== undefined) {
      mapping.description = updates.description || null;
    }

    if (updates.action !== undefined) {
      mapping.action = updates.action;
    }

    if (updates.reactions !== undefined) {
      mapping.reactions = updates.reactions;
    }

    if (updates.is_active !== undefined) {
      mapping.is_active = updates.is_active;
    }

    return await this.mappingRepository.save(mapping);
  }
}

export const mappingService = new MappingService();
