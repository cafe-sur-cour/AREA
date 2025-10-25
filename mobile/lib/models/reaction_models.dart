import 'package:area/models/action_models.dart';

class ConfigurationManager {
  final ConfigSchema schema;
  final Map<String, dynamic> _values = {};

  ConfigurationManager(this.schema) {
    for (final field in schema.fields) {
      if (field.defaultValue != null) {
        _values[field.name] = field.defaultValue;
      }
    }
  }

  Map<String, dynamic> get values => Map.unmodifiable(_values);

  void setValue(String fieldName, dynamic value) {
    final field = schema.getField(fieldName);
    if (field == null) {
      throw ArgumentError('Field $fieldName not found in schema');
    }

    if (field.isNumericField && value is String) {
      final numValue = num.tryParse(value);
      if (numValue != null) {
        _values[fieldName] = numValue;
      } else {
        throw ArgumentError('Invalid numeric value for field $fieldName');
      }
    } else if (field.isBooleanField && value is String) {
      _values[fieldName] = value.toLowerCase() == 'true';
    } else {
      _values[fieldName] = value;
    }
  }

  dynamic getValue(String fieldName) {
    return _values[fieldName];
  }

  bool get isValid => schema.validateConfig(_values);

  List<String> get validationErrors {
    final errors = <String>[];

    for (final field in schema.requiredFields) {
      if (!_values.containsKey(field.name) || _values[field.name] == null) {
        errors.add('${field.label} is required');
      }
    }

    return errors;
  }

  void clear() {
    _values.clear();
    for (final field in schema.fields) {
      if (field.defaultValue != null) {
        _values[field.name] = field.defaultValue;
      }
    }
  }

  void loadValues(Map<String, dynamic> values) {
    _values.clear();
    for (final entry in values.entries) {
      try {
        setValue(entry.key, entry.value);
      } catch (e) {
        continue;
      }
    }
  }
}

class ReactionMetadata {
  final String category;
  final List<String> tags;
  final String? icon;
  final String? color;
  final bool requiresAuth;
  final int? estimatedDuration;

  ReactionMetadata({
    required this.category,
    required this.tags,
    this.icon,
    this.color,
    required this.requiresAuth,
    this.estimatedDuration,
  });

  factory ReactionMetadata.fromJson(Map<String, dynamic> json) {
    return ReactionMetadata(
      category: json['category'] as String? ?? '',
      tags: json['tags'] != null ? List<String>.from(json['tags']) : [],
      icon: json['icon'] as String?,
      color: json['color'] as String?,
      requiresAuth: json['requiresAuth'] as bool? ?? false,
      estimatedDuration: json['estimatedDuration'] as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'category': category,
      'tags': tags,
      'icon': icon,
      'color': color,
      'requiresAuth': requiresAuth,
      'estimatedDuration': estimatedDuration,
    };
  }
}

class ReactionModel {
  final String id;
  final String name;
  final String description;
  final ConfigSchema? configSchema;
  final Map<String, dynamic>? outputSchema;
  final ReactionMetadata? metadata;

  ReactionModel({
    required this.id,
    required this.name,
    required this.description,
    this.configSchema,
    this.outputSchema,
    this.metadata,
  });

  factory ReactionModel.fromJson(Map<String, dynamic> json) {
    return ReactionModel(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String? ?? '',
      configSchema:
          json['configSchema'] != null ? ConfigSchema.fromJson(json['configSchema']) : null,
      outputSchema: json['outputSchema'] as Map<String, dynamic>?,
      metadata: json['metadata'] != null ? ReactionMetadata.fromJson(json['metadata']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'configSchema': configSchema?.toJson(),
      'outputSchema': outputSchema,
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
