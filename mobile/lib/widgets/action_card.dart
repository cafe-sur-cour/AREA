import 'package:flutter/material.dart';
import 'package:area/models/action_models.dart';
import 'package:area/core/constants/app_colors.dart';

class ActionCard extends StatelessWidget {
  final ActionModel action;
  final VoidCallback? onTap;

  const ActionCard({super.key, required this.action, this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AppColors.areaBlue3.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: action.iconUrl != null
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.network(
                              action.iconUrl!,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) {
                                return const Icon(
                                  Icons.flash_on,
                                  color: AppColors.areaBlue3,
                                  size: 24,
                                );
                              },
                            ),
                          )
                        : const Icon(Icons.flash_on, color: AppColors.areaBlue3, size: 24),
                  ),

                  const SizedBox(width: 12),

                  Expanded(
                    child: Text(
                      action.name,
                      style: const TextStyle(
                        fontFamily: 'Montserrat',
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColors.areaBlack,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const Icon(Icons.arrow_forward_ios, color: AppColors.areaDarkGray, size: 16),
                ],
              ),

              const SizedBox(height: 12),

              if (action.description.isNotEmpty)
                Text(
                  action.description,
                  style: const TextStyle(
                    fontFamily: 'Montserrat',
                    fontSize: 14,
                    color: AppColors.areaDarkGray,
                    height: 1.4,
                  ),
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),

              if (action.parameters != null && action.parameters!.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Row(
                    children: [
                      Icon(
                        Icons.settings,
                        size: 16,
                        color: AppColors.areaDarkGray.withValues(alpha: 0.7),
                      ),

                      const SizedBox(width: 4),

                      Text(
                        '${action.parameters!.length} parameter${action.parameters!.length == 1 ? '' : 's'}',
                        style: TextStyle(
                          fontFamily: 'Montserrat',
                          fontSize: 12,
                          color: AppColors.areaDarkGray.withValues(alpha: 0.7),
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
