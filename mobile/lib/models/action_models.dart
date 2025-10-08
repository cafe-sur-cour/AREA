class ConfigField {
  final String name;
  final String type;
  final String label;
  final bool required;
  final String? placeholder;
  final List<ConfigOption>? options;
  final dynamic defaultValue;
  final String? description;

  ConfigField({
    required this.name,
    required this.type,
    required this.label,
    required this.required,
    this.placeholder,
    this.options,
    this.defaultValue,
    this.description,
  });

  factory ConfigField.fromJson(Map<String, dynamic> json) {
    return ConfigField(
      name: json['name'] as String,
      type: json['type'] as String,
      label: json['label'] as String,
      required: json['required'] as bool? ?? false,
      placeholder: json['placeholder'] as String?,
      options: json['options'] != null
          ? (json['options'] as List).map((option) => ConfigOption.fromJson(option)).toList()
          : null,
      defaultValue: json['default'],
      description: json['description'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'type': type,
      'label': label,
      'required': required,
      'placeholder': placeholder,
      'options': options?.map((option) => option.toJson()).toList(),
      'default': defaultValue,
      'description': description,
    };
  }

  bool get requiresOptions => type == 'select';

  bool get isNumericField => type == 'number';

  bool get isBooleanField => type == 'checkbox';

  bool get isMultilineText => type == 'textarea';

  bool get isEmailField => type == 'email';

  bool get isValid {
    if (requiresOptions && (options == null || options!.isEmpty)) {
      return false;
    }
    return name.isNotEmpty && type.isNotEmpty && label.isNotEmpty;
  }
}

class ConfigOption {
  final String value;
  final String label;

  ConfigOption({required this.value, required this.label});

  factory ConfigOption.fromJson(Map<String, dynamic> json) {
    return ConfigOption(value: json['value'] as String, label: json['label'] as String);
  }

  Map<String, dynamic> toJson() {
    return {'value': value, 'label': label};
  }
}

class ConfigSchema {
  final String name;
  final String description;
  final List<ConfigField> fields;

  ConfigSchema({required this.name, required this.description, required this.fields});

  factory ConfigSchema.fromJson(Map<String, dynamic> json) {
    return ConfigSchema(
      name: json['name'] as String? ?? '',
      description: json['description'] as String? ?? '',
      fields: json['fields'] != null
          ? (json['fields'] as List).map((field) => ConfigField.fromJson(field)).toList()
          : [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'description': description,
      'fields': fields.map((field) => field.toJson()).toList(),
    };
  }

  bool get hasFields => fields.isNotEmpty;

  List<ConfigField> getFieldsByType(String type) {
    return fields.where((field) => field.type == type).toList();
  }

  List<ConfigField> get requiredFields {
    return fields.where((field) => field.required).toList();
  }

  List<ConfigField> get optionalFields {
    return fields.where((field) => !field.required).toList();
  }

  ConfigField? getField(String name) {
    try {
      return fields.firstWhere((field) => field.name == name);
    } catch (e) {
      return null;
    }
  }

  bool validateConfig(Map<String, dynamic> config) {
    for (final field in requiredFields) {
      if (!config.containsKey(field.name) || config[field.name] == null) {
        return false;
      }

      final value = config[field.name];

      if (field.isNumericField && value is String) {
        if (num.tryParse(value) == null) {
          return false;
        }
      } else if (field.isBooleanField && value is String) {
        final lowerValue = value.toLowerCase();
        if (lowerValue != 'true' && lowerValue != 'false') {
          return false;
        }
      } else if (field.isNumericField && value is! num) {
        return false;
      } else if (field.isBooleanField && value is! bool) {
        return false;
      }
    }
    return true;
  }
}

class ActionMetadata {
  final String category;
  final List<String> tags;
  final String? icon;
  final String? color;
  final bool requiresAuth;
  final String? webhookPattern;

  ActionMetadata({
    required this.category,
    required this.tags,
    this.icon,
    this.color,
    required this.requiresAuth,
    this.webhookPattern,
  });

  factory ActionMetadata.fromJson(Map<String, dynamic> json) {
    return ActionMetadata(
      category: json['category'] as String? ?? '',
      tags: json['tags'] != null ? List<String>.from(json['tags']) : [],
      icon: json['icon'] as String?,
      color: json['color'] as String?,
      requiresAuth: json['requiresAuth'] as bool? ?? false,
      webhookPattern: json['webhookPattern'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'category': category,
      'tags': tags,
      'icon': icon,
      'color': color,
      'requiresAuth': requiresAuth,
      'webhookPattern': webhookPattern,
    };
  }
}

class ActionModel {
  final String id;
  final String name;
  final String description;
  final ConfigSchema? configSchema;
  final Map<String, dynamic>? inputSchema;
  final ActionMetadata? metadata;

  ActionModel({
    required this.id,
    required this.name,
    required this.description,
    this.configSchema,
    this.inputSchema,
    this.metadata,
  });

  factory ActionModel.fromJson(Map<String, dynamic> json) {
    return ActionModel(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String? ?? '',
      configSchema: json['configSchema'] != null
          ? ConfigSchema.fromJson(json['configSchema'])
          : null,
      inputSchema: json['inputSchema'] as Map<String, dynamic>?,
      metadata: json['metadata'] != null ? ActionMetadata.fromJson(json['metadata']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'configSchema': configSchema?.toJson(),
      'inputSchema': inputSchema,
      'metadata': metadata?.toJson(),
    };
  }

  bool get hasConfigFields => configSchema != null && configSchema!.fields.isNotEmpty;

  List<ConfigField> get configFields => configSchema?.fields ?? [];

  ConfigField? getConfigField(String fieldName) {
    return configFields.firstWhere(
      (field) => field.name == fieldName,
      orElse: () => throw StateError('Field $fieldName not found'),
    );
  }

  List<ConfigField> get requiredConfigFields {
    return configFields.where((field) => field.required).toList();
  }

  bool validateConfig(Map<String, dynamic> config) {
    if (!hasConfigFields) return true;

    for (final field in requiredConfigFields) {
      if (!config.containsKey(field.name) || config[field.name] == null) {
        return false;
      }

      final value = config[field.name];

      if (field.isNumericField && value is String) {
        if (num.tryParse(value) == null) {
          return false;
        }
      } else if (field.isBooleanField && value is String) {
        final lowerValue = value.toLowerCase();
        if (lowerValue != 'true' && lowerValue != 'false') {
          return false;
        }
      } else if (field.isNumericField && value is! num) {
        return false;
      } else if (field.isBooleanField && value is! bool) {
        return false;
      }
    }

    return true;
  }
}
