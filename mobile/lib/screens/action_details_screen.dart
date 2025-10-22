import 'package:area/widgets/common/app_bar/custom_app_bar.dart';
import 'package:area/widgets/common/buttons/primary_button.dart';
import 'package:flutter/material.dart';
import 'package:area/models/action_models.dart';
import 'package:area/models/service_models.dart';
import 'package:area/core/constants/app_colors.dart';
import 'package:area/core/utils/color_utils.dart';
import 'package:area/core/notifiers/automation_builder_notifier.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:provider/provider.dart';

class ActionDetailsScreen extends StatelessWidget {
  final ActionModel action;
  final ServiceModel service;

  const ActionDetailsScreen({super.key, required this.action, required this.service});

  Color _getServiceColor() {
    return ColorUtils.getActionColor(action, service);
  }

  void _selectAction(BuildContext context) {
    final automationBuilder = Provider.of<AutomationBuilderNotifier>(context, listen: false);

    automationBuilder.setAction(action, service);

    Navigator.of(context).pushNamedAndRemoveUntil('/', (Route<dynamic> route) => false);
  }

  @override
  Widget build(BuildContext context) {
    final serviceColor = _getServiceColor();
    return Scaffold(
      appBar: CustomAppBar(title: action.name, bgColor: serviceColor),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (action.description.isNotEmpty) ...[
                    Text(
                      AppLocalizations.of(context)!.description,
                      style: TextStyle(
                        fontFamily: 'Montserrat',
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppColors.areaBlack,
                      ),
                    ),

                    const SizedBox(height: 12),

                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.areaLightGray.withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: serviceColor.withValues(alpha: 0.2),
                          width: 1,
                        ),
                      ),
                      child: Text(
                        action.description,
                        style: const TextStyle(
                          fontFamily: 'Montserrat',
                          fontSize: 16,
                          color: AppColors.areaBlack,
                          height: 1.5,
                        ),
                      ),
                    ),

                    const SizedBox(height: 24),
                  ],
                  if (action.configSchema?.fields != null &&
                      action.configSchema!.fields.isNotEmpty) ...[
                    const Text(
                      'Parameters',
                      style: TextStyle(
                        fontFamily: 'Montserrat',
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppColors.areaBlack,
                      ),
                    ),

                    const SizedBox(height: 12),

                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.areaLightGray.withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: serviceColor.withValues(alpha: 0.2),
                          width: 1,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: action.configSchema!.fields.map((field) {
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Icon(Icons.settings, size: 16, color: serviceColor),

                                const SizedBox(width: 8),

                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        field.label,
                                        style: const TextStyle(
                                          fontFamily: 'Montserrat',
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                          color: AppColors.areaBlack,
                                        ),
                                      ),
                                      Text(
                                        '${field.type}${field.required ? ' (${AppLocalizations.of(context)!.required_lowercase})' : ''}',
                                        style: const TextStyle(
                                          fontFamily: 'Montserrat',
                                          fontSize: 14,
                                          color: AppColors.areaDarkGray,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.surface,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.1),
                  offset: const Offset(0, -2),
                  blurRadius: 8,
                ),
              ],
            ),
            child: PrimaryButton(
              text: AppLocalizations.of(context)!.choose_this_action,
              onPressed: () => _selectAction(context),
              backgroundColor: serviceColor,
              icon: Icons.check_circle_outline,
              iconSize: 24,
            ),
          ),
        ],
      ),
    );
  }
}
