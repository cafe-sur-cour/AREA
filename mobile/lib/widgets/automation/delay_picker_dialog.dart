import 'package:area/core/constants/app_colors.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/models/reaction_with_delay_model.dart';
import 'package:flutter/material.dart';

class DelayPickerDialog extends StatefulWidget {
  final ReactionWithDelayModel reactionWithDelay;
  final Function(int delayInSeconds) onDelaySet;

  const DelayPickerDialog({
    super.key,
    required this.reactionWithDelay,
    required this.onDelaySet,
  });

  @override
  DelayPickerDialogState createState() => DelayPickerDialogState();
}

class DelayPickerDialogState extends State<DelayPickerDialog> {
  late int _tempDays;
  late int _tempHours;
  late int _tempMinutes;
  late int _tempSeconds;

  @override
  void initState() {
    super.initState();
    _tempDays = widget.reactionWithDelay.days;
    _tempHours = widget.reactionWithDelay.hours;
    _tempMinutes = widget.reactionWithDelay.minutes;
    _tempSeconds = widget.reactionWithDelay.seconds;
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
              border: Border.all(color: AppColors.areaBlue3.withValues(alpha: 0.3)),
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

    if (totalSeconds == 0) return AppLocalizations.of(context)!.no_delay;

    List<String> parts = [];
    if (days > 0) parts.add('${days}d');
    if (hours > 0) parts.add('${hours}h');
    if (minutes > 0) parts.add('${minutes}m');
    if (seconds > 0) parts.add('${seconds}s');

    return parts.join(' ');
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Row(
        children: [
          Icon(Icons.access_time, color: AppColors.areaBlue3),

          const SizedBox(width: 12),

          Expanded(
            child: Text(
              AppLocalizations.of(
                context,
              )!.set_delay_for(widget.reactionWithDelay.reaction.name),
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
            _buildDelayInput(AppLocalizations.of(context)!.days, _tempDays, (value) {
              setState(() => _tempDays = value);
            }),

            const SizedBox(height: 16),

            _buildDelayInput(AppLocalizations.of(context)!.hours, _tempHours, (value) {
              setState(() => _tempHours = value);
            }, max: 23),

            const SizedBox(height: 16),

            _buildDelayInput(AppLocalizations.of(context)!.minutes, _tempMinutes, (value) {
              setState(() => _tempMinutes = value);
            }, max: 59),

            const SizedBox(height: 16),

            _buildDelayInput(AppLocalizations.of(context)!.seconds, _tempSeconds, (value) {
              setState(() => _tempSeconds = value);
            }, max: 59),

            const SizedBox(height: 20),

            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.areaBlue3.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.areaBlue3.withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  Icon(Icons.info_outline, color: AppColors.areaBlue3, size: 20),

                  const SizedBox(width: 8),

                  Expanded(
                    child: Text(
                      AppLocalizations.of(context)!.total_delay(
                        _formatTotalDelay(_tempDays, _tempHours, _tempMinutes, _tempSeconds),
                      ),
                      style: TextStyle(
                        fontFamily: 'Montserrat',
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppColors.areaBlue3,
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
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: Text(AppLocalizations.of(context)!.cancel),
        ),
        ElevatedButton(
          onPressed: () {
            final newDelayInSeconds = ReactionWithDelayModel.calculateDelayInSeconds(
              days: _tempDays,
              hours: _tempHours,
              minutes: _tempMinutes,
              seconds: _tempSeconds,
            );

            widget.onDelaySet(newDelayInSeconds);
            Navigator.of(context).pop();
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.areaBlue3,
            foregroundColor: Colors.white,
          ),
          child: Text(AppLocalizations.of(context)!.set_delay),
        ),
      ],
    );
  }
}
