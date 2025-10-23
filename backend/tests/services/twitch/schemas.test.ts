import {
  twitchNewFollowerSchema,
  twitchNewSubscriptionSchema,
  twitchUpdateChannelSchema,
  twitchBanUserSchema,
  twitchUnbanUserSchema,
} from '../../../src/services/services/twitch/schemas';

describe('Twitch Schemas', () => {
  describe('twitchNewFollowerSchema', () => {
    it('should have correct structure', () => {
      expect(twitchNewFollowerSchema).toBeDefined();
      expect(twitchNewFollowerSchema.name).toBe('Twitch New Follower');
      expect(twitchNewFollowerSchema.description).toBe(
        'Triggers when someone follows your Twitch channel'
      );
      expect(twitchNewFollowerSchema.fields).toEqual([]);
    });
  });

  describe('twitchNewSubscriptionSchema', () => {
    it('should have correct structure', () => {
      expect(twitchNewSubscriptionSchema).toBeDefined();
      expect(twitchNewSubscriptionSchema.name).toBe('Twitch New Subscription');
      expect(twitchNewSubscriptionSchema.description).toBe(
        'Triggers when someone subscribes or renews a subscription to your channel'
      );
      expect(twitchNewSubscriptionSchema.fields).toEqual([]);
    });
  });

  describe('twitchUpdateChannelSchema', () => {
    it('should have correct structure', () => {
      expect(twitchUpdateChannelSchema).toBeDefined();
      expect(twitchUpdateChannelSchema.name).toBe('Update Channel Description');
      expect(twitchUpdateChannelSchema.description).toBe(
        "Updates the description of the authenticated user's own Twitch channel"
      );
      expect(twitchUpdateChannelSchema.fields).toHaveLength(1);
    });

    it('should have description field with correct properties', () => {
      const descriptionField = twitchUpdateChannelSchema.fields[0];
      expect(descriptionField.name).toBe('description');
      expect(descriptionField.type).toBe('textarea');
      expect(descriptionField.label).toBe('New Channel Description');
      expect(descriptionField.required).toBe(true);
      expect(descriptionField.placeholder).toContain('Welcome to my channel');
      expect(descriptionField.dynamic).toBe(true);
      expect(descriptionField.dynamicPlaceholder).toContain('{{action.payload');
    });
  });

  describe('twitchBanUserSchema', () => {
    it('should have correct structure', () => {
      expect(twitchBanUserSchema).toBeDefined();
      expect(twitchBanUserSchema.name).toBe('Ban User');
      expect(twitchBanUserSchema.description).toBe(
        "Bans or times out a user from the authenticated user's Twitch channel chat"
      );
      expect(twitchBanUserSchema.fields).toHaveLength(3);
    });

    it('should have username field with correct properties', () => {
      const usernameField = twitchBanUserSchema.fields[0];
      expect(usernameField.name).toBe('username');
      expect(usernameField.type).toBe('text');
      expect(usernameField.label).toBe('Username to Ban/Timeout');
      expect(usernameField.required).toBe(true);
      expect(usernameField.dynamic).toBe(true);
    });

    it('should have duration field with correct properties', () => {
      const durationField = twitchBanUserSchema.fields[1];
      expect(durationField.name).toBe('duration');
      expect(durationField.type).toBe('number');
      expect(durationField.label).toContain('Timeout Duration');
      expect(durationField.required).toBe(false);
    });

    it('should have reason field with correct properties', () => {
      const reasonField = twitchBanUserSchema.fields[2];
      expect(reasonField.name).toBe('reason');
      expect(reasonField.type).toBe('text');
      expect(reasonField.label).toBe('Reason (optional)');
      expect(reasonField.required).toBe(false);
    });
  });

  describe('twitchUnbanUserSchema', () => {
    it('should have correct structure', () => {
      expect(twitchUnbanUserSchema).toBeDefined();
      expect(twitchUnbanUserSchema.name).toBe('Unban User');
      expect(twitchUnbanUserSchema.description).toBe(
        "Unbans a user from the authenticated user's Twitch channel chat"
      );
      expect(twitchUnbanUserSchema.fields).toHaveLength(1);
    });

    it('should have username field with correct properties', () => {
      const usernameField = twitchUnbanUserSchema.fields[0];
      expect(usernameField.name).toBe('username');
      expect(usernameField.type).toBe('text');
      expect(usernameField.label).toBe('Username to Unban');
      expect(usernameField.required).toBe(true);
      expect(usernameField.dynamic).toBe(true);
    });
  });
});
