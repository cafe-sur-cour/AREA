class ActionModel {
  final String id;
  final String name;
  final String description;
  final String serviceId;
  final Map<String, dynamic>? parameters;
  final String? iconUrl;

  ActionModel({
    required this.id,
    required this.name,
    required this.description,
    required this.serviceId,
    this.parameters,
    this.iconUrl,
  });

  factory ActionModel.fromJson(Map<String, dynamic> json) {
    return ActionModel(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String? ?? '',
      serviceId: json['serviceId'] as String,
      parameters: json['parameters'] as Map<String, dynamic>?,
      iconUrl: json['iconUrl'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'serviceId': serviceId,
      'parameters': parameters,
      'iconUrl': iconUrl,
    };
  }
}
