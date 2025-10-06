import 'package:area/core/constants/app_colors.dart';
import 'package:area/core/utils/color_utils.dart';
import 'package:area/models/reaction_with_delay_model.dart';
import 'package:flutter/material.dart';

class AutomationReactionCard extends StatelessWidget {
  final ReactionWithDelayModel reactionWithDelay;
  final int index;
  final VoidCallback onClear;
  final VoidCallback onDelayEdit;

  const AutomationReactionCard({
    super.key,
    required this.reactionWithDelay,
    required this.index,
    required this.onClear,
    required this.onDelayEdit,
  });

  Color get _serviceColor => ColorUtils.getServiceColor(reactionWithDelay.service);

  @override
  Widget build(BuildContext context) {
    final reaction = reactionWithDelay.reaction;
    final reactionService = reactionWithDelay.service;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      child: Material(
        elevation: 6,
        shadowColor: _serviceColor.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                _serviceColor.withValues(alpha: 0.15),
                _serviceColor.withValues(alpha: 0.05),
                Colors.white.withValues(alpha: 0.8),
              ],
            ),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: _serviceColor.withValues(alpha: 0.4), width: 2),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [_serviceColor.withValues(alpha: 0.8), _serviceColor],
                      ),
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: _serviceColor.withValues(alpha: 0.3),
                          offset: const Offset(0, 4),
                          blurRadius: 8,
                        ),
                      ],
                    ),
                    child: Stack(
                      children: [
                        const Center(
                          child: Icon(Icons.replay_rounded, color: Colors.white, size: 24),
                        ),
                        Positioned(
                          top: 2,
                          right: 2,
                          child: Container(
                            width: 16,
                            height: 16,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Center(
                              child: Text(
                                '${index + 1}',
                                style: TextStyle(
                                  fontFamily: 'Montserrat',
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  color: _serviceColor,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(width: 16),

                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: _serviceColor.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            '⚡ REACTION ${index + 1}',
                            style: TextStyle(
                              fontFamily: 'Montserrat',
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: _serviceColor,
                              letterSpacing: 1.2,
                            ),
                          ),
                        ),

                        const SizedBox(height: 6),

                        Text(
                          reaction.name,
                          style: const TextStyle(
                            fontFamily: 'Montserrat',
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: AppColors.areaBlack,
                            height: 1.2,
                          ),
                        ),

                        const SizedBox(height: 2),

                        Row(
                          children: [
                            Container(
                              width: 16,
                              height: 16,
                              decoration: BoxDecoration(
                                color: _serviceColor.withValues(alpha: 0.3),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: reactionService.icon != null
                                  ? ClipRRect(
                                      borderRadius: BorderRadius.circular(4),
                                      child: Image.network(
                                        reactionService.icon!,
                                        fit: BoxFit.cover,
                                        errorBuilder: (context, error, stackTrace) {
                                          return Icon(
                                            Icons.web,
                                            color: _serviceColor,
                                            size: 12,
                                          );
                                        },
                                      ),
                                    )
                                  : Icon(Icons.web, color: _serviceColor, size: 12),
                            ),

                            const SizedBox(width: 6),

                            Text(
                              reactionService.name,
                              style: TextStyle(
                                fontFamily: 'Montserrat',
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: _serviceColor.withValues(alpha: 0.8),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Container(
                    decoration: BoxDecoration(
                      color: AppColors.areaDarkGray.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: IconButton(
                      onPressed: onClear,
                      icon: const Icon(Icons.close_rounded, color: AppColors.areaDarkGray),
                      tooltip: 'Remove reaction ${index + 1}',
                      iconSize: 18,
                    ),
                  ),
                ],
              ),
              if (reaction.description.isNotEmpty) ...[
                const SizedBox(height: 12),

                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.7),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: _serviceColor.withValues(alpha: 0.2)),
                  ),
                  child: Text(
                    reaction.description,
                    style: const TextStyle(
                      fontFamily: 'Montserrat',
                      fontSize: 12,
                      color: AppColors.areaDarkGray,
                      height: 1.4,
                      fontStyle: FontStyle.italic,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],

              const SizedBox(height: 16),

              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: reactionWithDelay.delayInSeconds > 0
                      ? _serviceColor.withValues(alpha: 0.1)
                      : AppColors.areaDarkGray.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: reactionWithDelay.delayInSeconds > 0
                        ? _serviceColor.withValues(alpha: 0.3)
                        : AppColors.areaDarkGray.withValues(alpha: 0.2),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.schedule_rounded,
                      color: reactionWithDelay.delayInSeconds > 0
                          ? _serviceColor
                          : AppColors.areaDarkGray,
                      size: 20,
                    ),

                    const SizedBox(width: 8),

                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Execution Delay',
                            style: TextStyle(
                              fontFamily: 'Montserrat',
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: reactionWithDelay.delayInSeconds > 0
                                  ? _serviceColor
                                  : AppColors.areaDarkGray,
                            ),
                          ),
                          Text(
                            reactionWithDelay.formattedDelay,
                            style: TextStyle(
                              fontFamily: 'Montserrat',
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: reactionWithDelay.delayInSeconds > 0
                                  ? _serviceColor
                                  : AppColors.areaDarkGray,
                            ),
                          ),
                        ],
                      ),
                    ),
                    TextButton.icon(
                      onPressed: onDelayEdit,
                      icon: Icon(
                        reactionWithDelay.delayInSeconds > 0 ? Icons.edit : Icons.add,
                        size: 16,
                      ),
                      label: Text(
                        reactionWithDelay.delayInSeconds > 0 ? 'Edit' : 'Set',
                        style: const TextStyle(
                          fontFamily: 'Montserrat',
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      style: TextButton.styleFrom(
                        foregroundColor: _serviceColor,
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
