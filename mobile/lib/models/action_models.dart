class ConfigField {
  final String name;
  final String type;
  final String label;
  final bool required;
  final String? placeholder;
  final List<ConfigOption>? options;
  final String? defaultValue;

  ConfigField({
    required this.name,
    required this.type,
    required this.label,
    required this.required,
    this.placeholder,
    this.options,
    this.defaultValue,
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
      defaultValue: json['default'] as String?,
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
    };
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
}
