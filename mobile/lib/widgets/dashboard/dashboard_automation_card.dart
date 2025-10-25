import 'package:area/l10n/app_localizations.dart';
import 'package:area/models/automation_models.dart';
import 'package:flutter/material.dart';

class DashboardAutomationCard extends StatelessWidget {
  final AutomationModel automation;

  const DashboardAutomationCard({super.key, required this.automation});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  automation.action.type.toLowerCase().contains('github')
                      ? Icons.code
                      : Icons.bolt,
                  size: 20,
                ),

                const SizedBox(width: 12),

                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        automation.name,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),

                      const SizedBox(height: 4),

                      Text(
                        automation.description,
                        style: theme.textTheme.bodySmall?.copyWith(color: Colors.black),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: automation.isActive
                        ? Colors.green.withAlpha(51)
                        : Colors.red.withAlpha(51),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    automation.isActive
                        ? AppLocalizations.of(context)!.active
                        : AppLocalizations.of(context)!.inactive,
                    style: theme.textTheme.bodySmall?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: automation.isActive ? Colors.green : Colors.red,
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            Text(
              '${AppLocalizations.of(context)!.trigger_colon(automation.action.type)} ${automation.reactions.isNotEmpty ? '→ ${automation.reactions.map((r) => r.type).join(', ')}' : ''}',
              style: theme.textTheme.bodySmall?.copyWith(color: Colors.black),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
