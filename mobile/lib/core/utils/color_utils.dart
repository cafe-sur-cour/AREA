import 'package:flutter/material.dart';
import 'package:area/core/constants/app_colors.dart';
import 'package:area/models/action_models.dart';
import 'package:area/models/reaction_models.dart';
import 'package:area/models/service_models.dart';

class ColorUtils {
  static Color parseColorString(String? colorString, [Color? fallback]) {
    if (colorString == null || colorString.isEmpty) {
      return fallback ?? AppColors.areaBlue3;
    }

    try {
      String colorHex = colorString;
      if (colorHex.startsWith('#')) {
        colorHex = colorHex.substring(1);
      }

      if (colorHex.length == 6) {
        colorHex = 'FF$colorHex';
      }

      return Color(int.parse(colorHex, radix: 16));
    } catch (e) {
      return fallback ?? AppColors.areaBlue3;
    }
  }

  static Color getActionColor(ActionModel action, [ServiceModel? service]) {
    if (action.metadata?.color != null) {
      return parseColorString(action.metadata!.color);
    }

    if (service != null) {
      return parseColorString(service.color);
    }

    return AppColors.areaBlue3;
  }

  static Color getReactionColor(ReactionModel reaction, [ServiceModel? service]) {
    if (reaction.metadata?.color != null) {
      return parseColorString(reaction.metadata!.color);
    }

    if (service != null) {
      return parseColorString(service.color);
    }

    return AppColors.areaBlue3;
  }

  static Color getServiceColor(ServiceModel service) {
    return parseColorString(service.color);
  }

  static LinearGradient createColorGradient(
    Color baseColor, {
    double startAlpha = 0.1,
    double endAlpha = 0.05,
    Alignment begin = Alignment.topLeft,
    Alignment end = Alignment.bottomRight,
  }) {
    return LinearGradient(
      begin: begin,
      end: end,
      colors: [
        baseColor.withValues(alpha: startAlpha),
        baseColor.withValues(alpha: endAlpha),
      ],
    );
  }

  static IconData? getActionIcon(ActionModel action) {
    return null;
  }

  static IconData? getReactionIcon(ReactionModel reaction) {
    return null;
  }
}
