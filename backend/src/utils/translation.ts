import type { TFunction } from 'i18next';
import type { Service, ActionInputSchema, ReactionOutputSchema } from '../types/service';
import type { ActionReactionSchema } from '../types/mapping';

export function translateService(service: Service, t: TFunction): Service {
  const translated = { ...service };

  translated.name = t(`services.${service.id}.name`, service.name);
  translated.description = t(`services.${service.id}.description`, service.description);

  if (translated.actions) {
    translated.actions = translated.actions.map((action) => ({
      ...action,
      name: t(`services.${service.id}.actions.${action.id}.name`, action.name),
      description: t(`services.${service.id}.actions.${action.id}.description`, action.description),
      configSchema: translateSchema(action.configSchema, service.id, action.id, t),
      inputSchema: translateInputSchema(action.inputSchema, service.id, t),
    }));
  }

  if (translated.reactions) {
    translated.reactions = translated.reactions.map((reaction) => ({
      ...reaction,
      name: t(`services.${service.id}.reactions.${reaction.id}.name`, reaction.name),
      description: t(`services.${service.id}.reactions.${reaction.id}.description`, reaction.description),
      configSchema: translateSchema(reaction.configSchema, service.id, reaction.id, t),
      outputSchema: translateOutputSchema(reaction.outputSchema, service.id, t),
    }));
  }

  return translated;
}

function translateSchema(schema: unknown, serviceId: string, actionId: string, t: TFunction): ActionReactionSchema {
  if (!schema) return schema as ActionReactionSchema;

  const translated = { ...(schema as Record<string, unknown>) };

  if (translated.fields) {
    translated.fields = (translated.fields as unknown[]).map((field: unknown) => ({
      ...(field as Record<string, unknown>),
      label: t(`services.${serviceId}.actions.${actionId}.schema.fields.${(field as Record<string, unknown>).name as string}.label`, (field as Record<string, unknown>).label as string),
      placeholder: t(`services.${serviceId}.actions.${actionId}.schema.fields.${(field as Record<string, unknown>).name as string}.placeholder`, (field as Record<string, unknown>).placeholder as string),
      options: (field as Record<string, unknown>).options ? ((field as Record<string, unknown>).options as unknown[]).map((option: unknown) => ({
        ...(option as Record<string, unknown>),
        label: t(`services.${serviceId}.actions.${actionId}.schema.fields.${(field as Record<string, unknown>).name as string}.options.${(option as Record<string, unknown>).value as string}`, (option as Record<string, unknown>).label as string),
      })) : (field as Record<string, unknown>).options,
    }));
  }

  return translated as unknown as ActionReactionSchema;
}

function translateInputSchema(schema: unknown, serviceId: string, t: TFunction): ActionInputSchema {
  if (!schema) return schema as ActionInputSchema;

  return translateJsonSchema(schema, `services.${serviceId}.properties`, t) as ActionInputSchema;
}

function translateOutputSchema(schema: unknown, serviceId: string, t: TFunction): ReactionOutputSchema {
  if (!schema) return schema as ReactionOutputSchema;

  return translateJsonSchema(schema, `services.${serviceId}.properties`, t) as ReactionOutputSchema;
}

function translateJsonSchema(schema: unknown, baseKey: string, t: TFunction): unknown {
  if (!schema || typeof schema !== 'object') return schema;

  const translated = { ...(schema as Record<string, unknown>) };

  if (translated.description) {
    translated.description = t(`${baseKey}.${translated.description as string}`, translated.description as string);
  }

  if (translated.properties) {
    translated.properties = Object.keys(translated.properties as Record<string, unknown>).reduce((acc: Record<string, unknown>, key: string) => {
      acc[key] = translateJsonSchema((translated.properties as Record<string, unknown>)[key], `${baseKey}.${key}`, t);
      return acc;
    }, {});
  }

  if (translated.items) {
    translated.items = translateJsonSchema(translated.items, `${baseKey}.items`, t);
  }

  return translated;
}
