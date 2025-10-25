import 'package:flutter_test/flutter_test.dart';
import 'package:area/models/action_models.dart';

void main() {
  group('ConfigField', () {
    test('should create ConfigField with required parameters', () {
      final field = ConfigField(
        name: 'test_field',
        type: 'text',
        label: 'Test Field',
        required: true,
      );

      expect(field.name, 'test_field');
      expect(field.type, 'text');
      expect(field.label, 'Test Field');
      expect(field.required, true);
      expect(field.placeholder, null);
      expect(field.options, null);
      expect(field.defaultValue, null);
      expect(field.description, null);
      expect(field.isDynamic, false);
    });

    test('should create ConfigField with all parameters', () {
      final options = [ConfigOption(value: 'option1', label: 'Option 1')];
      final field = ConfigField(
        name: 'test_field',
        type: 'select',
        label: 'Test Field',
        required: false,
        placeholder: 'Enter value',
        options: options,
        defaultValue: 'default',
        description: 'A test field',
        isDynamic: true,
      );

      expect(field.name, 'test_field');
      expect(field.type, 'select');
      expect(field.label, 'Test Field');
      expect(field.required, false);
      expect(field.placeholder, 'Enter value');
      expect(field.options, options);
      expect(field.defaultValue, 'default');
      expect(field.description, 'A test field');
      expect(field.isDynamic, true);
    });

    test('fromJson should create ConfigField from valid JSON', () {
      final json = {
        'name': 'test_field',
        'type': 'select',
        'label': 'Test Field',
        'required': true,
        'placeholder': 'Enter value',
        'options': [
          {'value': 'option1', 'label': 'Option 1'},
        ],
        'default': 'default_value',
        'description': 'A description',
        'dynamic': true,
      };

      final field = ConfigField.fromJson(json);

      expect(field.name, 'test_field');
      expect(field.type, 'select');
      expect(field.label, 'Test Field');
      expect(field.required, true);
      expect(field.placeholder, 'Enter value');
      expect(field.options?.length, 1);
      expect(field.options?[0].value, 'option1');
      expect(field.defaultValue, 'default_value');
      expect(field.description, 'A description');
      expect(field.isDynamic, true);
    });

    test('fromJson should handle missing optional fields', () {
      final json = {'name': 'test_field', 'type': 'text', 'label': 'Test Field'};

      final field = ConfigField.fromJson(json);

      expect(field.name, 'test_field');
      expect(field.type, 'text');
      expect(field.label, 'Test Field');
      expect(field.required, false);
      expect(field.placeholder, null);
      expect(field.options, null);
      expect(field.defaultValue, null);
      expect(field.description, null);
      expect(field.isDynamic, false);
    });

    test('toJson should convert ConfigField to JSON', () {
      final options = [ConfigOption(value: 'option1', label: 'Option 1')];
      final field = ConfigField(
        name: 'test_field',
        type: 'select',
        label: 'Test Field',
        required: true,
        placeholder: 'Enter value',
        options: options,
        defaultValue: 'default',
        description: 'A description',
        isDynamic: true,
      );

      final json = field.toJson();

      expect(json['name'], 'test_field');
      expect(json['type'], 'select');
      expect(json['label'], 'Test Field');
      expect(json['required'], true);
      expect(json['placeholder'], 'Enter value');
      expect(json['options'], isA<List>());
      expect(json['default'], 'default');
      expect(json['description'], 'A description');
      expect(json['dynamic'], true);
    });

    test('requiresOptions should return true for select type', () {
      final field = ConfigField(
        name: 'test_field',
        type: 'select',
        label: 'Test Field',
        required: true,
      );

      expect(field.requiresOptions, true);
    });

    test('requiresOptions should return false for non-select types', () {
      final field = ConfigField(
        name: 'test_field',
        type: 'text',
        label: 'Test Field',
        required: true,
      );

      expect(field.requiresOptions, false);
    });

    test('isNumericField should return true for number type', () {
      final field = ConfigField(
        name: 'test_field',
        type: 'number',
        label: 'Test Field',
        required: true,
      );

      expect(field.isNumericField, true);
    });

    test('isBooleanField should return true for checkbox type', () {
      final field = ConfigField(
        name: 'test_field',
        type: 'checkbox',
        label: 'Test Field',
        required: true,
      );

      expect(field.isBooleanField, true);
    });

    test('isMultilineText should return true for textarea type', () {
      final field = ConfigField(
        name: 'test_field',
        type: 'textarea',
        label: 'Test Field',
        required: true,
      );

      expect(field.isMultilineText, true);
    });

    test('isEmailField should return true for email type', () {
      final field = ConfigField(
        name: 'test_field',
        type: 'email',
        label: 'Test Field',
        required: true,
      );

      expect(field.isEmailField, true);
    });

    test('isValid should return true for valid field', () {
      final field = ConfigField(
        name: 'test_field',
        type: 'text',
        label: 'Test Field',
        required: true,
      );

      expect(field.isValid, true);
    });

    test('isValid should return false for select field without options', () {
      final field = ConfigField(
        name: 'test_field',
        type: 'select',
        label: 'Test Field',
        required: true,
      );

      expect(field.isValid, false);
    });

    test('isValid should return false for empty name', () {
      final field = ConfigField(name: '', type: 'text', label: 'Test Field', required: true);

      expect(field.isValid, false);
    });
  });

  group('ConfigOption', () {
    test('should create ConfigOption', () {
      final option = ConfigOption(value: 'option1', label: 'Option 1');

      expect(option.value, 'option1');
      expect(option.label, 'Option 1');
    });

    test('fromJson should create ConfigOption from JSON', () {
      final json = {'value': 'option1', 'label': 'Option 1'};

      final option = ConfigOption.fromJson(json);

      expect(option.value, 'option1');
      expect(option.label, 'Option 1');
    });

    test('toJson should convert ConfigOption to JSON', () {
      final option = ConfigOption(value: 'option1', label: 'Option 1');

      final json = option.toJson();

      expect(json['value'], 'option1');
      expect(json['label'], 'Option 1');
    });
  });

  group('ConfigSchema', () {
    test('should create ConfigSchema', () {
      final fields = [
        ConfigField(name: 'field1', type: 'text', label: 'Field 1', required: true),
      ];
      final schema = ConfigSchema(
        name: 'test_schema',
        description: 'A test schema',
        fields: fields,
      );

      expect(schema.name, 'test_schema');
      expect(schema.description, 'A test schema');
      expect(schema.fields, fields);
    });

    test('fromJson should create ConfigSchema from JSON', () {
      final json = {
        'name': 'test_schema',
        'description': 'A test schema',
        'fields': [
          {'name': 'field1', 'type': 'text', 'label': 'Field 1', 'required': true},
        ],
      };

      final schema = ConfigSchema.fromJson(json);

      expect(schema.name, 'test_schema');
      expect(schema.description, 'A test schema');
      expect(schema.fields.length, 1);
    });

    test('fromJson should handle missing fields', () {
      final json = {'name': 'test_schema', 'description': 'A test schema'};

      final schema = ConfigSchema.fromJson(json);

      expect(schema.name, 'test_schema');
      expect(schema.description, 'A test schema');
      expect(schema.fields, isEmpty);
    });

    test('toJson should convert ConfigSchema to JSON', () {
      final fields = [
        ConfigField(name: 'field1', type: 'text', label: 'Field 1', required: true),
      ];
      final schema = ConfigSchema(
        name: 'test_schema',
        description: 'A test schema',
        fields: fields,
      );

      final json = schema.toJson();

      expect(json['name'], 'test_schema');
      expect(json['description'], 'A test schema');
      expect(json['fields'], isA<List>());
    });

    test('hasFields should return true when fields exist', () {
      final fields = [
        ConfigField(name: 'field1', type: 'text', label: 'Field 1', required: true),
      ];
      final schema = ConfigSchema(
        name: 'test_schema',
        description: 'A test schema',
        fields: fields,
      );

      expect(schema.hasFields, true);
    });

    test('hasFields should return false when no fields', () {
      final schema = ConfigSchema(
        name: 'test_schema',
        description: 'A test schema',
        fields: [],
      );

      expect(schema.hasFields, false);
    });

    test('getFieldsByType should return fields of specific type', () {
      final fields = [
        ConfigField(name: 'field1', type: 'text', label: 'Field 1', required: true),
        ConfigField(name: 'field2', type: 'number', label: 'Field 2', required: false),
        ConfigField(name: 'field3', type: 'text', label: 'Field 3', required: false),
      ];
      final schema = ConfigSchema(
        name: 'test_schema',
        description: 'A test schema',
        fields: fields,
      );

      final textFields = schema.getFieldsByType('text');
      expect(textFields.length, 2);
      expect(textFields[0].name, 'field1');
      expect(textFields[1].name, 'field3');
    });

    test('requiredFields should return only required fields', () {
      final fields = [
        ConfigField(name: 'field1', type: 'text', label: 'Field 1', required: true),
        ConfigField(name: 'field2', type: 'number', label: 'Field 2', required: false),
      ];
      final schema = ConfigSchema(
        name: 'test_schema',
        description: 'A test schema',
        fields: fields,
      );

      final requiredFields = schema.requiredFields;
      expect(requiredFields.length, 1);
      expect(requiredFields[0].name, 'field1');
    });

    test('optionalFields should return only optional fields', () {
      final fields = [
        ConfigField(name: 'field1', type: 'text', label: 'Field 1', required: true),
        ConfigField(name: 'field2', type: 'number', label: 'Field 2', required: false),
      ];
      final schema = ConfigSchema(
        name: 'test_schema',
        description: 'A test schema',
        fields: fields,
      );

      final optionalFields = schema.optionalFields;
      expect(optionalFields.length, 1);
      expect(optionalFields[0].name, 'field2');
    });

    test('getField should return field by name', () {
      final fields = [
        ConfigField(name: 'field1', type: 'text', label: 'Field 1', required: true),
        ConfigField(name: 'field2', type: 'number', label: 'Field 2', required: false),
      ];
      final schema = ConfigSchema(
        name: 'test_schema',
        description: 'A test schema',
        fields: fields,
      );

      final field = schema.getField('field2');
      expect(field?.name, 'field2');
    });

    test('getField should return null for non-existent field', () {
      final fields = [
        ConfigField(name: 'field1', type: 'text', label: 'Field 1', required: true),
      ];
      final schema = ConfigSchema(
        name: 'test_schema',
        description: 'A test schema',
        fields: fields,
      );

      final field = schema.getField('nonexistent');
      expect(field, null);
    });

    test('validateConfig should return true for valid config', () {
      final fields = [
        ConfigField(name: 'field1', type: 'text', label: 'Field 1', required: true),
        ConfigField(name: 'field2', type: 'number', label: 'Field 2', required: false),
      ];
      final schema = ConfigSchema(
        name: 'test_schema',
        description: 'A test schema',
        fields: fields,
      );

      final config = {'field1': 'value1', 'field2': 42};
      expect(schema.validateConfig(config), true);
    });

    test('validateConfig should return false for missing required field', () {
      final fields = [
        ConfigField(name: 'field1', type: 'text', label: 'Field 1', required: true),
      ];
      final schema = ConfigSchema(
        name: 'test_schema',
        description: 'A test schema',
        fields: fields,
      );

      final config = <String, dynamic>{};
      expect(schema.validateConfig(config), false);
    });

    test('validateConfig should handle numeric field validation', () {
      final fields = [
        ConfigField(name: 'field1', type: 'number', label: 'Field 1', required: true),
      ];
      final schema = ConfigSchema(
        name: 'test_schema',
        description: 'A test schema',
        fields: fields,
      );

      expect(schema.validateConfig({'field1': 42}), true);
      expect(schema.validateConfig({'field1': '42'}), true);
      expect(schema.validateConfig({'field1': 'invalid'}), false);
    });

    test('validateConfig should handle boolean field validation', () {
      final fields = [
        ConfigField(name: 'field1', type: 'checkbox', label: 'Field 1', required: true),
      ];
      final schema = ConfigSchema(
        name: 'test_schema',
        description: 'A test schema',
        fields: fields,
      );

      expect(schema.validateConfig({'field1': true}), true);
      expect(schema.validateConfig({'field1': 'true'}), true);
      expect(schema.validateConfig({'field1': 'false'}), true);
      expect(schema.validateConfig({'field1': 'invalid'}), false);
    });
  });

  group('ActionMetadata', () {
    test('should create ActionMetadata', () {
      final metadata = ActionMetadata(
        category: 'test_category',
        tags: ['tag1', 'tag2'],
        icon: 'icon.png',
        color: '#FF0000',
        requiresAuth: true,
        webhookPattern: 'pattern',
      );

      expect(metadata.category, 'test_category');
      expect(metadata.tags, ['tag1', 'tag2']);
      expect(metadata.icon, 'icon.png');
      expect(metadata.color, '#FF0000');
      expect(metadata.requiresAuth, true);
      expect(metadata.webhookPattern, 'pattern');
    });

    test('fromJson should create ActionMetadata from JSON', () {
      final json = {
        'category': 'test_category',
        'tags': ['tag1', 'tag2'],
        'icon': 'icon.png',
        'color': '#FF0000',
        'requiresAuth': true,
        'webhookPattern': 'pattern',
      };

      final metadata = ActionMetadata.fromJson(json);

      expect(metadata.category, 'test_category');
      expect(metadata.tags, ['tag1', 'tag2']);
      expect(metadata.icon, 'icon.png');
      expect(metadata.color, '#FF0000');
      expect(metadata.requiresAuth, true);
      expect(metadata.webhookPattern, 'pattern');
    });

    test('fromJson should handle missing optional fields', () {
      final json = {
        'category': 'test_category',
        'tags': ['tag1'],
        'requiresAuth': false,
      };

      final metadata = ActionMetadata.fromJson(json);

      expect(metadata.category, 'test_category');
      expect(metadata.tags, ['tag1']);
      expect(metadata.icon, null);
      expect(metadata.color, null);
      expect(metadata.requiresAuth, false);
      expect(metadata.webhookPattern, null);
    });

    test('toJson should convert ActionMetadata to JSON', () {
      final metadata = ActionMetadata(
        category: 'test_category',
        tags: ['tag1', 'tag2'],
        icon: 'icon.png',
        color: '#FF0000',
        requiresAuth: true,
        webhookPattern: 'pattern',
      );

      final json = metadata.toJson();

      expect(json['category'], 'test_category');
      expect(json['tags'], ['tag1', 'tag2']);
      expect(json['icon'], 'icon.png');
      expect(json['color'], '#FF0000');
      expect(json['requiresAuth'], true);
      expect(json['webhookPattern'], 'pattern');
    });
  });

  group('PayloadField', () {
    test('should create PayloadField', () {
      final field = PayloadField(
        path: 'data.value',
        type: 'string',
        description: 'A value field',
        example: 'example_value',
      );

      expect(field.path, 'data.value');
      expect(field.type, 'string');
      expect(field.description, 'A value field');
      expect(field.example, 'example_value');
    });

    test('fromJson should create PayloadField from JSON', () {
      final json = {
        'path': 'data.value',
        'type': 'string',
        'description': 'A value field',
        'example': 'example_value',
      };

      final field = PayloadField.fromJson(json);

      expect(field.path, 'data.value');
      expect(field.type, 'string');
      expect(field.description, 'A value field');
      expect(field.example, 'example_value');
    });

    test('fromJson should handle missing example', () {
      final json = {'path': 'data.value', 'type': 'string', 'description': 'A value field'};

      final field = PayloadField.fromJson(json);

      expect(field.path, 'data.value');
      expect(field.type, 'string');
      expect(field.description, 'A value field');
      expect(field.example, null);
    });

    test('toJson should convert PayloadField to JSON', () {
      final field = PayloadField(
        path: 'data.value',
        type: 'string',
        description: 'A value field',
        example: 'example_value',
      );

      final json = field.toJson();

      expect(json['path'], 'data.value');
      expect(json['type'], 'string');
      expect(json['description'], 'A value field');
      expect(json['example'], 'example_value');
    });
  });

  group('ActionModel', () {
    test('should create ActionModel', () {
      final configSchema = ConfigSchema(
        name: 'config',
        description: 'Config schema',
        fields: [],
      );
      final metadata = ActionMetadata(category: 'test', tags: [], requiresAuth: false);
      final payloadFields = [
        PayloadField(path: 'data', type: 'string', description: 'Data field'),
      ];

      final action = ActionModel(
        id: 'action1',
        name: 'Test Action',
        description: 'A test action',
        configSchema: configSchema,
        inputSchema: {'type': 'object'},
        payloadFields: payloadFields,
        metadata: metadata,
      );

      expect(action.id, 'action1');
      expect(action.name, 'Test Action');
      expect(action.description, 'A test action');
      expect(action.configSchema, configSchema);
      expect(action.inputSchema, {'type': 'object'});
      expect(action.payloadFields, payloadFields);
      expect(action.metadata, metadata);
    });

    test('fromJson should create ActionModel from JSON', () {
      final json = {
        'id': 'action1',
        'name': 'Test Action',
        'description': 'A test action',
        'configSchema': {'name': 'config', 'description': 'Config schema', 'fields': []},
        'inputSchema': {'type': 'object'},
        'payloadFields': [
          {'path': 'data', 'type': 'string', 'description': 'Data field'},
        ],
        'metadata': {'category': 'test', 'tags': [], 'requiresAuth': false},
      };

      final action = ActionModel.fromJson(json);

      expect(action.id, 'action1');
      expect(action.name, 'Test Action');
      expect(action.description, 'A test action');
      expect(action.configSchema?.name, 'config');
      expect(action.inputSchema, {'type': 'object'});
      expect(action.payloadFields?.length, 1);
      expect(action.metadata?.category, 'test');
    });

    test('fromJson should handle missing optional fields', () {
      final json = {'id': 'action1', 'name': 'Test Action', 'description': 'A test action'};

      final action = ActionModel.fromJson(json);

      expect(action.id, 'action1');
      expect(action.name, 'Test Action');
      expect(action.description, 'A test action');
      expect(action.configSchema, null);
      expect(action.inputSchema, null);
      expect(action.payloadFields, null);
      expect(action.metadata, null);
    });

    test('toJson should convert ActionModel to JSON', () {
      final configSchema = ConfigSchema(
        name: 'config',
        description: 'Config schema',
        fields: [],
      );
      final action = ActionModel(
        id: 'action1',
        name: 'Test Action',
        description: 'A test action',
        configSchema: configSchema,
      );

      final json = action.toJson();

      expect(json['id'], 'action1');
      expect(json['name'], 'Test Action');
      expect(json['description'], 'A test action');
      expect(json['configSchema'], isA<Map<String, dynamic>>());
    });

    test('hasConfigFields should return true when config schema has fields', () {
      final configSchema = ConfigSchema(
        name: 'config',
        description: 'Config schema',
        fields: [ConfigField(name: 'field1', type: 'text', label: 'Field 1', required: true)],
      );
      final action = ActionModel(
        id: 'action1',
        name: 'Test Action',
        description: 'A test action',
        configSchema: configSchema,
      );

      expect(action.hasConfigFields, true);
    });

    test('hasConfigFields should return false when no config schema', () {
      final action = ActionModel(
        id: 'action1',
        name: 'Test Action',
        description: 'A test action',
      );

      expect(action.hasConfigFields, false);
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
      final action = ActionModel(
        id: 'action1',
        name: 'Test Action',
        description: 'A test action',
        configSchema: configSchema,
      );

      expect(action.configFields, fields);
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
      final action = ActionModel(
        id: 'action1',
        name: 'Test Action',
        description: 'A test action',
        configSchema: configSchema,
      );

      final field = action.getConfigField('field1');
      expect(field, isNotNull);
      expect(field!.name, 'field1');
    });

    test('getConfigField should throw for non-existent field', () {
      final configSchema = ConfigSchema(
        name: 'config',
        description: 'Config schema',
        fields: [],
      );
      final action = ActionModel(
        id: 'action1',
        name: 'Test Action',
        description: 'A test action',
        configSchema: configSchema,
      );

      expect(() => action.getConfigField('nonexistent'), throwsA(isA<StateError>()));
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
      final action = ActionModel(
        id: 'action1',
        name: 'Test Action',
        description: 'A test action',
        configSchema: configSchema,
      );

      final requiredFields = action.requiredConfigFields;
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
      final action = ActionModel(
        id: 'action1',
        name: 'Test Action',
        description: 'A test action',
        configSchema: configSchema,
      );

      expect(action.validateConfig({'field1': 'value'}), true);
      expect(action.validateConfig({}), false);
    });

    test('validateConfig should return true when no config schema', () {
      final action = ActionModel(
        id: 'action1',
        name: 'Test Action',
        description: 'A test action',
      );

      expect(action.validateConfig({}), true);
    });
  });
}
