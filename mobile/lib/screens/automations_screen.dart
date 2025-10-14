import 'package:area/core/constants/app_colors.dart';
import 'package:area/core/constants/app_text_styles.dart';
import 'package:area/core/notifiers/backend_address_notifier.dart';
import 'package:area/l10n/app_localizations.dart';
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
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              AppLocalizations.of(context)!.empty_backend_server_address,
              style: TextStyle(color: AppColors.areaLightGray, fontSize: 16),
            ),
            backgroundColor: AppColors.error,
          ),
        );
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
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Error deleting automation: $e',
              style: TextStyle(color: AppColors.areaLightGray, fontSize: 16),
            ),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  void _toggleAutomationStatus(AutomationModel automation) async {
    final backendAddressNotifier = Provider.of<BackendAddressNotifier>(context, listen: false);

    if (backendAddressNotifier.backendAddress == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            AppLocalizations.of(context)!.empty_backend_server_address,
            style: TextStyle(color: AppColors.areaLightGray, fontSize: 16),
          ),
          backgroundColor: AppColors.error,
        ),
      );
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
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              e.toString(),
              style: TextStyle(color: AppColors.areaLightGray, fontSize: 16),
            ),
            backgroundColor: AppColors.error,
          ),
        );
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

  void _showDeleteConfirmation(AutomationModel automation) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Delete Automation'),
          content: Text('Are you sure you want to delete "${automation.name}"?'),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                _deleteAutomation(automation.id);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              child: const Text('Delete'),
            ),
          ],
        );
      },
    );
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
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppDimensions.paddingSM,
                    vertical: AppDimensions.paddingXS,
                  ),
                  decoration: BoxDecoration(
                    color: automation.isActive ? Colors.green : Colors.red,
                    borderRadius: BorderRadius.circular(AppDimensions.borderRadiusSM),
                  ),
                  child: Text(
                    automation.isActive ? 'Active' : 'Inactive',
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                  ),
                ),

                const Spacer(),

                IconButton(
                  onPressed: () => _toggleAutomationStatus(automation),
                  icon: Icon(automation.isActive ? Icons.pause : Icons.play_arrow),
                  color: automation.isActive ? Colors.orange : Colors.green,
                  tooltip: automation.isActive
                      ? 'Deactivate automation'
                      : 'Activate automation',
                ),

                IconButton(
                  onPressed: () => _showDeleteConfirmation(automation),
                  icon: const Icon(Icons.delete_outline),
                  color: Colors.red,
                  tooltip: 'Delete automation',
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
                      Text('Action:', style: AppTextStyles.bodyMedium),
                      Text(automation.action.type, style: AppTextStyles.bodySmall),
                    ],
                  ),

                  const Spacer(),

                  Column(
                    mainAxisAlignment: MainAxisAlignment.start,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Reaction${automation.reactions.length != 1 ? 's' : ''}:',
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
            ? const Center(child: CircularProgressIndicator())
            : _errorMessage != null
            ? Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: AppDimensions.iconSizeXL, color: Colors.red),
                  const SizedBox(height: AppDimensions.paddingMD),
                  Text(
                    'Error loading automations',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),

                  const SizedBox(height: AppDimensions.paddingSM),

                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: AppDimensions.paddingMD),
                    child: Text(
                      _errorMessage!,
                      textAlign: TextAlign.center,
                      style: Theme.of(
                        context,
                      ).textTheme.bodyMedium?.copyWith(color: Colors.grey[600]),
                    ),
                  ),

                  const SizedBox(height: AppDimensions.paddingLG),

                  ElevatedButton(onPressed: _loadAutomations, child: const Text('Retry')),
                ],
              )
            : _automations.isEmpty
            ? Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.auto_awesome_outlined,
                    size: AppDimensions.iconSizeXL,
                    color: Colors.grey[400],
                  ),

                  const SizedBox(height: AppDimensions.paddingMD),

                  Text('No automations yet', style: Theme.of(context).textTheme.titleLarge),

                  const SizedBox(height: AppDimensions.paddingSM),

                  Text(
                    _notConnected
                        ? 'Connect to create your first automation'
                        : 'Create your first automation to get started',
                    style: Theme.of(
                      context,
                    ).textTheme.bodyMedium?.copyWith(color: Colors.grey[600]),
                  ),
                ],
              )
            : RefreshIndicator(
                onRefresh: _loadAutomations,
                child: Column(
                  children: [
                    const SizedBox(height: 50),

                    Text(
                      'My AREAs',
                      style: TextStyle(
                        fontFamily: 'Montserrat',
                        fontWeight: FontWeight.w700,
                        fontSize: 50,
                      ),
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
