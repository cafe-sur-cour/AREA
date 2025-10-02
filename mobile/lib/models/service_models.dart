class ServiceModel {
  final String id;
  final String name;
  final String description;
  final String? iconUrl;
  final String color;

  ServiceModel({
    required this.id,
    required this.name,
    required this.description,
    this.iconUrl,
    required this.color,
  });

  factory ServiceModel.fromJson(Map<String, dynamic> json) {
    return ServiceModel(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String? ?? '',
      iconUrl: json['iconUrl'] as String?,
      color: json['color'] as String? ?? '#0175C2',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'iconUrl': iconUrl,
      'color': color,
    };
  }
}
