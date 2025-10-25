class DashboardStats {
  final int totalAutomations;
  final int activeAutomations;
  final int inactiveAutomations;
  final int totalServices;

  DashboardStats({
    required this.totalAutomations,
    required this.activeAutomations,
    required this.inactiveAutomations,
    required this.totalServices,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      totalAutomations: json['total_automations'] as int? ?? 0,
      activeAutomations: json['active_automations'] as int? ?? 0,
      inactiveAutomations: json['inactive_automations'] as int? ?? 0,
      totalServices: json['total_services'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'total_automations': totalAutomations,
      'active_automations': activeAutomations,
      'inactive_automations': inactiveAutomations,
      'total_services': totalServices,
    };
  }

  DashboardStats copyWith({
    int? totalAutomations,
    int? activeAutomations,
    int? inactiveAutomations,
    int? totalServices,
  }) {
    return DashboardStats(
      totalAutomations: totalAutomations ?? this.totalAutomations,
      activeAutomations: activeAutomations ?? this.activeAutomations,
      inactiveAutomations: inactiveAutomations ?? this.inactiveAutomations,
      totalServices: totalServices ?? this.totalServices,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is DashboardStats &&
        other.totalAutomations == totalAutomations &&
        other.activeAutomations == activeAutomations &&
        other.inactiveAutomations == inactiveAutomations &&
        other.totalServices == totalServices;
  }

  @override
  int get hashCode {
    return totalAutomations.hashCode ^
        activeAutomations.hashCode ^
        inactiveAutomations.hashCode ^
        totalServices.hashCode;
  }

  @override
  String toString() {
    return 'DashboardStats(totalAutomations: $totalAutomations, activeAutomations: $activeAutomations, inactiveAutomations: $inactiveAutomations, totalServices: $totalServices)';
  }
}
