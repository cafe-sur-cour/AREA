import { slackReactions } from '../../../src/services/services/slack/reactions';

describe('Slack Reactions', () => {
  describe('send_message reaction', () => {
    const sendMessage = slackReactions.find(r => r.id === 'slack.send_message');

    it('should exist', () => {
      expect(sendMessage).toBeDefined();
    });

    it('should have correct id', () => {
      expect(sendMessage?.id).toBe('slack.send_message');
    });

    it('should have correct name', () => {
      expect(sendMessage?.name).toBe('Send Message to Channel');
    });

    it('should have correct description', () => {
      expect(sendMessage?.description).toBe(
        'Send a custom message to a specific Slack channel'
      );
    });

    it('should have configSchema with correct name', () => {
      expect(sendMessage?.configSchema.name).toBe('Send Message Configuration');
    });

    it('should have configSchema with 2 fields', () => {
      expect(sendMessage?.configSchema.fields).toHaveLength(2);
    });

    it('should have channel field with dynamic placeholder', () => {
      const channelField = sendMessage?.configSchema.fields[0];
      expect(channelField?.name).toBe('channel');
      expect(channelField?.type).toBe('text');
      expect(channelField?.required).toBe(true);
      expect(channelField?.dynamic).toBe(true);
      expect(channelField?.dynamicPlaceholder).toBe(
        '{{action.payload.channel}}'
      );
    });

    it('should have message field with dynamic placeholder', () => {
      const messageField = sendMessage?.configSchema.fields[1];
      expect(messageField?.name).toBe('message');
      expect(messageField?.type).toBe('textarea');
      expect(messageField?.required).toBe(true);
      expect(messageField?.dynamic).toBe(true);
    });

    it('should have valid outputSchema', () => {
      expect(sendMessage?.outputSchema.type).toBe('object');
      expect(sendMessage?.outputSchema.properties).toBeDefined();
      expect(sendMessage?.outputSchema.required).toContain('success');
    });

    it('should have metadata with correct category', () => {
      expect(sendMessage?.metadata.category).toBe('Communication');
      expect(sendMessage?.metadata.requiresAuth).toBe(true);
    });
  });

  describe('add_reaction reaction', () => {
    const addReaction = slackReactions.find(r => r.id === 'slack.add_reaction');

    it('should exist', () => {
      expect(addReaction).toBeDefined();
    });

    it('should have correct id', () => {
      expect(addReaction?.id).toBe('slack.add_reaction');
    });

    it('should have correct name', () => {
      expect(addReaction?.name).toBe('Add Reaction to Last Message');
    });

    it('should have configSchema with 2 fields', () => {
      expect(addReaction?.configSchema.fields).toHaveLength(2);
    });

    it('should have channel and emoji fields', () => {
      const fields = addReaction?.configSchema.fields;
      expect(fields?.[0]?.name).toBe('channel');
      expect(fields?.[1]?.name).toBe('emoji');
    });

    it('should have metadata with Interaction category', () => {
      expect(addReaction?.metadata.category).toBe('Interaction');
      expect(addReaction?.metadata.icon).toBe('👍');
    });
  });

  describe('send_dm reaction', () => {
    const sendDM = slackReactions.find(r => r.id === 'slack.send_dm');

    it('should exist', () => {
      expect(sendDM).toBeDefined();
    });

    it('should have correct id', () => {
      expect(sendDM?.id).toBe('slack.send_dm');
    });

    it('should have correct name', () => {
      expect(sendDM?.name).toBe('Send Direct Message');
    });

    it('should have configSchema with 2 fields', () => {
      expect(sendDM?.configSchema.fields).toHaveLength(2);
    });

    it('should have userId and message fields', () => {
      const fields = sendDM?.configSchema.fields;
      expect(fields?.[0]?.name).toBe('userId');
      expect(fields?.[1]?.name).toBe('message');
    });

    it('should have metadata with Communication category', () => {
      expect(sendDM?.metadata.category).toBe('Communication');
      expect(sendDM?.metadata.icon).toBe('💌');
    });
  });

  describe('pin_message reaction', () => {
    const pinMessage = slackReactions.find(r => r.id === 'slack.pin_message');

    it('should exist', () => {
      expect(pinMessage).toBeDefined();
    });

    it('should have correct id', () => {
      expect(pinMessage?.id).toBe('slack.pin_message');
    });

    it('should have correct name', () => {
      expect(pinMessage?.name).toBe('Pin Last Message');
    });

    it('should have configSchema with 1 field', () => {
      expect(pinMessage?.configSchema.fields).toHaveLength(1);
    });

    it('should have channel field', () => {
      const channelField = pinMessage?.configSchema.fields[0];
      expect(channelField?.name).toBe('channel');
      expect(channelField?.required).toBe(true);
    });

    it('should have metadata with Organization category', () => {
      expect(pinMessage?.metadata.category).toBe('Organization');
      expect(pinMessage?.metadata.icon).toBe('📌');
    });
  });

  describe('All reactions', () => {
    it('should have exactly 4 reactions', () => {
      expect(slackReactions).toHaveLength(4);
    });

    it('should all require authentication', () => {
      slackReactions.forEach(reaction => {
        expect(reaction.metadata.requiresAuth).toBe(true);
      });
    });

    it('should all have valid outputSchemas', () => {
      slackReactions.forEach(reaction => {
        expect(reaction.outputSchema).toBeDefined();
        expect(reaction.outputSchema.type).toBe('object');
        expect(reaction.outputSchema.properties).toBeDefined();
      });
    });
  });
});
