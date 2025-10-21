import 'package:area/core/constants/app_colors.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/services/secure_storage.dart';
import 'package:area/widgets/automation/automation_action_card.dart';
import 'package:area/widgets/automation/automation_connector.dart';
import 'package:area/widgets/automation/reactions_section.dart';
import 'package:area/widgets/automation/automation_buttons.dart';
import 'package:area/widgets/automation/delay_picker_dialog.dart';
import 'package:area/core/notifiers/automation_builder_notifier.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class AddAutomationScreen extends StatefulWidget {
  const AddAutomationScreen({super.key});

  @override
  State<AddAutomationScreen> createState() => _AddAutomationScreenState();
}

class _AddAutomationScreenState extends State<AddAutomationScreen> {
  Future<void> _addAction() async {
    final jwt = await getJwt();

    if (jwt == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              AppLocalizations.of(context)!.not_connected,
              style: TextStyle(color: AppColors.areaLightGray, fontSize: 16),
            ),
            backgroundColor: AppColors.error,
          ),
        );
      }
      return;
    }

    if (mounted) {
      Navigator.pushNamed(context, "/action-services");
    }
  }

  void _clearAction() {
    final automationBuilder = Provider.of<AutomationBuilderNotifier>(context, listen: false);
    automationBuilder.clearAction();
  }

  Future<void> _addReaction() async {
    final jwt = await getJwt();

    if (jwt == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              AppLocalizations.of(context)!.not_connected,
              style: TextStyle(color: AppColors.areaLightGray, fontSize: 16),
            ),
            backgroundColor: AppColors.error,
          ),
        );
      }
      return;
    }

    if (mounted) {
      Navigator.pushNamed(context, '/reaction-services');
    }
  }

  void _clearReaction(int index) {
    final automationBuilder = Provider.of<AutomationBuilderNotifier>(context, listen: false);
    automationBuilder.removeReaction(index);
  }

  void _clearAllReactions() {
    final automationBuilder = Provider.of<AutomationBuilderNotifier>(context, listen: false);
    automationBuilder.clearReactions();
  }

  void _showDelayPicker(int index) {
    final automationBuilder = Provider.of<AutomationBuilderNotifier>(context, listen: false);
    final reactions = automationBuilder.selectedReactionsWithDelay;

    if (index >= reactions.length) return;

    final currentReaction = reactions[index];

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return DelayPickerDialog(
          reactionWithDelay: currentReaction,
          onDelaySet: (newDelayInSeconds) {
            automationBuilder.removeReaction(index);
            automationBuilder.addReaction(
              currentReaction.copyWith(delayInSeconds: newDelayInSeconds),
            );
          },
        );
      },
    );
  }

  void _createAutomation() async {
    final automationBuilder = Provider.of<AutomationBuilderNotifier>(context, listen: false);

    if (!automationBuilder.hasAction || !automationBuilder.hasReactions) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            AppLocalizations.of(context)!.please_add_action_and_reaction,
            style: TextStyle(color: AppColors.areaLightGray, fontSize: 16),
          ),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    if (mounted) {
      Navigator.pushNamed(context, '/automation-configuration');
    }
  }

  @override
  Widget build(BuildContext context) {
    final automationBuilder = Provider.of<AutomationBuilderNotifier>(context);
    final selectedAction = automationBuilder.selectedAction;
    final selectedService = automationBuilder.selectedService;
    final selectedReactionsWithDelay = automationBuilder.selectedReactionsWithDelay;

    return SingleChildScrollView(
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const SizedBox(height: 30),

            SizedBox(
              height: (selectedAction != null || selectedReactionsWithDelay.isNotEmpty)
                  ? 100
                  : 160,
              child: Center(
                child: Image(
                  image: const AssetImage('assets/web-app-manifest-512x512.png'),
                  width: (selectedAction != null || selectedReactionsWithDelay.isNotEmpty)
                      ? 80
                      : 120,
                  height: (selectedAction != null || selectedReactionsWithDelay.isNotEmpty)
                      ? 80
                      : 120,
                ),
              ),
            ),
            if (selectedAction != null && selectedService != null)
              AutomationActionCard(
                action: selectedAction,
                service: selectedService,
                onClear: () => _clearAction(),
              ),
            if (selectedAction != null && selectedReactionsWithDelay.isNotEmpty)
              AutomationConnector(
                actionService: selectedService,
                reactions: selectedReactionsWithDelay,
              ),
            ReactionsSection(
              reactions: selectedReactionsWithDelay,
              onClearReaction: (index) => _clearReaction(index),
              onDelayEdit: (index) => _showDelayPicker(index),
            ),
            AutomationButtons(
              selectedService: selectedService,
              hasAction: selectedAction != null,
              hasReactions: selectedReactionsWithDelay.isNotEmpty,
              reactionsCount: selectedReactionsWithDelay.length,
              onAddAction: () => _addAction(),
              onAddReaction: () => _addReaction(),
              onClearAllReactions: () => _clearAllReactions(),
              onCreateAutomation: () => _createAutomation(),
            ),
          ],
        ),
      ),
    );
  }
}
