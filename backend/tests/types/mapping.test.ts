import {
  Action,
  Reaction,
  ActionReactionMapping,
  MAPPING_VALIDATION_RULES,
  FieldType,
  SelectOption,
  ConfigField,
  ActionReactionSchema,
} from '../../src/types/mapping';

describe('Mapping Types', () => {
  describe('Action interface', () => {
    it('should create a valid Action object', () => {
      const action: Action = {
        type: 'github.new_issue',
        config: {
          repository: 'test/repo',
          title: 'Test Issue',
        },
      };

      expect(action.type).toBe('github.new_issue');
      expect(action.config).toEqual({
        repository: 'test/repo',
        title: 'Test Issue',
      });
    });

    it('should accept empty config object', () => {
      const action: Action = {
        type: 'timer.interval',
        config: {},
      };

      expect(action.type).toBe('timer.interval');
      expect(action.config).toEqual({});
    });

    it('should accept complex config with nested objects', () => {
      const action: Action = {
        type: 'slack.send_message',
        config: {
          channel: '#general',
          message: {
            text: 'Hello World',
            attachments: [
              {
                title: 'Attachment',
                url: 'https://example.com',
              },
            ],
          },
        },
      };

      const message = action.config.message as {
        text: string;
        attachments: unknown[];
      };
      expect(message.text).toBe('Hello World');
      expect(message.attachments).toHaveLength(1);
    });
  });

  describe('Reaction interface', () => {
    it('should create a valid Reaction object without delay', () => {
      const reaction: Reaction = {
        type: 'email.send',
        config: {
          to: 'user@example.com',
          subject: 'Test Email',
          body: 'Hello!',
        },
      };

      expect(reaction.type).toBe('email.send');
      expect(reaction.delay).toBeUndefined();
      expect((reaction.config as { to: string }).to).toBe('user@example.com');
    });

    it('should create a valid Reaction object with delay', () => {
      const reaction: Reaction = {
        type: 'slack.send_message',
        config: {
          channel: '#notifications',
          message: 'Delayed message',
        },
        delay: 5000, // 5 seconds
      };

      expect(reaction.type).toBe('slack.send_message');
      expect(reaction.delay).toBe(5000);
    });

    it('should accept zero delay', () => {
      const reaction: Reaction = {
        type: 'discord.send_message',
        config: { channel: 'general', content: 'Immediate' },
        delay: 0,
      };

      expect(reaction.delay).toBe(0);
    });
  });

  describe('ActionReactionMapping interface', () => {
    it('should create a complete ActionReactionMapping object', () => {
      const now = new Date();
      const mapping: ActionReactionMapping = {
        id: 1,
        name: 'GitHub to Slack Notification',
        action: {
          type: 'github.new_issue',
          config: { repository: 'owner/repo' },
        },
        reactions: [
          {
            type: 'slack.send_message',
            config: { channel: '#dev', message: 'New issue created!' },
            delay: 1000,
          },
        ],
        is_active: true,
        description: 'Notify Slack when new GitHub issues are created',
        created_by: 42,
        created_at: now,
        updated_at: now,
      };

      expect(mapping.id).toBe(1);
      expect(mapping.name).toBe('GitHub to Slack Notification');
      expect(mapping.action.type).toBe('github.new_issue');
      expect(mapping.reactions).toHaveLength(1);
      expect(mapping.is_active).toBe(true);
      expect(mapping.description).toBe(
        'Notify Slack when new GitHub issues are created'
      );
      expect(mapping.created_by).toBe(42);
      expect(mapping.created_at).toBe(now);
      expect(mapping.updated_at).toBe(now);
    });

    it('should create mapping without optional fields', () => {
      const mapping: ActionReactionMapping = {
        id: 2,
        name: 'Simple Timer',
        action: {
          type: 'timer.interval',
          config: { interval: 3600000 }, // 1 hour
        },
        reactions: [
          {
            type: 'email.send',
            config: {
              to: 'admin@example.com',
              subject: 'Timer',
              body: 'Hourly check',
            },
          },
        ],
        is_active: false,
        created_by: 1,
        created_at: new Date(),
      };

      expect(mapping.description).toBeUndefined();
      expect(mapping.updated_at).toBeUndefined();
      expect(mapping.reactions[0].delay).toBeUndefined();
    });

    it('should support multiple reactions', () => {
      const mapping: ActionReactionMapping = {
        id: 3,
        name: 'Multi-channel Notification',
        action: {
          type: 'spotify.new_track',
          config: { playlist_id: 'playlist123' },
        },
        reactions: [
          {
            type: 'slack.send_message',
            config: { channel: '#music', message: 'New track added!' },
          },
          {
            type: 'discord.send_message',
            config: { channel: 'music', content: '🎵 New track!' },
            delay: 2000,
          },
          {
            type: 'email.send',
            config: {
              to: 'fans@example.com',
              subject: 'New Music Alert',
              body: 'Check out the latest track!',
            },
            delay: 5000,
          },
        ],
        is_active: true,
        created_by: 10,
        created_at: new Date(),
      };

      expect(mapping.reactions).toHaveLength(3);
      expect(mapping.reactions[0].delay).toBeUndefined();
      expect(mapping.reactions[1].delay).toBe(2000);
      expect(mapping.reactions[2].delay).toBe(5000);
    });
  });

  describe('MAPPING_VALIDATION_RULES constant', () => {
    it('should have correct name validation rules', () => {
      expect(MAPPING_VALIDATION_RULES.name.maxLength).toBe(100);
      expect(MAPPING_VALIDATION_RULES.name.required).toBe(true);
      expect(MAPPING_VALIDATION_RULES.name.unique).toBe(true);
    });

    it('should have correct action validation rules', () => {
      expect(MAPPING_VALIDATION_RULES.action.type.required).toBe(true);
      expect(MAPPING_VALIDATION_RULES.action.type.pattern).toEqual(
        /^[a-zA-Z0-9_]+\.[a-zA-Z0-9_]+$/
      );
      expect(MAPPING_VALIDATION_RULES.action.config.type).toBe('object');
      expect(MAPPING_VALIDATION_RULES.action.config.required).toBe(true);
    });

    it('should have correct reactions validation rules', () => {
      expect(MAPPING_VALIDATION_RULES.reactions.type).toBe('array');
      expect(MAPPING_VALIDATION_RULES.reactions.minItems).toBe(1);
      expect(MAPPING_VALIDATION_RULES.reactions.items.type).toBe('object');
      expect(
        MAPPING_VALIDATION_RULES.reactions.items.properties.type.required
      ).toBe(true);
      expect(
        MAPPING_VALIDATION_RULES.reactions.items.properties.type.pattern
      ).toEqual(/^[a-zA-Z0-9_]+\.[a-zA-Z0-9_]+$/);
      expect(
        MAPPING_VALIDATION_RULES.reactions.items.properties.config.type
      ).toBe('object');
      expect(
        MAPPING_VALIDATION_RULES.reactions.items.properties.config.required
      ).toBe(true);
    });

    it('should validate action type patterns', () => {
      const validPatterns = [
        'github.new_issue',
        'slack.send_message',
        'timer.interval',
        'spotify.new_track',
        'discord.send_message',
        'email.send',
        'service_123.action_456',
      ];

      const invalidPatterns = [
        'github',
        'github.',
        '.new_issue',
        'github-new-issue',
        'github new_issue',
        'github.new_issue.extra',
        'github.new-issue',
        'github.new issue',
        'github@new_issue',
        '',
        'github.new_issue.',
      ];

      validPatterns.forEach(pattern => {
        expect(pattern).toMatch(MAPPING_VALIDATION_RULES.action.type.pattern);
      });

      invalidPatterns.forEach(pattern => {
        expect(pattern).not.toMatch(
          MAPPING_VALIDATION_RULES.action.type.pattern
        );
      });
    });

    it('should validate reaction type patterns', () => {
      const validPatterns = [
        'slack.send_message',
        'email.send',
        'discord.send_message',
        'service_123.reaction_456',
      ];

      const invalidPatterns = [
        'slack',
        'slack.',
        '.send_message',
        'slack.send-message',
        'slack send_message',
        'slack.send_message.extra',
        'slack.send message',
        'slack@send_message',
        '',
        'slack.send_message.',
      ];

      validPatterns.forEach(pattern => {
        expect(pattern).toMatch(
          MAPPING_VALIDATION_RULES.reactions.items.properties.type.pattern
        );
      });

      invalidPatterns.forEach(pattern => {
        expect(pattern).not.toMatch(
          MAPPING_VALIDATION_RULES.reactions.items.properties.type.pattern
        );
      });
    });
  });

  describe('FieldType type', () => {
    it('should accept all valid field types', () => {
      const validTypes: FieldType[] = [
        'text',
        'email',
        'textarea',
        'select',
        'checkbox',
        'number',
      ];

      validTypes.forEach(type => {
        const field: ConfigField = {
          name: 'test_field',
          type,
          label: 'Test Field',
          required: false,
        };
        expect(field.type).toBe(type);
      });
    });

    it('should create fields with all field types', () => {
      const fields: ConfigField[] = [
        {
          name: 'username',
          type: 'text',
          label: 'Username',
          required: true,
          placeholder: 'Enter username',
        },
        {
          name: 'email',
          type: 'email',
          label: 'Email Address',
          required: true,
          placeholder: 'user@example.com',
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Description',
          required: false,
          placeholder: 'Enter description...',
        },
        {
          name: 'priority',
          type: 'select',
          label: 'Priority',
          required: true,
          options: [
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
          ],
          default: 'medium',
        },
        {
          name: 'enabled',
          type: 'checkbox',
          label: 'Enabled',
          required: false,
          default: true,
        },
        {
          name: 'count',
          type: 'number',
          label: 'Count',
          required: false,
          default: 1,
        },
      ];

      expect(fields).toHaveLength(6);
      expect(fields[0].type).toBe('text');
      expect(fields[1].type).toBe('email');
      expect(fields[2].type).toBe('textarea');
      expect(fields[3].type).toBe('select');
      expect(fields[4].type).toBe('checkbox');
      expect(fields[5].type).toBe('number');
    });
  });

  describe('SelectOption interface', () => {
    it('should create valid select options', () => {
      const options: SelectOption[] = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
        { value: 'option_3', label: 'Option 3' },
      ];

      options.forEach(option => {
        expect(option).toHaveProperty('value');
        expect(option).toHaveProperty('label');
        expect(typeof option.value).toBe('string');
        expect(typeof option.label).toBe('string');
      });
    });
  });

  describe('ConfigField interface', () => {
    it('should create a minimal config field', () => {
      const field: ConfigField = {
        name: 'simple_field',
        type: 'text',
        label: 'Simple Field',
        required: false,
      };

      expect(field.name).toBe('simple_field');
      expect(field.type).toBe('text');
      expect(field.label).toBe('Simple Field');
      expect(field.required).toBe(false);
      expect(field.placeholder).toBeUndefined();
      expect(field.options).toBeUndefined();
      expect(field.default).toBeUndefined();
    });

    it('should create a complex config field with all optional properties', () => {
      const field: ConfigField = {
        name: 'complex_select',
        type: 'select',
        label: 'Complex Select',
        required: true,
        placeholder: 'Choose an option',
        options: [
          { value: 'val1', label: 'Value 1' },
          { value: 'val2', label: 'Value 2' },
        ],
        default: 'val1',
        dynamic: true,
        dynamicPlaceholder: 'Loading options...',
      };

      expect(field.name).toBe('complex_select');
      expect(field.type).toBe('select');
      expect(field.required).toBe(true);
      expect(field.placeholder).toBe('Choose an option');
      expect(field.options).toHaveLength(2);
      expect(field.default).toBe('val1');
      expect(field.dynamic).toBe(true);
      expect(field.dynamicPlaceholder).toBe('Loading options...');
    });

    it('should create dynamic fields', () => {
      const dynamicField: ConfigField = {
        name: 'dynamic_repo',
        type: 'select',
        label: 'Repository',
        required: true,
        dynamic: true,
        dynamicPlaceholder: 'Select a repository...',
      };

      expect(dynamicField.dynamic).toBe(true);
      expect(dynamicField.dynamicPlaceholder).toBe('Select a repository...');
      expect(dynamicField.options).toBeUndefined(); // Dynamic fields don't have static options
    });
  });

  describe('ActionReactionSchema interface', () => {
    it('should create a basic schema', () => {
      const schema: ActionReactionSchema = {
        name: 'basic_schema',
        fields: [
          {
            name: 'message',
            type: 'text',
            label: 'Message',
            required: true,
          },
        ],
      };

      expect(schema.name).toBe('basic_schema');
      expect(schema.description).toBeUndefined();
      expect(schema.fields).toHaveLength(1);
    });

    it('should create a complex schema with description', () => {
      const schema: ActionReactionSchema = {
        name: 'github_issue_schema',
        description: 'Schema for GitHub issue creation',
        fields: [
          {
            name: 'repository',
            type: 'text',
            label: 'Repository',
            required: true,
            placeholder: 'owner/repo',
          },
          {
            name: 'title',
            type: 'text',
            label: 'Issue Title',
            required: true,
          },
          {
            name: 'body',
            type: 'textarea',
            label: 'Issue Body',
            required: false,
            placeholder: 'Describe the issue...',
          },
          {
            name: 'labels',
            type: 'select',
            label: 'Labels',
            required: false,
            options: [
              { value: 'bug', label: 'Bug' },
              { value: 'feature', label: 'Feature' },
              { value: 'documentation', label: 'Documentation' },
            ],
            dynamic: true,
            dynamicPlaceholder: 'Loading labels...',
          },
          {
            name: 'assignee',
            type: 'text',
            label: 'Assignee',
            required: false,
            placeholder: 'GitHub username',
          },
        ],
      };

      expect(schema.name).toBe('github_issue_schema');
      expect(schema.description).toBe('Schema for GitHub issue creation');
      expect(schema.fields).toHaveLength(5);

      // Check different field types are represented
      const fieldTypes = schema.fields.map(f => f.type);
      expect(fieldTypes).toContain('text');
      expect(fieldTypes).toContain('textarea');
      expect(fieldTypes).toContain('select');

      // Check required vs optional fields
      const requiredFields = schema.fields.filter(f => f.required);
      const optionalFields = schema.fields.filter(f => !f.required);
      expect(requiredFields).toHaveLength(2); // repository, title
      expect(optionalFields).toHaveLength(3); // body, labels, assignee
    });

    it('should create schema with dynamic fields only', () => {
      const schema: ActionReactionSchema = {
        name: 'dynamic_schema',
        description: 'Schema with only dynamic fields',
        fields: [
          {
            name: 'user',
            type: 'select',
            label: 'User',
            required: true,
            dynamic: true,
            dynamicPlaceholder: 'Select user...',
          },
          {
            name: 'channel',
            type: 'select',
            label: 'Channel',
            required: true,
            dynamic: true,
            dynamicPlaceholder: 'Select channel...',
          },
        ],
      };

      expect(schema.fields).toHaveLength(2);
      schema.fields.forEach(field => {
        expect(field.dynamic).toBe(true);
        expect(field.dynamicPlaceholder).toBeDefined();
        expect(field.options).toBeUndefined();
      });
    });
  });

  describe('Integration tests', () => {
    it('should create a complete mapping with schema', () => {
      const schema: ActionReactionSchema = {
        name: 'complete_workflow',
        description: 'Complete workflow with action and reactions',
        fields: [
          {
            name: 'source_repo',
            type: 'text',
            label: 'Source Repository',
            required: true,
          },
          {
            name: 'notification_channel',
            type: 'text',
            label: 'Notification Channel',
            required: true,
          },
        ],
      };

      const mapping: ActionReactionMapping = {
        id: 100,
        name: 'GitHub PR to Slack',
        action: {
          type: 'github.pull_request',
          config: {
            repository: schema.fields[0], // Using schema field as config
            event: 'opened',
          },
        },
        reactions: [
          {
            type: 'slack.send_message',
            config: {
              channel: schema.fields[1], // Using schema field as config
              message: 'New PR opened!',
            },
            delay: 1000,
          },
        ],
        is_active: true,
        description: 'Notify Slack when PRs are opened',
        created_by: 5,
        created_at: new Date(),
        updated_at: new Date(),
      };

      expect(mapping.action.type).toMatch(
        MAPPING_VALIDATION_RULES.action.type.pattern
      );
      expect(mapping.reactions[0].type).toMatch(
        MAPPING_VALIDATION_RULES.reactions.items.properties.type.pattern
      );
      expect(mapping.reactions).toHaveLength(1);
      expect(mapping.is_active).toBe(true);
    });

    it('should validate mapping name length', () => {
      const validName = 'A'.repeat(100); // Exactly max length
      const invalidName = 'A'.repeat(101); // Over max length

      expect(validName.length).toBeLessThanOrEqual(
        MAPPING_VALIDATION_RULES.name.maxLength
      );
      expect(invalidName.length).toBeGreaterThan(
        MAPPING_VALIDATION_RULES.name.maxLength
      );
    });

    it('should ensure reactions array has minimum items', () => {
      const validMapping: ActionReactionMapping = {
        id: 1,
        name: 'Valid Mapping',
        action: { type: 'timer.interval', config: {} },
        reactions: [
          {
            type: 'email.send',
            config: { to: 'test@example.com', subject: 'Test', body: 'Test' },
          },
        ],
        is_active: true,
        created_by: 1,
        created_at: new Date(),
      };

      expect(validMapping.reactions.length).toBeGreaterThanOrEqual(
        MAPPING_VALIDATION_RULES.reactions.minItems
      );
    });
  });
});
