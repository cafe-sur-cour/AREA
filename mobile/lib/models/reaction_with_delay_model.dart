import 'package:area/models/reaction_models.dart';
import 'package:area/models/service_models.dart';

class ReactionWithDelayModel {
  final ReactionModel reaction;
  final ServiceModel service;
  final int delayInSeconds;

  ReactionWithDelayModel({
    required this.reaction,
    required this.service,
    this.delayInSeconds = 0,
  });

  int get days => delayInSeconds ~/ 86400;
  int get hours => (delayInSeconds % 86400) ~/ 3600;
  int get minutes => (delayInSeconds % 3600) ~/ 60;
  int get seconds => delayInSeconds % 60;

  static int calculateDelayInSeconds({
    int days = 0,
    int hours = 0,
    int minutes = 0,
    int seconds = 0,
  }) {
    return (days * 86400) + (hours * 3600) + (minutes * 60) + seconds;
  }

  String get formattedDelay {
    if (delayInSeconds == 0) return 'No delay';

    List<String> parts = [];

    final d = days;
    final h = hours;
    final m = minutes;
    final s = seconds;

    if (d > 0) parts.add('${d}d');
    if (h > 0) parts.add('${h}h');
    if (m > 0) parts.add('${m}m');
    if (s > 0) parts.add('${s}s');

    return parts.isEmpty ? 'No delay' : parts.join(' ');
  }

  String get shortFormattedDelay {
    if (delayInSeconds == 0) return 'Instant';

    final d = days;
    final h = hours;
    final m = minutes;
    final s = seconds;

    if (d > 0) return '${d}d ${h}h';
    if (h > 0) return '${h}h ${m}m';
    if (m > 0) return '${m}m ${s}s';
    return '${s}s';
  }

  ReactionWithDelayModel copyWith({
    ReactionModel? reaction,
    ServiceModel? service,
    int? delayInSeconds,
  }) {
    return ReactionWithDelayModel(
      reaction: reaction ?? this.reaction,
      service: service ?? this.service,
      delayInSeconds: delayInSeconds ?? this.delayInSeconds,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'reaction': reaction.toJson(),
      'service': service.toJson(),
      'delayInSeconds': delayInSeconds,
    };
  }

  factory ReactionWithDelayModel.fromJson(Map<String, dynamic> json) {
    return ReactionWithDelayModel(
      reaction: ReactionModel.fromJson(json['reaction']),
      service: ServiceModel.fromJson(json['service']),
      delayInSeconds: json['delayInSeconds'] as int? ?? 0,
    );
  }
}
