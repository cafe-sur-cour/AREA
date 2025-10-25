import 'package:area/core/constants/app_colors.dart';
import 'package:area/core/utils/color_utils.dart';
import 'package:area/models/reaction_with_delay_model.dart';
import 'package:area/models/service_models.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:flutter/material.dart';

class AutomationConnector extends StatelessWidget {
  final ServiceModel? actionService;
  final List<ReactionWithDelayModel> reactions;

  const AutomationConnector({super.key, required this.actionService, required this.reactions});

  Color get _actionColor =>
      actionService != null ? ColorUtils.getServiceColor(actionService!) : AppColors.areaBlue3;

  Color get _reactionColor => reactions.isNotEmpty
      ? ColorUtils.getServiceColor(reactions.first.service)
      : AppColors.areaBlue3;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 48),
      child: Column(
        children: [
          Container(
            width: 4,
            height: 20,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  _actionColor.withValues(alpha: 0.6),
                  _reactionColor.withValues(alpha: 0.6),
                ],
              ),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
                colors: [
                  _actionColor.withValues(alpha: 0.2),
                  _reactionColor.withValues(alpha: 0.2),
                ],
              ),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.areaBlue3.withValues(alpha: 0.3), width: 1),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.arrow_downward_rounded,
                  color: AppColors.areaBlue3.withValues(alpha: 0.8),
                  size: 20,
                ),
                const SizedBox(width: 8),
                Text(
                  AppLocalizations.of(context)!.then,
                  style: const TextStyle(
                    fontFamily: 'Montserrat',
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: AppColors.areaBlue3,
                    letterSpacing: 1.5,
                  ),
                ),
                const SizedBox(width: 8),
                Icon(
                  Icons.arrow_downward_rounded,
                  color: AppColors.areaBlue3.withValues(alpha: 0.8),
                  size: 20,
                ),
              ],
            ),
          ),
          Container(
            width: 4,
            height: 20,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  _actionColor.withValues(alpha: 0.6),
                  _reactionColor.withValues(alpha: 0.6),
                ],
              ),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
        ],
      ),
    );
  }
}
