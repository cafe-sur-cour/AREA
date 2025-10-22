import {
  slackNewMessageSchema,
  slackNewDMSchema,
  slackChannelCreatedSchema,
  slackReactionAddedSchema,
} from '../../../src/services/services/slack/schemas';

describe('Slack Schemas', () => {
  describe('slackNewMessageSchema', () => {
    it('should have correct name', () => {
      expect(slackNewMessageSchema.name).toBe('New Message in Channel');
    });

    it('should have correct description', () => {
      expect(slackNewMessageSchema.description).toBe(
        'Triggers when a new message is posted in a specific channel'
      );
    });

    it('should have one field', () => {
      expect(slackNewMessageSchema.fields).toHaveLength(1);
    });

    it('should have channel field with correct properties', () => {
      const channelField = slackNewMessageSchema.fields[0];
      expect(channelField?.name).toBe('channel');
      expect(channelField?.type).toBe('text');
      expect(channelField?.label).toBe(
        'Channel Name or ID (optional, leave empty for all channels)'
      );
      expect(channelField?.required).toBe(false);
      expect(channelField?.placeholder).toBe('#general or C1234567890');
    });
  });

  describe('slackNewDMSchema', () => {
    it('should have correct name', () => {
      expect(slackNewDMSchema.name).toBe('New Direct Message');
    });

    it('should have correct description', () => {
      expect(slackNewDMSchema.description).toBe(
        'Triggers when the user receives a new private message'
      );
    });

    it('should have empty fields array', () => {
      expect(slackNewDMSchema.fields).toEqual([]);
      expect(slackNewDMSchema.fields).toHaveLength(0);
    });
  });

  describe('slackChannelCreatedSchema', () => {
    it('should have correct name', () => {
      expect(slackChannelCreatedSchema.name).toBe('Channel Created');
    });

    it('should have correct description', () => {
      expect(slackChannelCreatedSchema.description).toBe(
        'Triggers when a new channel is created in the workspace'
      );
    });

    it('should have one field', () => {
      expect(slackChannelCreatedSchema.fields).toHaveLength(1);
    });

    it('should have creator field with correct properties', () => {
      const creatorField = slackChannelCreatedSchema.fields[0];
      expect(creatorField?.name).toBe('creator');
      expect(creatorField?.type).toBe('text');
      expect(creatorField?.label).toBe(
        'Creator User ID (optional, leave empty for all channel creations)'
      );
      expect(creatorField?.required).toBe(false);
      expect(creatorField?.placeholder).toBe('U1234567890');
    });
  });

  describe('slackReactionAddedSchema', () => {
    it('should have correct name', () => {
      expect(slackReactionAddedSchema.name).toBe('Reaction Added to Message');
    });

    it('should have correct description', () => {
      expect(slackReactionAddedSchema.description).toBe(
        'Triggers when someone adds a reaction (emoji) to a message'
      );
    });

    it('should have two fields', () => {
      expect(slackReactionAddedSchema.fields).toHaveLength(2);
    });

    it('should have channel field with correct properties', () => {
      const channelField = slackReactionAddedSchema.fields[0];
      expect(channelField?.name).toBe('channel');
      expect(channelField?.type).toBe('text');
      expect(channelField?.label).toBe(
        'Channel Name or ID (optional, leave empty for all channels)'
      );
      expect(channelField?.required).toBe(false);
      expect(channelField?.placeholder).toBe('#general or C1234567890');
    });

    it('should have emoji field with correct properties', () => {
      const emojiField = slackReactionAddedSchema.fields[1];
      expect(emojiField?.name).toBe('emoji');
      expect(emojiField?.type).toBe('text');
      expect(emojiField?.label).toBe(
        'Emoji Name (optional, leave empty for any reaction)'
      );
      expect(emojiField?.required).toBe(false);
      expect(emojiField?.placeholder).toBe('thumbsup or :thumbsup:');
    });
  });
});
