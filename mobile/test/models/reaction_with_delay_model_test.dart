import 'package:flutter_test/flutter_test.dart';
import 'package:area/models/reaction_with_delay_model.dart';
import 'package:area/models/reaction_models.dart';
import 'package:area/models/service_models.dart';
import 'package:area/models/action_models.dart';

void main() {
  late ReactionModel mockReaction;
  late ServiceModel mockService;

  setUp(() {
    mockReaction = ReactionModel(
      id: 'reaction1',
      name: 'Test Reaction',
      description: 'A test reaction',
    );

    mockService = ServiceModel(
      id: 'service1',
      name: 'Test Service',
      description: 'A test service',
      color: '#FF0000',
    );
  });

  group('ReactionWithDelayModel', () {
    test('should create ReactionWithDelayModel with default delay', () {
      final model = ReactionWithDelayModel(reaction: mockReaction, service: mockService);

      expect(model.reaction, mockReaction);
      expect(model.service, mockService);
      expect(model.delayInSeconds, 0);
      expect(model.config, {});
    });

    test('should create ReactionWithDelayModel with custom delay and config', () {
      final config = {'key': 'value'};
      final model = ReactionWithDelayModel(
        reaction: mockReaction,
        service: mockService,
        delayInSeconds: 3600, // 1 hour
        config: config,
      );

      expect(model.reaction, mockReaction);
      expect(model.service, mockService);
      expect(model.delayInSeconds, 3600);
      expect(model.config, config);
    });

    test('days getter should return correct value', () {
      final model = ReactionWithDelayModel(
        reaction: mockReaction,
        service: mockService,
        delayInSeconds: 90061, // 1 day + 1 hour + 1 second
      );

      expect(model.days, 1);
    });

    test('hours getter should return correct value', () {
      final model = ReactionWithDelayModel(
        reaction: mockReaction,
        service: mockService,
        delayInSeconds: 3661, // 1 hour + 1 minute + 1 second
      );

      expect(model.hours, 1);
    });

    test('minutes getter should return correct value', () {
      final model = ReactionWithDelayModel(
        reaction: mockReaction,
        service: mockService,
        delayInSeconds: 61, // 1 minute + 1 second
      );

      expect(model.minutes, 1);
    });

    test('seconds getter should return correct value', () {
      final model = ReactionWithDelayModel(
        reaction: mockReaction,
        service: mockService,
        delayInSeconds: 61, // 1 minute + 1 second
      );

      expect(model.seconds, 1);
    });

    test('calculateDelayInSeconds should calculate correctly', () {
      final delay = ReactionWithDelayModel.calculateDelayInSeconds(
        days: 1,
        hours: 2,
        minutes: 3,
        seconds: 4,
      );

      expect(delay, 93784); // 1*86400 + 2*3600 + 3*60 + 4
    });

    test('calculateDelayInSeconds should handle zero values', () {
      final delay = ReactionWithDelayModel.calculateDelayInSeconds();

      expect(delay, 0);
    });

    test('formattedDelay should return "No delay" for zero delay', () {
      final model = ReactionWithDelayModel(
        reaction: mockReaction,
        service: mockService,
        delayInSeconds: 0,
      );

      expect(model.formattedDelay, 'No delay');
    });

    test('formattedDelay should format delay correctly', () {
      final model = ReactionWithDelayModel(
        reaction: mockReaction,
        service: mockService,
        delayInSeconds: 90061, // 1d 1h 1m 1s
      );

      expect(model.formattedDelay, '1d 1h 1m 1s');
    });

    test('shortFormattedDelay should return "Instant" for zero delay', () {
      final model = ReactionWithDelayModel(
        reaction: mockReaction,
        service: mockService,
        delayInSeconds: 0,
      );

      expect(model.shortFormattedDelay, 'Instant');
    });

    test('shortFormattedDelay should format short delay', () {
      final model = ReactionWithDelayModel(
        reaction: mockReaction,
        service: mockService,
        delayInSeconds: 3661, // 1h 1m 1s
      );

      expect(model.shortFormattedDelay, '1h 1m');
    });

    test('shortFormattedDelay should format very short delay', () {
      final model = ReactionWithDelayModel(
        reaction: mockReaction,
        service: mockService,
        delayInSeconds: 61, // 1m 1s
      );

      expect(model.shortFormattedDelay, '1m 1s');
    });

    test('shortFormattedDelay should format seconds only', () {
      final model = ReactionWithDelayModel(
        reaction: mockReaction,
        service: mockService,
        delayInSeconds: 45,
      );

      expect(model.shortFormattedDelay, '45s');
    });

    test('copyWith should create copy with updated reaction', () {
      final newReaction = ReactionModel(
        id: 'reaction2',
        name: 'New Reaction',
        description: 'A new reaction',
      );

      final original = ReactionWithDelayModel(
        reaction: mockReaction,
        service: mockService,
        delayInSeconds: 100,
        config: {'original': 'value'},
      );

      final copy = original.copyWith(reaction: newReaction);

      expect(copy.reaction, newReaction);
      expect(copy.service, mockService);
      expect(copy.delayInSeconds, 100);
      expect(copy.config, {'original': 'value'});
    });

    test('copyWith should create copy with updated service', () {
      final newService = ServiceModel(
        id: 'service2',
        name: 'New Service',
        description: 'A new service',
        color: '#00FF00',
      );

      final original = ReactionWithDelayModel(
        reaction: mockReaction,
        service: mockService,
        delayInSeconds: 100,
        config: {'original': 'value'},
      );

      final copy = original.copyWith(service: newService);

      expect(copy.reaction, mockReaction);
      expect(copy.service, newService);
      expect(copy.delayInSeconds, 100);
      expect(copy.config, {'original': 'value'});
    });

    test('copyWith should create copy with updated delay', () {
      final original = ReactionWithDelayModel(
        reaction: mockReaction,
        service: mockService,
        delayInSeconds: 100,
        config: {'original': 'value'},
      );

      final copy = original.copyWith(delayInSeconds: 200);

      expect(copy.reaction, mockReaction);
      expect(copy.service, mockService);
      expect(copy.delayInSeconds, 200);
      expect(copy.config, {'original': 'value'});
    });

    test('copyWith should create copy with updated config', () {
      final original = ReactionWithDelayModel(
        reaction: mockReaction,
        service: mockService,
        delayInSeconds: 100,
        config: {'original': 'value'},
      );

      final copy = original.copyWith(config: {'new': 'config'});

      expect(copy.reaction, mockReaction);
      expect(copy.service, mockService);
      expect(copy.delayInSeconds, 100);
      expect(copy.config, {'new': 'config'});
    });

    test('copyWith should keep original values when not specified', () {
      final original = ReactionWithDelayModel(
        reaction: mockReaction,
        service: mockService,
        delayInSeconds: 100,
        config: {'original': 'value'},
      );

      final copy = original.copyWith();

      expect(copy.reaction, mockReaction);
      expect(copy.service, mockService);
      expect(copy.delayInSeconds, 100);
      expect(copy.config, {'original': 'value'});
    });

    test('toJson should convert to JSON', () {
      final model = ReactionWithDelayModel(
        reaction: mockReaction,
        service: mockService,
        delayInSeconds: 100,
        config: {'key': 'value'},
      );

      final json = model.toJson();

      expect(json['reaction'], isA<Map<String, dynamic>>());
      expect(json['service'], isA<Map<String, dynamic>>());
      expect(json['delayInSeconds'], 100);
      expect(json['config'], {'key': 'value'});
    });

    test('fromJson should create from JSON', () {
      final json = {
        'reaction': {
          'id': 'reaction1',
          'name': 'Test Reaction',
          'description': 'A test reaction',
        },
        'service': {
          'id': 'service1',
          'name': 'Test Service',
          'description': 'A test service',
          'color': '#FF0000',
        },
        'delayInSeconds': 100,
        'config': {'key': 'value'},
      };

      final model = ReactionWithDelayModel.fromJson(json);

      expect(model.reaction.id, 'reaction1');
      expect(model.service.id, 'service1');
      expect(model.delayInSeconds, 100);
      expect(model.config, {'key': 'value'});
    });

    test('fromJson should handle missing delayInSeconds', () {
      final json = {
        'reaction': {
          'id': 'reaction1',
          'name': 'Test Reaction',
          'description': 'A test reaction',
        },
        'service': {
          'id': 'service1',
          'name': 'Test Service',
          'description': 'A test service',
          'color': '#FF0000',
        },
        'config': {'key': 'value'},
      };

      final model = ReactionWithDelayModel.fromJson(json);

      expect(model.delayInSeconds, 0);
    });

    test('fromJson should handle missing config', () {
      final json = {
        'reaction': {
          'id': 'reaction1',
          'name': 'Test Reaction',
          'description': 'A test reaction',
        },
        'service': {
          'id': 'service1',
          'name': 'Test Service',
          'description': 'A test service',
          'color': '#FF0000',
        },
        'delayInSeconds': 100,
      };

      final model = ReactionWithDelayModel.fromJson(json);

      expect(model.config, {});
    });

    test('hasConfig should return true when config is not empty', () {
      final model = ReactionWithDelayModel(
        reaction: mockReaction,
        service: mockService,
        config: {'key': 'value'},
      );

      expect(model.hasConfig, true);
    });

    test('hasConfig should return false when config is empty', () {
      final model = ReactionWithDelayModel(
        reaction: mockReaction,
        service: mockService,
        config: {},
      );

      expect(model.hasConfig, false);
    });

    test('isConfigValid should delegate to reaction validateConfig', () {
      final configSchema = ConfigSchema(
        name: 'config',
        description: 'Config schema',
        fields: [ConfigField(name: 'field1', type: 'text', label: 'Field 1', required: true)],
      );
      final reactionWithSchema = ReactionModel(
        id: 'reaction1',
        name: 'Test Reaction',
        description: 'A test reaction',
        configSchema: configSchema,
      );

      final model = ReactionWithDelayModel(
        reaction: reactionWithSchema,
        service: mockService,
        config: {'field1': 'value'},
      );

      expect(model.isConfigValid, true);
    });

    test('getConfigValue should return config value', () {
      final model = ReactionWithDelayModel(
        reaction: mockReaction,
        service: mockService,
        config: {'key': 'value'},
      );

      expect(model.getConfigValue('key'), 'value');
    });

    test('setConfigValue should return new model with updated config', () {
      final original = ReactionWithDelayModel(
        reaction: mockReaction,
        service: mockService,
        config: {'key': 'original'},
      );

      final updated = original.setConfigValue('key', 'updated');

      expect(original.config['key'], 'original');
      expect(updated.config['key'], 'updated');
      expect(updated.reaction, original.reaction);
      expect(updated.service, original.service);
      expect(updated.delayInSeconds, original.delayInSeconds);
    });
  });
}
