import 'package:area/models/action_models.dart';

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
      configSchema: json['configSchema'] != null
          ? ConfigSchema.fromJson(json['configSchema'])
          : null,
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
}
