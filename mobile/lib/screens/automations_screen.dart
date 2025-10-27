import 'package:area/core/constants/app_text_styles.dart';
import 'package:area/core/notifiers/backend_address_notifier.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/widgets/common/dialogs/confirm_dialog.dart';
import 'package:area/widgets/common/snackbars/app_snackbar.dart';
import 'package:area/widgets/common/state/empty_state.dart';
import 'package:area/widgets/common/state/error_state.dart';
import 'package:area/widgets/common/state/loading_state.dart';
import 'package:area/widgets/common/cards/status_badge.dart';
import 'package:flutter/material.dart';
import 'package:area/core/constants/app_constants.dart';
import 'package:area/models/automation_models.dart';
import 'package:area/services/api_mapping_action_reaction.dart';
import 'package:provider/provider.dart';

class AutomationsScreen extends StatefulWidget {
  const AutomationsScreen({super.key});

  @override
  AutomationsScreenState createState() => AutomationsScreenState();
}

class AutomationsScreenState extends State<AutomationsScreen> {
  List<AutomationModel> _automations = [];
  bool _isLoading = true;
  String? _errorMessage;
  bool _notConnected = false;

  @override
  void initState() {
    super.initState();
    _loadAutomations();
  }

  Future<void> _loadAutomations() async {
    try {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });

      final backendAddressNotifier = Provider.of<BackendAddressNotifier>(
        context,
        listen: false,
      );

      if (backendAddressNotifier.backendAddress == null) {
        setState(() {
          _errorMessage = AppLocalizations.of(context)!.empty_backend_server_address;
        });
        return;
      }

      final automations = await ApiMappingActionReaction.getAutomations(
        backendAddressNotifier.backendAddress!,
      );

