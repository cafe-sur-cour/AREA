import 'package:area/core/constants/app_constants.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/models/reaction_models.dart';
import 'package:area/models/service_models.dart';
import 'package:area/models/reaction_with_delay_model.dart';
import 'package:area/core/constants/app_colors.dart';
import 'package:area/core/utils/color_utils.dart';
import 'package:area/core/notifiers/automation_builder_notifier.dart';
import 'package:area/widgets/common/app_bar/custom_app_bar.dart';
import 'package:area/widgets/common/buttons/primary_button.dart';
import 'package:area/widgets/common/buttons/secondary_button.dart';
import 'package:provider/provider.dart';
import 'package:flutter/material.dart';

class ReactionDetailsScreen extends StatefulWidget {
  final ReactionModel reaction;
  final ServiceModel service;

  const ReactionDetailsScreen({super.key, required this.reaction, required this.service});

  @override
  ReactionDetailsScreenState createState() => ReactionDetailsScreenState();
}

class ReactionDetailsScreenState extends State<ReactionDetailsScreen> {
  int _selectedDelayInSeconds = 0;

  Color _getServiceColor() {
    return ColorUtils.getReactionColor(widget.reaction, widget.service);
  }

  void _selectReaction(BuildContext context) {
    final automationBuilder = Provider.of<AutomationBuilderNotifier>(context, listen: false);

    automationBuilder.addReaction(
      ReactionWithDelayModel(
        reaction: widget.reaction,
        service: widget.service,
        delayInSeconds: _selectedDelayInSeconds,
      ),
    );

    Navigator.of(context).pushNamedAndRemoveUntil('/', (Route<dynamic> route) => false);
  }

