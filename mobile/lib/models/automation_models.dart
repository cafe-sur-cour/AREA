class AutomationModel {
  final int id;
  final String name;
  final String description;
  final AutomationAction action;
  final List<AutomationReaction> reactions;
  final bool isActive;
  final int createdBy;
  final String createdAt;
  final String updatedAt;

  AutomationModel({
    required this.id,
    required this.name,
    required this.description,
    required this.action,
    required this.reactions,
    required this.isActive,
    required this.createdBy,
    required this.createdAt,
    required this.updatedAt,
  });

  factory AutomationModel.fromJson(Map<String, dynamic> json) {
    return AutomationModel(
      id: json['id'] as int,
      name: json['name'] as String,
      description: json['description'] as String,
      action: AutomationAction.fromJson(json['action'] as Map<String, dynamic>),
      reactions: (json['reactions'] as List)
          .map((reaction) => AutomationReaction.fromJson(reaction as Map<String, dynamic>))
          .toList(),
      isActive: json['is_active'] as bool? ?? true,
      createdBy: json['created_by'] as int? ?? 0,
      createdAt: json['created_at'] as String? ?? '',
      updatedAt: json['updated_at'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'action': action.toJson(),
      'reactions': reactions.map((reaction) => reaction.toJson()).toList(),
      'is_active': isActive,
      'created_by': createdBy,
      'created_at': createdAt,
      'updated_at': updatedAt,
    };
  }

  AutomationModel copyWith({
    int? id,
    String? name,
    String? description,
    AutomationAction? action,
    List<AutomationReaction>? reactions,
    bool? isActive,
    int? createdBy,
    String? createdAt,
    String? updatedAt,
  }) {
    return AutomationModel(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      action: action ?? this.action,
      reactions: reactions ?? this.reactions,
      isActive: isActive ?? this.isActive,
      createdBy: createdBy ?? this.createdBy,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

class AutomationAction {
  final String type;
  final Map<String, dynamic> config;

  AutomationAction({required this.type, required this.config});

  factory AutomationAction.fromJson(Map<String, dynamic> json) {
    return AutomationAction(
      type: json['type'] as String,
      config: json['config'] as Map<String, dynamic>? ?? {},
    );
  }

  Map<String, dynamic> toJson() {
    return {'type': type, 'config': config};
  }
}

class AutomationReaction {
  final String type;
  final Map<String, dynamic> config;
  final int delay;

  AutomationReaction({required this.type, required this.config, required this.delay});

  factory AutomationReaction.fromJson(Map<String, dynamic> json) {
    return AutomationReaction(
      type: json['type'] as String,
      config: json['config'] as Map<String, dynamic>? ?? {},
      delay: json['delay'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {'type': type, 'config': config, 'delay': delay};
  }
}