      setState(() {
        _automations = automations;
        _isLoading = false;
        _notConnected = false;
      });
    } catch (e) {
      if (e.toString().contains("JWT token is missing") && mounted) {
        setState(() {
          _notConnected = true;
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = e.toString().replaceAll("Exception: ", "");
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _deleteAutomation(int automationId) async {
    try {
      final backendAddressNotifier = Provider.of<BackendAddressNotifier>(
        context,
        listen: false,
      );

      if (backendAddressNotifier.backendAddress == null) {
        showErrorSnackbar(context, AppLocalizations.of(context)!.empty_backend_server_address);
        return;
      }

      await ApiMappingActionReaction.deleteAutomation(
        backendAddressNotifier.backendAddress!,
        automationId,
      );

      setState(() {
        _automations.removeWhere((automation) => automation.id == automationId);
      });
    } catch (e) {
      if (mounted) {
        showErrorSnackbar(
          context,
          AppLocalizations.of(context)!.error_deleting_automation(e.toString()),
        );
      }
    }
  }

  void _toggleAutomationStatus(AutomationModel automation) async {
    final backendAddressNotifier = Provider.of<BackendAddressNotifier>(context, listen: false);

    if (backendAddressNotifier.backendAddress == null) {
      showErrorSnackbar(context, AppLocalizations.of(context)!.empty_backend_server_address);
      return;
    }

    late String updatedAt;

    try {
      if (automation.isActive) {
        updatedAt = await ApiMappingActionReaction.deactivateAutomation(
          backendAddressNotifier.backendAddress!,
          automation.id,
        );
      } else {
        updatedAt = await ApiMappingActionReaction.activateAutomation(
          backendAddressNotifier.backendAddress!,
          automation.id,
        );
      }
    } catch (e) {
      if (mounted) {
        showErrorSnackbar(context, e.toString());
      }
      return;
    }

    setState(() {
      final index = _automations.indexWhere((a) => a.id == automation.id);
      if (index != -1) {
        _automations[index] = automation.copyWith(
          isActive: !automation.isActive,
          updatedAt: updatedAt,
        );
      }
    });
  }

  void _showDeleteConfirmation(AutomationModel automation) async {
    final confirmed = await showConfirmDialog(
      context: context,
      title: AppLocalizations.of(context)!.delete_automation,
      message: AppLocalizations.of(context)!.delete_automation_confirm(automation.name),
      confirmText: AppLocalizations.of(context)!.delete,
      cancelText: AppLocalizations.of(context)!.cancel,
    );

    if (confirmed) {
      _deleteAutomation(automation.id);
    }
  }

  Widget _buildAutomationCard(AutomationModel automation) {
    return Card(
      margin: const EdgeInsets.only(bottom: AppDimensions.paddingMD),
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(AppDimensions.paddingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                StatusBadge(
                  text: automation.isActive
                      ? AppLocalizations.of(context)!.active
                      : AppLocalizations.of(context)!.inactive,
                  color: automation.isActive ? Colors.green : Colors.red,
                ),
                const Spacer(),
                IconButton(
                  onPressed: () => _toggleAutomationStatus(automation),
                  icon: Icon(automation.isActive ? Icons.pause : Icons.play_arrow),
                  color: automation.isActive ? Colors.orange : Colors.green,
                  tooltip: automation.isActive
                      ? AppLocalizations.of(context)!.deactivate_automation
                      : AppLocalizations.of(context)!.activate_automation,
                ),
                IconButton(
                  onPressed: () => _showDeleteConfirmation(automation),
                  icon: const Icon(Icons.delete_outline),
                  color: Colors.red,
                  tooltip: AppLocalizations.of(context)!.delete_automation_tooltip,
                ),
              ],
            ),

            const SizedBox(height: AppDimensions.paddingSM),

            Row(
              children: [
                Expanded(
                  child: Text(
                    automation.name,
                    style: AppTextStyles.headlineSmall.copyWith(fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),

            const SizedBox(height: AppDimensions.paddingSM),

            Text(
              automation.description,
              style: AppTextStyles.bodyMedium.copyWith(color: Colors.grey[600]),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),

            const SizedBox(height: AppDimensions.paddingSM),

            Padding(
              padding: const EdgeInsets.fromLTRB(0, 8, 8, 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Column(
                    mainAxisAlignment: MainAxisAlignment.start,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        AppLocalizations.of(context)!.action,
                        style: AppTextStyles.bodyMedium,
                      ),
                      Text(automation.action.type, style: AppTextStyles.bodySmall),
                    ],
                  ),
                  const Spacer(),
                  Column(
                    mainAxisAlignment: MainAxisAlignment.start,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        automation.reactions.length != 1
                            ? AppLocalizations.of(context)!.reactions
                            : AppLocalizations.of(context)!.reaction,
                        style: AppTextStyles.bodyMedium,
                      ),
                      for (final reaction in automation.reactions) ...[
                        Text(reaction.type, style: AppTextStyles.bodySmall),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: _isLoading
            ? const LoadingState()
            : _errorMessage != null
            ? ErrorState(
                title: AppLocalizations.of(context)!.error_loading_automations,
                message: _errorMessage!,
                onRetry: _loadAutomations,
                retryButtonText: AppLocalizations.of(context)!.retry,
              )
            : _automations.isEmpty
            ? EmptyState(
                title: AppLocalizations.of(context)!.no_automations_yet,
                message: _notConnected
                    ? AppLocalizations.of(context)!.connect_to_create
                    : AppLocalizations.of(context)!.create_first_automation,
                icon: Icons.auto_awesome_outlined,
              )
            : RefreshIndicator(
                onRefresh: _loadAutomations,
                child: ListView(
                  children: [
                    const SizedBox(height: 50),
                    Text(
                      AppLocalizations.of(context)!.my_areas,
                      style: const TextStyle(
                        fontFamily: 'Montserrat',
                        fontWeight: FontWeight.w700,
                        fontSize: 50,
                      ),
                      textAlign: TextAlign.center,
                    ),

                    const SizedBox(height: 50),

                    for (int index = 0; index < _automations.length; index++) ...[
                      _buildAutomationCard(_automations[index]),
                    ],
                  ],
                ),
              ),
      ),
    );
  }
}
