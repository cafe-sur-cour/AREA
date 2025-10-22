import { twitchActions } from '../../../src/services/services/twitch/actions';

describe('Twitch Actions', () => {
  it('should export an array of action definitions', () => {
    expect(Array.isArray(twitchActions)).toBe(true);
    expect(twitchActions).toHaveLength(2);
  });

  describe('twitch.new_follower action', () => {
    const newFollowerAction = twitchActions.find(
      a => a.id === 'twitch.new_follower'
    );

    it('should exist and have correct id', () => {
      expect(newFollowerAction).toBeDefined();
      expect(newFollowerAction!.id).toBe('twitch.new_follower');
    });

    it('should have correct name and description', () => {
      expect(newFollowerAction!.name).toBe('Twitch New Follower');
      expect(newFollowerAction!.description).toBe(
        'Triggers when someone follows your Twitch channel'
      );
    });

    it('should have correct metadata', () => {
      expect(newFollowerAction!.metadata.category).toBe('Twitch');
      expect(newFollowerAction!.metadata.tags).toContain('twitch');
      expect(newFollowerAction!.metadata.tags).toContain('follower');
      expect(newFollowerAction!.metadata.tags).toContain('channel');
      expect(newFollowerAction!.metadata.requiresAuth).toBe(true);
      expect(newFollowerAction!.metadata.webhookPattern).toBe('channel.follow');
      expect(newFollowerAction!.metadata.sharedEvents).toBe(false);
    });

    it('should have correct input schema properties', () => {
      const inputSchema = newFollowerAction!.inputSchema;
      expect(inputSchema.type).toBe('object');
      expect(inputSchema.properties.user_id).toBeDefined();
      expect(inputSchema.properties.user_login).toBeDefined();
      expect(inputSchema.properties.user_name).toBeDefined();
      expect(inputSchema.properties.broadcaster_user_id).toBeDefined();
      expect(inputSchema.properties.broadcaster_user_login).toBeDefined();
      expect(inputSchema.properties.broadcaster_user_name).toBeDefined();
      expect(inputSchema.properties.followed_at).toBeDefined();
    });

    it('should have required fields in input schema', () => {
      const inputSchema = newFollowerAction!.inputSchema;
      expect(inputSchema.required).toContain('user_id');
      expect(inputSchema.required).toContain('user_login');
      expect(inputSchema.required).toContain('broadcaster_user_id');
      expect(inputSchema.required).toContain('followed_at');
    });

    it('should have correct property types', () => {
      const props = newFollowerAction!.inputSchema.properties;
      expect(props.user_id.type).toBe('string');
      expect(props.user_login.type).toBe('string');
      expect(props.followed_at.type).toBe('string');
      expect(props.followed_at.description).toContain('RFC3339');
    });
  });

  describe('twitch.new_subscription action', () => {
    const newSubscriptionAction = twitchActions.find(
      a => a.id === 'twitch.new_subscription'
    );

    it('should exist and have correct id', () => {
      expect(newSubscriptionAction).toBeDefined();
      expect(newSubscriptionAction!.id).toBe('twitch.new_subscription');
    });

    it('should have correct name and description', () => {
      expect(newSubscriptionAction!.name).toBe('Twitch New Subscription');
      expect(newSubscriptionAction!.description).toContain(
        'subscribes or renews a subscription'
      );
    });

    it('should have correct metadata', () => {
      expect(newSubscriptionAction!.metadata.category).toBe('Twitch');
      expect(newSubscriptionAction!.metadata.tags).toContain('twitch');
      expect(newSubscriptionAction!.metadata.tags).toContain('subscription');
      expect(newSubscriptionAction!.metadata.tags).toContain('channel');
      expect(newSubscriptionAction!.metadata.requiresAuth).toBe(true);
      expect(newSubscriptionAction!.metadata.webhookPattern).toBe(
        'channel.subscribe'
      );
      expect(newSubscriptionAction!.metadata.sharedEvents).toBe(false);
    });

    it('should have correct input schema properties', () => {
      const inputSchema = newSubscriptionAction!.inputSchema;
      expect(inputSchema.type).toBe('object');
      expect(inputSchema.properties.user_id).toBeDefined();
      expect(inputSchema.properties.user_login).toBeDefined();
      expect(inputSchema.properties.user_name).toBeDefined();
      expect(inputSchema.properties.broadcaster_user_id).toBeDefined();
      expect(inputSchema.properties.broadcaster_user_login).toBeDefined();
      expect(inputSchema.properties.broadcaster_user_name).toBeDefined();
      expect(inputSchema.properties.tier).toBeDefined();
      expect(inputSchema.properties.is_gift).toBeDefined();
      expect(inputSchema.properties.message).toBeDefined();
    });

    it('should have required fields in input schema', () => {
      const inputSchema = newSubscriptionAction!.inputSchema;
      expect(inputSchema.required).toContain('user_id');
      expect(inputSchema.required).toContain('user_login');
      expect(inputSchema.required).toContain('broadcaster_user_id');
      expect(inputSchema.required).toContain('tier');
    });

    it('should have correct property types', () => {
      const props = newSubscriptionAction!.inputSchema.properties;
      expect(props.user_id.type).toBe('string');
      expect(props.tier.type).toBe('string');
      expect(props.tier.description).toContain('1000, 2000, or 3000');
      expect(props.is_gift.type).toBe('boolean');
      expect(props.message.type).toBe('object');
    });

    it('should have message object with correct structure', () => {
      const messageProps =
        newSubscriptionAction!.inputSchema.properties.message.properties!;
      expect(messageProps.text).toBeDefined();
      expect(messageProps.text.type).toBe('string');
      expect(messageProps.emotes).toBeDefined();
      expect(messageProps.emotes.type).toBe('array');
    });

    it('should have emotes array items structure', () => {
      const emoteItems =
        newSubscriptionAction!.inputSchema.properties.message.properties!.emotes
          .items!;
      expect(emoteItems.type).toBe('object');
      expect(emoteItems.properties!.begin).toBeDefined();
      expect(emoteItems.properties!.end).toBeDefined();
      expect(emoteItems.properties!.id).toBeDefined();
    });
  });
});
