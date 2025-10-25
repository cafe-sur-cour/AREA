import 'package:area/core/constants/app_colors.dart';
import 'package:area/models/service_models.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:flutter/material.dart';

class AutomationButtons extends StatelessWidget {
  final ServiceModel? selectedService;
  final bool hasAction;
  final bool hasReactions;
  final int reactionsCount;
  final VoidCallback onAddAction;
  final VoidCallback onAddReaction;
  final VoidCallback onClearAllReactions;
  final VoidCallback onCreateAutomation;

  const AutomationButtons({
    super.key,
    required this.selectedService,
    required this.hasAction,
    required this.hasReactions,
    required this.reactionsCount,
    required this.onAddAction,
    required this.onAddReaction,
    required this.onClearAllReactions,
    required this.onCreateAutomation,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const SizedBox(height: 30),
        Wrap(
          direction: Axis.vertical,
          spacing: 24,
          children: [
            ElevatedButton(
              onPressed: onAddAction,
              style: ElevatedButton.styleFrom(
                backgroundColor: hasAction ? AppColors.areaBlue3 : AppColors.areaBlue1,
                padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 40),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
              ),
              child: ConstrainedBox(
                constraints: const BoxConstraints(minWidth: 200, maxWidth: 300),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Flexible(
                      child: Text(
                        AppLocalizations.of(context)!.action_label,
                        style: const TextStyle(
                          fontFamily: 'Montserrat',
                          color: AppColors.areaLightGray,
                          fontWeight: FontWeight.w700,
                          fontSize: 24.0,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Icon(
                      hasAction ? Icons.edit : Icons.add,
                      color: AppColors.areaLightGray,
                      size: 28,
                    ),
                  ],
                ),
              ),
            ),
            ElevatedButton(
              onPressed: hasAction ? onAddReaction : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: hasAction
                    ? (hasReactions ? AppColors.areaBlue3 : AppColors.areaBlue1)
                    : AppColors.areaDarkGray,
                padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 40),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
              ),
              child: ConstrainedBox(
                constraints: const BoxConstraints(minWidth: 200, maxWidth: 300),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Flexible(
                      child: Text(
                        AppLocalizations.of(context)!.reaction_label,
                        style: const TextStyle(
                          fontFamily: 'Montserrat',
                          color: AppColors.areaLightGray,
                          fontWeight: FontWeight.w700,
                          fontSize: 22.0,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Icon(
                      hasAction ? Icons.add : Icons.lock,
                      color: hasAction
                          ? AppColors.areaLightGray
                          : AppColors.areaLightGray.withValues(alpha: 0.5),
                      size: 28,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        if (hasReactions) ...[
          const SizedBox(height: 24),
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 24),
            child: ElevatedButton(
              onPressed: onClearAllReactions,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.areaDarkGray.withValues(alpha: 0.1),
                foregroundColor: AppColors.areaDarkGray,
                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 24),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                elevation: 0,
                side: BorderSide(color: AppColors.areaDarkGray.withValues(alpha: 0.3)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.clear_all_rounded, size: 20),
                  const SizedBox(width: 8),
                  Text(
                    AppLocalizations.of(context)!.clear_all_reactions(reactionsCount),
                    style: const TextStyle(
                      fontFamily: 'Montserrat',
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
        if (hasAction && hasReactions) ...[
          const SizedBox(height: 24),
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 24),
            child: ElevatedButton(
              onPressed: onCreateAutomation,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.areaBlue3,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 32),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                elevation: 8,
                shadowColor: AppColors.areaBlue3.withValues(alpha: 0.4),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Icon(Icons.rocket_launch_rounded, size: 24),
                  ),
                  const SizedBox(width: 16),
                  Text(
                    AppLocalizations.of(context)!.create_automation,
                    style: const TextStyle(
                      fontFamily: 'Montserrat',
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
        const SizedBox(height: 50),
      ],
    );
  }
}
