import 'package:flutter_test/flutter_test.dart';
import 'package:area/models/automation_models.dart';

void main() {
  group('AutomationAction', () {
    test('should create AutomationAction', () {
      final action = AutomationAction(type: 'test_action', config: {'key': 'value'});

      expect(action.type, 'test_action');
      expect(action.config, {'key': 'value'});
    });

    test('fromJson should create AutomationAction from JSON', () {
      final json = {
        'type': 'test_action',
        'config': {'key': 'value'},
      };

      final action = AutomationAction.fromJson(json);

      expect(action.type, 'test_action');
      expect(action.config, {'key': 'value'});
    });

    test('fromJson should handle missing config', () {
      final json = {'type': 'test_action'};

      final action = AutomationAction.fromJson(json);

      expect(action.type, 'test_action');
      expect(action.config, {});
    });

    test('toJson should convert AutomationAction to JSON', () {
      final action = AutomationAction(type: 'test_action', config: {'key': 'value'});

      final json = action.toJson();

      expect(json['type'], 'test_action');
      expect(json['config'], {'key': 'value'});
    });
  });

  group('AutomationReaction', () {
    test('should create AutomationReaction', () {
      final reaction = AutomationReaction(
        type: 'test_reaction',
        config: {'key': 'value'},
        delay: 30,
      );

      expect(reaction.type, 'test_reaction');
      expect(reaction.config, {'key': 'value'});
      expect(reaction.delay, 30);
    });

    test('fromJson should create AutomationReaction from JSON', () {
      final json = {
        'type': 'test_reaction',
        'config': {'key': 'value'},
        'delay': 30,
      };

      final reaction = AutomationReaction.fromJson(json);

      expect(reaction.type, 'test_reaction');
      expect(reaction.config, {'key': 'value'});
      expect(reaction.delay, 30);
    });

    test('fromJson should handle missing config and delay', () {
      final json = {'type': 'test_reaction'};

      final reaction = AutomationReaction.fromJson(json);

      expect(reaction.type, 'test_reaction');
      expect(reaction.config, {});
      expect(reaction.delay, 0);
    });

    test('toJson should convert AutomationReaction to JSON', () {
      final reaction = AutomationReaction(
        type: 'test_reaction',
        config: {'key': 'value'},
        delay: 30,
      );

      final json = reaction.toJson();

      expect(json['type'], 'test_reaction');
      expect(json['config'], {'key': 'value'});
      expect(json['delay'], 30);
    });
  });

  group('AutomationModel', () {
    test('should create AutomationModel', () {
      final action = AutomationAction(type: 'test_action', config: {});
      final reactions = [
        AutomationReaction(type: 'reaction1', config: {}, delay: 0),
        AutomationReaction(type: 'reaction2', config: {}, delay: 60),
      ];

      final automation = AutomationModel(
        id: 1,
        name: 'Test Automation',
        description: 'A test automation',
        action: action,
        reactions: reactions,
        isActive: true,
        createdBy: 123,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z',
      );

      expect(automation.id, 1);
      expect(automation.name, 'Test Automation');
      expect(automation.description, 'A test automation');
      expect(automation.action, action);
      expect(automation.reactions, reactions);
      expect(automation.isActive, true);
      expect(automation.createdBy, 123);
      expect(automation.createdAt, '2023-01-01T00:00:00Z');
      expect(automation.updatedAt, '2023-01-02T00:00:00Z');
    });

    test('fromJson should create AutomationModel from JSON', () {
      final Map<String, dynamic> json = {
        'id': 1,
        'name': 'Test Automation',
        'description': 'A test automation',
        'action': <String, dynamic>{'type': 'test_action', 'config': <String, dynamic>{}},
        'reactions': [
          <String, dynamic>{'type': 'reaction1', 'config': <String, dynamic>{}, 'delay': 0},
          <String, dynamic>{'type': 'reaction2', 'config': <String, dynamic>{}, 'delay': 60},
        ],
        'is_active': true,
        'created_by': 123,
        'created_at': '2023-01-01T00:00:00Z',
        'updated_at': '2023-01-02T00:00:00Z',
      };

      final automation = AutomationModel.fromJson(json);

      expect(automation.id, 1);
      expect(automation.name, 'Test Automation');
      expect(automation.description, 'A test automation');
      expect(automation.action.type, 'test_action');
      expect(automation.reactions.length, 2);
      expect(automation.isActive, true);
      expect(automation.createdBy, 123);
      expect(automation.createdAt, '2023-01-01T00:00:00Z');
      expect(automation.updatedAt, '2023-01-02T00:00:00Z');
    });

    test('fromJson should handle missing optional fields', () {
      final Map<String, dynamic> json = {
        'id': 1,
        'name': 'Test Automation',
        'description': 'A test automation',
        'action': <String, dynamic>{'type': 'test_action', 'config': <String, dynamic>{}},
        'reactions': [],
      };

      final automation = AutomationModel.fromJson(json);

      expect(automation.id, 1);
      expect(automation.name, 'Test Automation');
      expect(automation.description, 'A test automation');
      expect(automation.action.type, 'test_action');
      expect(automation.reactions, isEmpty);
      expect(automation.isActive, true);
      expect(automation.createdBy, 0);
      expect(automation.createdAt, '');
      expect(automation.updatedAt, '');
    });

    test('toJson should convert AutomationModel to JSON', () {
      final action = AutomationAction(type: 'test_action', config: {});
      final reactions = [AutomationReaction(type: 'reaction1', config: {}, delay: 0)];

      final automation = AutomationModel(
        id: 1,
        name: 'Test Automation',
        description: 'A test automation',
        action: action,
        reactions: reactions,
        isActive: true,
        createdBy: 123,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z',
      );

      final json = automation.toJson();

      expect(json['id'], 1);
      expect(json['name'], 'Test Automation');
      expect(json['description'], 'A test automation');
      expect(json['action'], isA<Map<String, dynamic>>());
      expect(json['reactions'], isA<List>());
      expect(json['is_active'], true);
      expect(json['created_by'], 123);
      expect(json['created_at'], '2023-01-01T00:00:00Z');
      expect(json['updated_at'], '2023-01-02T00:00:00Z');
    });

    test('copyWith should create a copy with updated fields', () {
      final original = AutomationModel(
        id: 1,
        name: 'Original',
        description: 'Original description',
        action: AutomationAction(type: 'original_action', config: {}),
        reactions: [],
        isActive: true,
        createdBy: 123,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      );

      final copy = original.copyWith(
        name: 'Updated',
        description: 'Updated description',
        isActive: false,
      );

      expect(copy.id, 1);
      expect(copy.name, 'Updated');
      expect(copy.description, 'Updated description');
      expect(copy.action.type, 'original_action');
      expect(copy.isActive, false);
      expect(copy.createdBy, 123);
    });

    test('copyWith should keep original values when not specified', () {
      final original = AutomationModel(
        id: 1,
        name: 'Original',
        description: 'Original description',
        action: AutomationAction(type: 'original_action', config: {}),
        reactions: [],
        isActive: true,
        createdBy: 123,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      );

      final copy = original.copyWith();

      expect(copy.id, original.id);
      expect(copy.name, original.name);
      expect(copy.description, original.description);
      expect(copy.action, original.action);
      expect(copy.reactions, original.reactions);
      expect(copy.isActive, original.isActive);
      expect(copy.createdBy, original.createdBy);
      expect(copy.createdAt, original.createdAt);
      expect(copy.updatedAt, original.updatedAt);
    });
  });
}
