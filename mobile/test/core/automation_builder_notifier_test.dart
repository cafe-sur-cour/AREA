import 'package:flutter_test/flutter_test.dart';
import 'package:area/core/notifiers/automation_builder_notifier.dart';
import 'package:area/models/action_models.dart';
import 'package:area/models/service_models.dart';
import 'package:area/models/reaction_with_delay_model.dart';
import 'package:area/models/reaction_models.dart';

void main() {
  late AutomationBuilderNotifier notifier;

  setUp(() {
    notifier = AutomationBuilderNotifier();
  });

  tearDown(() {
    notifier.dispose();
  });

  ActionModel createTestAction({String id = 'test_action', bool hasConfig = false}) {
    final fields = hasConfig
        ? [ConfigField(name: 'field1', type: 'text', label: 'Field 1', required: true)]
        : <ConfigField>[];
    final configSchema = ConfigSchema(
      name: 'config',
      description: 'Config schema',
      fields: fields,
    );

    return ActionModel(
      id: id,
      name: 'Test Action',
      description: 'A test action',
      configSchema: configSchema,
    );
  }

  ServiceModel createTestService({String id = 'test_service'}) {
    return ServiceModel(
      id: id,
      name: 'Test Service',
      description: 'A test service',
      color: '#FF0000',
    );
  }

  ReactionModel createTestReaction({String id = 'test_reaction', bool hasConfig = false}) {
    final fields = hasConfig
        ? [ConfigField(name: 'field1', type: 'text', label: 'Field 1', required: true)]
        : <ConfigField>[];
    final configSchema = ConfigSchema(
      name: 'config',
      description: 'Config schema',
      fields: fields,
    );

    return ReactionModel(
      id: id,
      name: 'Test Reaction',
      description: 'A test reaction',
      configSchema: configSchema,
    );
  }

  ReactionWithDelayModel createTestReactionWithDelay({
    String id = 'test_reaction',
    bool hasConfig = false,
    int delay = 0,
  }) {
    final reaction = createTestReaction(id: id, hasConfig: hasConfig);
    final service = createTestService();
    return ReactionWithDelayModel(reaction: reaction, service: service, delayInSeconds: delay);
  }

  group('AutomationBuilderNotifier', () {
    test('initial state should be empty', () {
      expect(notifier.selectedAction, isNull);
      expect(notifier.selectedService, isNull);
      expect(notifier.selectedReactionsWithDelay, isEmpty);
      expect(notifier.actionConfig, isEmpty);
      expect(notifier.hasAction, false);
      expect(notifier.hasReactions, false);
      expect(notifier.isComplete, false);
      expect(notifier.isConfigurationComplete, false);
    });

    test('setAction should set action and service', () {
      final action = createTestAction();
      final service = createTestService();

      notifier.setAction(action, service);

      expect(notifier.selectedAction, action);
      expect(notifier.selectedService, service);
      expect(notifier.hasAction, true);
    });

    test('setAction should initialize config with default values', () {
      final fields = [
        ConfigField(
          name: 'field1',
          type: 'text',
          label: 'Field 1',
          required: true,
          defaultValue: 'default_value',
        ),
      ];
      final configSchema = ConfigSchema(
        name: 'config',
        description: 'Config schema',
        fields: fields,
      );
      final action = ActionModel(
        id: 'test_action',
        name: 'Test Action',
        description: 'A test action',
        configSchema: configSchema,
      );
      final service = createTestService();

      notifier.setAction(action, service);

      expect(notifier.actionConfig['field1'], 'default_value');
    });

    test('clearAction should reset action and service', () {
      final action = createTestAction();
      final service = createTestService();

      notifier.setAction(action, service);
      notifier.clearAction();

      expect(notifier.selectedAction, isNull);
      expect(notifier.selectedService, isNull);
      expect(notifier.hasAction, false);
    });

    test('setActionConfigValue should update config', () {
      final action = createTestAction();
      final service = createTestService();

      notifier.setAction(action, service);
      notifier.setActionConfigValue('field1', 'value1');

      expect(notifier.actionConfig['field1'], 'value1');
    });

    test('getActionConfigValue should return config value', () {
      final action = createTestAction();
      final service = createTestService();

      notifier.setAction(action, service);
      notifier.setActionConfigValue('field1', 'value1');

      expect(notifier.getActionConfigValue('field1'), 'value1');
      expect(notifier.getActionConfigValue('nonexistent'), isNull);
    });

    test('addReaction should add reaction', () {
      final reaction = createTestReactionWithDelay();

      notifier.addReaction(reaction);

      expect(notifier.selectedReactionsWithDelay.length, 1);
      expect(notifier.selectedReactionsWithDelay[0], reaction);
      expect(notifier.hasReactions, true);
    });

    test('removeReaction should remove reaction at index', () {
      final reaction1 = createTestReactionWithDelay(id: 'reaction1');
      final reaction2 = createTestReactionWithDelay(id: 'reaction2');

      notifier.addReaction(reaction1);
      notifier.addReaction(reaction2);
      notifier.removeReaction(0);

      expect(notifier.selectedReactionsWithDelay.length, 1);
      expect(notifier.selectedReactionsWithDelay[0].reaction.id, 'reaction2');
    });

    test('clearReactions should remove all reactions', () {
      final reaction1 = createTestReactionWithDelay(id: 'reaction1');
      final reaction2 = createTestReactionWithDelay(id: 'reaction2');

      notifier.addReaction(reaction1);
      notifier.addReaction(reaction2);
      notifier.clearReactions();

      expect(notifier.selectedReactionsWithDelay, isEmpty);
      expect(notifier.hasReactions, false);
    });

    test('clearAll should reset everything', () {
      final action = createTestAction();
      final service = createTestService();
      final reaction = createTestReactionWithDelay();

      notifier.setAction(action, service);
      notifier.setActionConfigValue('field1', 'value1');
      notifier.addReaction(reaction);
      notifier.clearAll();

      expect(notifier.selectedAction, isNull);
      expect(notifier.selectedService, isNull);
      expect(notifier.selectedReactionsWithDelay, isEmpty);
      expect(notifier.actionConfig, isEmpty);
    });

    test('isComplete should be true when action and reactions exist', () {
      final action = createTestAction();
      final service = createTestService();
      final reaction = createTestReactionWithDelay();

      notifier.setAction(action, service);
      expect(notifier.isComplete, false);

      notifier.addReaction(reaction);
      expect(notifier.isComplete, true);
    });

    test('isConfigurationComplete should be true when all configs are valid', () {
      final action = createTestAction(hasConfig: true);
      final service = createTestService();
      final reaction = createTestReactionWithDelay(hasConfig: true);

      notifier.setAction(action, service);
      notifier.setActionConfigValue('field1', 'value1');
      notifier.addReaction(reaction);
      notifier.setReactionConfigValue(0, 'field1', 'value1');

      expect(notifier.isConfigurationComplete, true);
    });

    test('isConfigurationComplete should be false when action config is invalid', () {
      final action = createTestAction(hasConfig: true);
      final service = createTestService();
      final reaction = createTestReactionWithDelay();

      notifier.setAction(action, service);
      notifier.addReaction(reaction);

      expect(notifier.isConfigurationComplete, false);
    });

    test('isConfigurationComplete should be false when reaction config is invalid', () {
      final action = createTestAction();
      final service = createTestService();
      final reaction = createTestReactionWithDelay(hasConfig: true);

      notifier.setAction(action, service);
      notifier.addReaction(reaction);

      expect(notifier.isConfigurationComplete, false);
    });

    test('getState should return current state', () {
      final action = createTestAction();
      final service = createTestService();
      final reaction = createTestReactionWithDelay();

      notifier.setAction(action, service);
      notifier.addReaction(reaction);

      final state = notifier.getState();

      expect(state['hasAction'], true);
      expect(state['hasReactions'], true);
      expect(state['isComplete'], true);
      expect(state['actionName'], 'Test Action');
      expect(state['serviceName'], 'Test Service');
      expect(state['reactionsCount'], 1);
    });

    test('getApiData should return correct API format', () {
      final action = createTestAction();
      final service = createTestService();
      final reaction = createTestReactionWithDelay(delay: 60);

      notifier.setAction(action, service);
      notifier.addReaction(reaction);

      final apiData = notifier.getApiData('Test Automation', 'Description');

      expect(apiData['name'], 'Test Automation');
      expect(apiData['description'], 'Description');
      expect(apiData['action']['type'], 'test_action');
      expect(apiData['reactions'][0]['type'], 'test_reaction');
      expect(apiData['reactions'][0]['delay'], 60);
      expect(apiData['is_active'], true);
    });

    test('getApiData should throw when configuration is incomplete', () {
      expect(() => notifier.getApiData('Test', 'Description'), throwsA(isA<StateError>()));
    });

    test('getValidationErrors should return errors for missing action', () {
      final reaction = createTestReactionWithDelay();
      notifier.addReaction(reaction);

      final errors = notifier.getValidationErrors();

      expect(errors, contains('No action selected'));
    });

    test('getValidationErrors should return errors for missing reactions', () {
      final action = createTestAction();
      final service = createTestService();
      notifier.setAction(action, service);

      final errors = notifier.getValidationErrors();

      expect(errors, contains('No reactions added'));
    });

    test('getValidationErrors should return errors for invalid configs', () {
      final action = createTestAction(hasConfig: true);
      final service = createTestService();
      final reaction = createTestReactionWithDelay(hasConfig: true);

      notifier.setAction(action, service);
      notifier.addReaction(reaction);

      final errors = notifier.getValidationErrors();

      expect(errors, contains('Action configuration is incomplete'));
      expect(errors, contains('Reaction 1 configuration is incomplete'));
    });
  });
}