  void _showDelayPicker() {
    int tempDays = _selectedDelayInSeconds ~/ 86400;
    int tempHours = (_selectedDelayInSeconds % 86400) ~/ 3600;
    int tempMinutes = (_selectedDelayInSeconds % 3600) ~/ 60;
    int tempSeconds = _selectedDelayInSeconds % 60;

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: Row(
                children: [
                  Icon(Icons.access_time, color: _getServiceColor()),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Set Execution Delay',
                      style: const TextStyle(
                        fontFamily: 'Montserrat',
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _buildDelayInput('Days', tempDays, (value) {
                      setDialogState(() => tempDays = value);
                    }),
                    const SizedBox(height: 16),
                    _buildDelayInput('Hours', tempHours, (value) {
                      setDialogState(() => tempHours = value);
                    }, max: 23),
                    const SizedBox(height: 16),
                    _buildDelayInput('Minutes', tempMinutes, (value) {
                      setDialogState(() => tempMinutes = value);
                    }, max: 59),
                    const SizedBox(height: 16),
                    _buildDelayInput('Seconds', tempSeconds, (value) {
                      setDialogState(() => tempSeconds = value);
                    }, max: 59),
                    const SizedBox(height: 20),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: _getServiceColor().withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: _getServiceColor().withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.info_outline, color: _getServiceColor(), size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Total delay: ${_formatTotalDelay(tempDays, tempHours, tempMinutes, tempSeconds)}',
                              style: TextStyle(
                                fontFamily: 'Montserrat',
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: _getServiceColor(),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                SecondaryButton(
                  text: AppLocalizations.of(this.context)!.cancel,
                  onPressed: () => Navigator.of(context).pop(),
                ),
                PrimaryButton(
                  text: AppLocalizations.of(this.context)!.set_delay,
                  onPressed: () {
                    setState(() {
                      _selectedDelayInSeconds = ReactionWithDelayModel.calculateDelayInSeconds(
                        days: tempDays,
                        hours: tempHours,
                        minutes: tempMinutes,
                        seconds: tempSeconds,
                      );
                    });
                    Navigator.of(context).pop();
                  },
                  backgroundColor: _getServiceColor(),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Widget _buildDelayInput(String label, int value, Function(int) onChanged, {int max = 999}) {
    return Row(
      children: [
        Expanded(
          flex: 2,
          child: Text(
            label,
            style: const TextStyle(
              fontFamily: 'Montserrat',
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        Expanded(
          flex: 3,
          child: Container(
            decoration: BoxDecoration(
              border: Border.all(color: _getServiceColor().withValues(alpha: 0.3)),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                IconButton(
                  onPressed: value > 0 ? () => onChanged(value - 1) : null,
                  icon: const Icon(Icons.remove),
                  iconSize: 20,
                ),
                Expanded(
                  child: Text(
                    value.toString(),
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontFamily: 'Montserrat',
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: value < max ? () => onChanged(value + 1) : null,
                  icon: const Icon(Icons.add),
                  iconSize: 20,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  String _formatTotalDelay(int days, int hours, int minutes, int seconds) {
    final totalSeconds = ReactionWithDelayModel.calculateDelayInSeconds(
      days: days,
      hours: hours,
      minutes: minutes,
      seconds: seconds,
    );

    if (totalSeconds == 0) return 'No delay (instant)';

    List<String> parts = [];
    if (days > 0) parts.add('${days}d');
    if (hours > 0) parts.add('${hours}h');
    if (minutes > 0) parts.add('${minutes}m');
    if (seconds > 0) parts.add('${seconds}s');

    return parts.join(' ');
  }

  String get _formattedDelay {
    if (_selectedDelayInSeconds == 0) return 'No delay';

    final days = _selectedDelayInSeconds ~/ 86400;
    final hours = (_selectedDelayInSeconds % 86400) ~/ 3600;
    final minutes = (_selectedDelayInSeconds % 3600) ~/ 60;
    final seconds = _selectedDelayInSeconds % 60;

    List<String> parts = [];
    if (days > 0) parts.add('${days}d');
    if (hours > 0) parts.add('${hours}h');
    if (minutes > 0) parts.add('${minutes}m');
    if (seconds > 0) parts.add('${seconds}s');

    return parts.isEmpty ? 'No delay' : parts.join(' ');
  }

  @override
  Widget build(BuildContext context) {
    final serviceColor = _getServiceColor();

    return Scaffold(
      appBar: CustomAppBar(title: widget.reaction.name, bgColor: serviceColor),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (widget.reaction.description.isNotEmpty) ...[
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
                        widget.reaction.description,
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
                  if (widget.reaction.configSchema?.fields != null &&
                      widget.reaction.configSchema!.fields.isNotEmpty) ...[
                    Text(
                      AppLocalizations.of(context)!.parameters,
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
                        children: widget.reaction.configSchema!.fields.map((field) {
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
                    const SizedBox(height: 24),
                  ],
                ],
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.schedule_rounded, color: serviceColor, size: 24),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Text(
                        'Execution Delay',
                        style: TextStyle(
                          fontFamily: 'Montserrat',
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: AppColors.areaBlack,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: _selectedDelayInSeconds > 0
                        ? serviceColor.withValues(alpha: 0.1)
                        : Colors.grey.withValues(alpha: 0.05),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: _selectedDelayInSeconds > 0
                          ? serviceColor.withValues(alpha: 0.3)
                          : Colors.grey.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _selectedDelayInSeconds > 0 ? 'Delay Set' : 'No Delay',
                              style: TextStyle(
                                fontFamily: 'Montserrat',
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: _selectedDelayInSeconds > 0
                                    ? serviceColor
                                    : AppColors.areaDarkGray,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _formattedDelay,
                              style: TextStyle(
                                fontFamily: 'Montserrat',
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: _selectedDelayInSeconds > 0
                                    ? serviceColor
                                    : AppColors.areaDarkGray,
                              ),
                            ),
                            if (_selectedDelayInSeconds > 0) ...[
                              const SizedBox(height: 4),
                              Text(
                                'This reaction will execute $_formattedDelay after the trigger',
                                style: const TextStyle(
                                  fontFamily: 'Montserrat',
                                  fontSize: 12,
                                  color: AppColors.areaDarkGray,
                                  fontStyle: FontStyle.italic,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                      PrimaryButton(
                        onPressed: _showDelayPicker,
                        text: _selectedDelayInSeconds > 0
                            ? AppLocalizations.of(context)!.edit
                            : AppLocalizations.of(context)!.set,
                        icon: _selectedDelayInSeconds > 0 ? Icons.edit : Icons.add,
                        iconSize: 18,
                        backgroundColor: serviceColor,
                        foregroundColor: Colors.white,
                        borderRadius: AppDimensions.borderRadiusXL,
                      ),
                    ],
                  ),
                ),
              ],
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
              text: AppLocalizations.of(context)!.choose_this_reaction,
              onPressed: () => _selectReaction(context),
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
