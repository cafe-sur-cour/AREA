import 'package:area/core/constants/app_colors.dart';
import 'package:area/core/utils/color_utils.dart';
import 'package:area/models/action_models.dart';
import 'package:area/models/service_models.dart';
import 'package:flutter/material.dart';

class AutomationActionCard extends StatelessWidget {
  final ActionModel action;
  final ServiceModel service;
  final VoidCallback onClear;

  const AutomationActionCard({
    super.key,
    required this.action,
    required this.service,
    required this.onClear,
  });

  Color get _serviceColor => ColorUtils.getServiceColor(service);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      child: Material(
        elevation: 8,
        shadowColor: _serviceColor.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.all(24),
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
                    width: 48,
                    height: 48,
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
                    child: const Icon(Icons.flash_on, color: Colors.white, size: 28),
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
                            '🎯 TRIGGER',
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
                          action.name,
                          style: const TextStyle(
                            fontFamily: 'Montserrat',
                            fontSize: 18,
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
                              child: service.icon != null
                                  ? ClipRRect(
                                      borderRadius: BorderRadius.circular(4),
                                      child: Image.network(
                                        service.icon!,
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
                              service.name,
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
                      tooltip: 'Remove action',
                      iconSize: 20,
                    ),
                  ),
                ],
              ),
              if (action.description.isNotEmpty) ...[
                const SizedBox(height: 16),

                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.7),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: _serviceColor.withValues(alpha: 0.2)),
                  ),
                  child: Text(
                    action.description,
                    style: const TextStyle(
                      fontFamily: 'Montserrat',
                      fontSize: 13,
                      color: AppColors.areaDarkGray,
                      height: 1.4,
                      fontStyle: FontStyle.italic,
                    ),
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
