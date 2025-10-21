import 'package:area/core/constants/app_colors.dart';
import 'package:area/models/reaction_with_delay_model.dart';
import 'package:area/widgets/automation/automation_reaction_card.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:flutter/material.dart';

class ReactionsSection extends StatelessWidget {
  final List<ReactionWithDelayModel> reactions;
  final Function(int) onClearReaction;
  final Function(int) onDelayEdit;

  const ReactionsSection({
    super.key,
    required this.reactions,
    required this.onClearReaction,
    required this.onDelayEdit,
  });

  @override
  Widget build(BuildContext context) {
    if (reactions.isEmpty) {
      return Container();
    }

    return Column(
      children: [
        for (int i = 0; i < reactions.length; i++) ...[
          AutomationReactionCard(
            reactionWithDelay: reactions[i],
            index: i,
            onClear: () => onClearReaction(i),
            onDelayEdit: () => onDelayEdit(i),
          ),
          if (i < reactions.length - 1)
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 60),
              child: Column(
                children: [
                  Container(
                    width: 2,
                    height: 20,
                    decoration: BoxDecoration(
                      color: AppColors.areaBlue3.withValues(alpha: 0.4),
                      borderRadius: BorderRadius.circular(1),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.areaBlue3.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: AppColors.areaBlue3.withValues(alpha: 0.3),
                        width: 1,
                      ),
                    ),
                    child: Text(
                      AppLocalizations.of(context)!.and,
                      style: TextStyle(
                        fontFamily: 'Montserrat',
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: AppColors.areaBlue3,
                        letterSpacing: 1.5,
                      ),
                    ),
                  ),
                  Container(
                    width: 2,
                    height: 20,
                    decoration: BoxDecoration(
                      color: AppColors.areaBlue3.withValues(alpha: 0.4),
                      borderRadius: BorderRadius.circular(1),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ],
    );
  }
}
