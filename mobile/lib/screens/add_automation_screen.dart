import 'package:area/core/constants/app_colors.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/services/secure_storage.dart';
import 'package:area/models/action_models.dart';
import 'package:area/models/service_models.dart';
import 'package:area/models/reaction_with_delay_model.dart';
import 'package:area/widgets/automation/automation_action_card.dart';
import 'package:area/widgets/automation/automation_connector.dart';
import 'package:area/widgets/automation/reactions_section.dart';
import 'package:area/widgets/automation/automation_buttons.dart';
import 'package:area/widgets/automation/delay_picker_dialog.dart';
import 'package:flutter/material.dart';

class AddAutomationScreen extends StatefulWidget {
  final ActionModel? selectedAction;
  final ServiceModel? selectedService;
  final List<ReactionWithDelayModel>? selectedReactionsWithDelay;

  const AddAutomationScreen({
    super.key,
    this.selectedAction,
    this.selectedService,
    this.selectedReactionsWithDelay,
  });

  @override
  AddAutomationScreenState createState() => AddAutomationScreenState();
}

class AddAutomationScreenState extends State<AddAutomationScreen> {
  ActionModel? _selectedAction;
  ServiceModel? _selectedService;
  List<ReactionWithDelayModel> _selectedReactionsWithDelay = [];

  @override
  void initState() {
    super.initState();
    _selectedAction = widget.selectedAction;
    _selectedService = widget.selectedService;
    _selectedReactionsWithDelay = widget.selectedReactionsWithDelay ?? [];
  }

  @override
  void didUpdateWidget(AddAutomationScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.selectedAction != oldWidget.selectedAction ||
        widget.selectedService != oldWidget.selectedService ||
        widget.selectedReactionsWithDelay != oldWidget.selectedReactionsWithDelay) {
      setState(() {
        _selectedAction = widget.selectedAction;
        _selectedService = widget.selectedService;
        _selectedReactionsWithDelay = widget.selectedReactionsWithDelay ?? [];
      });
    }
  }

  void _addAction() async {
    final jwt = await getJwt();

    if (jwt == null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            AppLocalizations.of(context)!.not_connected,
            style: TextStyle(color: AppColors.areaLightGray, fontSize: 16),
          ),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    if (mounted) {
      Navigator.pushNamed(context, "/action-services");
    }
  }

  void _clearAction() {
    setState(() {
      _selectedAction = null;
      _selectedService = null;
    });
  }

  void _addReaction() async {
    final jwt = await getJwt();

    if (jwt == null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            AppLocalizations.of(context)!.not_connected,
            style: TextStyle(color: AppColors.areaLightGray, fontSize: 16),
          ),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    if (mounted) {
      Navigator.pushNamed(context, "/reaction-services");
    }
  }

  void _clearReaction(int index) {
    setState(() {
      if (index < _selectedReactionsWithDelay.length) {
        _selectedReactionsWithDelay.removeAt(index);
      }
    });
  }

  void _clearAllReactions() {
    setState(() {
      _selectedReactionsWithDelay.clear();
    });
  }

  void _showDelayPicker(int index) {
    if (index >= _selectedReactionsWithDelay.length) return;

    final currentReaction = _selectedReactionsWithDelay[index];

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return DelayPickerDialog(
          reactionWithDelay: currentReaction,
          onDelaySet: (newDelayInSeconds) {
            setState(() {
              _selectedReactionsWithDelay[index] = _selectedReactionsWithDelay[index].copyWith(
                delayInSeconds: newDelayInSeconds,
              );
            });
          },
        );
      },
    );
  }

  void _createAutomation() {
    if (_selectedAction == null ||
        _selectedService == null ||
        _selectedReactionsWithDelay.isEmpty) {
      return;
    }

    final reactionDetails = _selectedReactionsWithDelay
        .map((r) => '${r.reaction.name} (${r.shortFormattedDelay})')
        .join(', ');

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.white),

            const SizedBox(width: 12),

            Expanded(
              child: Text(
                'Automation "${_selectedAction!.name} → $reactionDetails" created successfully!',
                style: const TextStyle(fontFamily: 'Montserrat', fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
        backgroundColor: Colors.green[600],
        duration: const Duration(seconds: 3),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );

    setState(() {
      _selectedAction = null;
      _selectedService = null;
      _selectedReactionsWithDelay.clear();
    });

    // TODO: Implement actual API call to create automation with delays
    // ApiService.createAutomationWithDelays(action, service, reactionsWithDelay);
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [

            const SizedBox(height: 30),

            SizedBox(
              height: (_selectedAction != null || _selectedReactionsWithDelay.isNotEmpty)
                  ? 100
                  : 160,
              child: Center(
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    boxShadow:
                        (_selectedAction != null && _selectedReactionsWithDelay.isNotEmpty)
                        ? [
                            BoxShadow(
                              color: AppColors.areaBlue3.withValues(alpha: 0.3),
                              blurRadius: 20,
                              spreadRadius: 2,
                            ),
                          ]
                        : null,
                  ),
                  child: Image(
                    image: const AssetImage('assets/web-app-manifest-512x512.png'),
                    width: (_selectedAction != null || _selectedReactionsWithDelay.isNotEmpty)
                        ? 80
                        : 120,
                    height: (_selectedAction != null || _selectedReactionsWithDelay.isNotEmpty)
                        ? 80
                        : 120,
                  ),
                ),
              ),
            ),
            if (_selectedAction != null && _selectedService != null)
              AutomationActionCard(
                action: _selectedAction!,
                service: _selectedService!,
                onClear: _clearAction,
              ),
            if (_selectedAction != null && _selectedReactionsWithDelay.isNotEmpty)
              AutomationConnector(
                actionService: _selectedService,
                reactions: _selectedReactionsWithDelay,
              ),
            ReactionsSection(
              reactions: _selectedReactionsWithDelay,
              onClearReaction: _clearReaction,
              onDelayEdit: _showDelayPicker,
            ),
            AutomationButtons(
              selectedService: _selectedService,
              hasAction: _selectedAction != null,
              hasReactions: _selectedReactionsWithDelay.isNotEmpty,
              reactionsCount: _selectedReactionsWithDelay.length,
              onAddAction: _addAction,
              onAddReaction: _addReaction,
              onClearAllReactions: _clearAllReactions,
              onCreateAutomation: _createAutomation,
            ),
          ],
        ),
      ),
    );
  }
}
