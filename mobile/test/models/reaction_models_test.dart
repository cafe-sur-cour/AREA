import 'package:flutter_test/flutter_test.dart';
import 'package:area/models/reaction_models.dart';
import 'package:area/models/action_models.dart';

void main() {
  group('ConfigurationManager', () {
    late ConfigSchema schema;
    late ConfigurationManager manager;

    setUp(() {
      schema = ConfigSchema(
        name: 'test_schema',
        description: 'Test schema',
        fields: [
          ConfigField(
            name: 'field1',
            type: 'text',
            label: 'Field 1',
            required: true,
            defaultValue: 'default1',
          ),
          ConfigField(
            name: 'field2',
            type: 'number',
            label: 'Field 2',
            required: false,
            defaultValue: 42,
          ),
          ConfigField(name: 'field3', type: 'checkbox', label: 'Field 3', required: true),
        ],
      );
      manager = ConfigurationManager(schema);
    });

    test('should initialize with default values', () {
      expect(manager.getValue('field1'), 'default1');
      expect(manager.getValue('field2'), 42);
      expect(manager.getValue('field3'), null);
    });

    test('values should return unmodifiable map', () {
      final values = manager.values;
      expect(values['field1'], 'default1');

      expect(() => values['field1'] = 'modified', throwsUnsupportedError);
    });

    test('setValue should set text field value', () {
      manager.setValue('field1', 'new value');
      expect(manager.getValue('field1'), 'new value');
    });

    test('setValue should convert string to number for numeric field', () {
      manager.setValue('field2', '123');
      expect(manager.getValue('field2'), 123);
    });

    test('setValue should throw for invalid numeric value', () {
      expect(() => manager.setValue('field2', 'invalid'), throwsArgumentError);
    });

    test('setValue should convert string to boolean for checkbox field', () {
      manager.setValue('field3', 'true');
      expect(manager.getValue('field3'), true);

      manager.setValue('field3', 'false');
      expect(manager.getValue('field3'), false);
    });

    test('setValue should throw for non-existent field', () {
      expect(() => manager.setValue('nonexistent', 'value'), throwsArgumentError);
    });

    test('isValid should return true when all required fields are set', () {
      manager.setValue('field3', true);
      expect(manager.isValid, true);
    });

    test('isValid should return false when required field is missing', () {
      expect(manager.isValid, false);
    });

    test('validationErrors should return list of missing required fields', () {
      final errors = manager.validationErrors;
      expect(errors, ['Field 3 is required']);
    });

    test('validationErrors should be empty when all required fields are set', () {
      manager.setValue('field3', true);
      expect(manager.validationErrors, isEmpty);
    });

    test('clear should reset to default values', () {
      manager.setValue('field1', 'modified');
      manager.setValue('field3', true);

      manager.clear();

      expect(manager.getValue('field1'), 'default1');
      expect(manager.getValue('field2'), 42);
      expect(manager.getValue('field3'), null);
    });

    test('loadValues should set multiple values', () {
      final values = {'field1': 'loaded1', 'field3': true};
      manager.loadValues(values);

      expect(manager.getValue('field1'), 'loaded1');
      expect(manager.getValue('field3'), true);
      expect(manager.getValue('field2'), null);
    });

    test('loadValues should skip invalid values', () {
      final values = {'field1': 'loaded1', 'invalid_field': 'value'};
      manager.loadValues(values);

      expect(manager.getValue('field1'), 'loaded1');
      expect(manager.getValue('invalid_field'), null);
    });
  });

  group('ReactionMetadata', () {
    test('should create ReactionMetadata', () {
      final metadata = ReactionMetadata(
        category: 'test_category',
        tags: ['tag1', 'tag2'],
        icon: 'icon.png',
        color: '#FF0000',
        requiresAuth: true,
        estimatedDuration: 300,
      );

      expect(metadata.category, 'test_category');
      expect(metadata.tags, ['tag1', 'tag2']);
      expect(metadata.icon, 'icon.png');
      expect(metadata.color, '#FF0000');
      expect(metadata.requiresAuth, true);
      expect(metadata.estimatedDuration, 300);
    });

    test('fromJson should create ReactionMetadata from JSON', () {
      final json = {
        'category': 'test_category',
        'tags': ['tag1', 'tag2'],
        'icon': 'icon.png',
        'color': '#FF0000',
        'requiresAuth': true,
        'estimatedDuration': 300,
      };

      final metadata = ReactionMetadata.fromJson(json);

      expect(metadata.category, 'test_category');
      expect(metadata.tags, ['tag1', 'tag2']);
      expect(metadata.icon, 'icon.png');
      expect(metadata.color, '#FF0000');
      expect(metadata.requiresAuth, true);
      expect(metadata.estimatedDuration, 300);
    });

    test('fromJson should handle missing optional fields', () {
      final json = {
        'category': 'test_category',
        'tags': ['tag1'],
        'requiresAuth': false,
      };

      final metadata = ReactionMetadata.fromJson(json);

      expect(metadata.category, 'test_category');
      expect(metadata.tags, ['tag1']);
      expect(metadata.icon, null);
      expect(metadata.color, null);
      expect(metadata.requiresAuth, false);
      expect(metadata.estimatedDuration, null);
    });

    test('toJson should convert ReactionMetadata to JSON', () {
      final metadata = ReactionMetadata(
        category: 'test_category',
        tags: ['tag1', 'tag2'],
        icon: 'icon.png',
        color: '#FF0000',
        requiresAuth: true,
        estimatedDuration: 300,
      );

      final json = metadata.toJson();

      expect(json['category'], 'test_category');
      expect(json['tags'], ['tag1', 'tag2']);
      expect(json['icon'], 'icon.png');
      expect(json['color'], '#FF0000');
      expect(json['requiresAuth'], true);
      expect(json['estimatedDuration'], 300);
    });
  });

  group('ReactionModel', () {
    test('should create ReactionModel', () {
      final configSchema = ConfigSchema(
        name: 'config',
        description: 'Config schema',
        fields: [],
      );
      final metadata = ReactionMetadata(category: 'test', tags: [], requiresAuth: false);

      final reaction = ReactionModel(
        id: 'reaction1',
        name: 'Test Reaction',
        description: 'A test reaction',
        configSchema: configSchema,
        outputSchema: {'type': 'object'},
        metadata: metadata,
      );

      expect(reaction.id, 'reaction1');
      expect(reaction.name, 'Test Reaction');
      expect(reaction.description, 'A test reaction');
      expect(reaction.configSchema, configSchema);
      expect(reaction.outputSchema, {'type': 'object'});
      expect(reaction.metadata, metadata);
    });

    test('fromJson should create ReactionModel from JSON', () {
      final json = {
        'id': 'reaction1',
        'name': 'Test Reaction',
        'description': 'A test reaction',
        'configSchema': {'name': 'config', 'description': 'Config schema', 'fields': []},
        'outputSchema': {'type': 'object'},
        'metadata': {'category': 'test', 'tags': [], 'requiresAuth': false},
      };

      final reaction = ReactionModel.fromJson(json);

      expect(reaction.id, 'reaction1');
      expect(reaction.name, 'Test Reaction');
      expect(reaction.description, 'A test reaction');
      expect(reaction.configSchema?.name, 'config');
      expect(reaction.outputSchema, {'type': 'object'});
      expect(reaction.metadata?.category, 'test');
    });

    test('fromJson should handle missing optional fields', () {
      final json = {
        'id': 'reaction1',
        'name': 'Test Reaction',
        'description': 'A test reaction',
      };

      final reaction = ReactionModel.fromJson(json);

      expect(reaction.id, 'reaction1');
      expect(reaction.name, 'Test Reaction');
      expect(reaction.description, 'A test reaction');
      expect(reaction.configSchema, null);
      expect(reaction.outputSchema, null);
      expect(reaction.metadata, null);
    });

    test('toJson should convert ReactionModel to JSON', () {
      final configSchema = ConfigSchema(
        name: 'config',
        description: 'Config schema',
        fields: [],
      );
      final reaction = ReactionModel(
        id: 'reaction1',
        name: 'Test Reaction',
        description: 'A test reaction',
        configSchema: configSchema,
      );

      final json = reaction.toJson();

      expect(json['id'], 'reaction1');
      expect(json['name'], 'Test Reaction');
      expect(json['description'], 'A test reaction');
      expect(json['configSchema'], isA<Map<String, dynamic>>());
    });

    test('hasConfigFields should return true when config schema has fields', () {
      final configSchema = ConfigSchema(
        name: 'config',
        description: 'Config schema',
        fields: [ConfigField(name: 'field1', type: 'text', label: 'Field 1', required: true)],
      );
      final reaction = ReactionModel(
        id: 'reaction1',
        name: 'Test Reaction',
        description: 'A test reaction',
        configSchema: configSchema,
      );

      expect(reaction.hasConfigFields, true);
    });

    test('hasConfigFields should return false when no config schema', () {
      final reaction = ReactionModel(
        id: 'reaction1',
        name: 'Test Reaction',
        description: 'A test reaction',
      );

      expect(reaction.hasConfigFields, false);
    });

    test('configFields should return config schema fields', () {
      final fields = [
        ConfigField(name: 'field1', type: 'text', label: 'Field 1', required: true),
      ];
      final configSchema = ConfigSchema(
        name: 'config',
        description: 'Config schema',
        fields: fields,
      );
      final reaction = ReactionModel(
        id: 'reaction1',
        name: 'Test Reaction',
        description: 'A test reaction',
        configSchema: configSchema,
      );

      expect(reaction.configFields, fields);
    });

    test('getConfigField should return field by name', () {
      final fields = [
        ConfigField(name: 'field1', type: 'text', label: 'Field 1', required: true),
      ];
      final configSchema = ConfigSchema(
        name: 'config',
        description: 'Config schema',
        fields: fields,
      );
      final reaction = ReactionModel(
        id: 'reaction1',
        name: 'Test Reaction',
        description: 'A test reaction',
        configSchema: configSchema,
      );

      final field = reaction.getConfigField('field1');
      expect(field, isNotNull);
      expect(field!.name, 'field1');
    });

    test('getConfigField should throw for non-existent field', () {
      final configSchema = ConfigSchema(
        name: 'config',
        description: 'Config schema',
        fields: [],
      );
      final reaction = ReactionModel(
        id: 'reaction1',
        name: 'Test Reaction',
        description: 'A test reaction',
        configSchema: configSchema,
      );

      expect(() => reaction.getConfigField('nonexistent'), throwsA(isA<StateError>()));
    });

    test('requiredConfigFields should return required fields', () {
      final fields = [
        ConfigField(name: 'field1', type: 'text', label: 'Field 1', required: true),
        ConfigField(name: 'field2', type: 'text', label: 'Field 2', required: false),
      ];
      final configSchema = ConfigSchema(
        name: 'config',
        description: 'Config schema',
        fields: fields,
      );
      final reaction = ReactionModel(
        id: 'reaction1',
        name: 'Test Reaction',
        description: 'A test reaction',
        configSchema: configSchema,
      );

      final requiredFields = reaction.requiredConfigFields;
      expect(requiredFields.length, 1);
      expect(requiredFields[0].name, 'field1');
    });

    test('validateConfig should delegate to config schema', () {
      final fields = [
        ConfigField(name: 'field1', type: 'text', label: 'Field 1', required: true),
      ];
      final configSchema = ConfigSchema(
        name: 'config',
        description: 'Config schema',
        fields: fields,
      );
      final reaction = ReactionModel(
        id: 'reaction1',
        name: 'Test Reaction',
        description: 'A test reaction',
        configSchema: configSchema,
      );

      expect(reaction.validateConfig({'field1': 'value'}), true);
      expect(reaction.validateConfig({}), false);
    });

    test('validateConfig should return true when no config schema', () {
      final reaction = ReactionModel(
        id: 'reaction1',
        name: 'Test Reaction',
        description: 'A test reaction',
      );

      expect(reaction.validateConfig({}), true);
    });
  });
}
