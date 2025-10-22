class ServiceModel {
  final String id;
  final String name;
  final String description;
  final String? version;
  final String color;
  final String? icon;

  ServiceModel({
    required this.id,
    required this.name,
    required this.description,
    this.version,
    required this.color,
    this.icon,
  });

  factory ServiceModel.fromJson(Map<String, dynamic> json) {
    String? extractedColor;
    String? extractedIcon;

    if (json['actions'] != null && (json['actions'] as List).isNotEmpty) {
      final actions = json['actions'] as List;
      for (var action in actions) {
        if (action['metadata'] != null) {
          final metadata = action['metadata'];
          if (metadata['color'] != null && extractedColor == null) {
            extractedColor = metadata['color'] as String;
          }
          if (metadata['icon'] != null && extractedIcon == null) {
            extractedIcon = metadata['icon'] as String;
          }
          if (extractedColor != null && extractedIcon != null) break;
        }
      }
    }

    if ((extractedColor == null || extractedIcon == null) &&
        json['reactions'] != null &&
        (json['reactions'] as List).isNotEmpty) {
      final reactions = json['reactions'] as List;
      for (var reaction in reactions) {
        if (reaction['metadata'] != null) {
          final metadata = reaction['metadata'];
          if (metadata['color'] != null && extractedColor == null) {
            extractedColor = metadata['color'] as String;
          }
          if (metadata['icon'] != null && extractedIcon == null) {
            extractedIcon = metadata['icon'] as String;
          }
          if (extractedColor != null && extractedIcon != null) break;
        }
      }
    }

    return ServiceModel(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String? ?? '',
      version: json['version'] as String?,
      color: json['color'] as String? ?? extractedColor ?? '#0175C2',
      icon: json['icon'] as String? ?? extractedIcon,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'version': version,
      'color': color,
      'icon': icon,
    };
  }
}
