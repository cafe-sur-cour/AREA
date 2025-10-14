import 'package:area/core/constants/app_colors.dart';
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
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            e.toString(),
            style: TextStyle(color: AppColors.areaLightGray, fontSize: 16),
          ),
          backgroundColor: AppColors.error,
        ),
      );
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
              ),
              child: const Text('Delete'),
            ),
          ],
        );
      },
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
                      Card(
                        margin: const EdgeInsets.only(bottom: AppDimensions.paddingMD),
                        elevation: 2,
                        child: Padding(
                          padding: const EdgeInsets.all(AppDimensions.paddingMD),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      _automations[index].name,
                                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: AppDimensions.paddingSM,
                                      vertical: AppDimensions.paddingXS,
                                    ),
                                    decoration: BoxDecoration(
                                      color: _automations[index].isActive
                                          ? Colors.green
                                          : Colors.red,
                                      borderRadius: BorderRadius.circular(
                                        AppDimensions.borderRadiusSM,
                                      ),
                                    ),
                                    child: Text(
                                      _automations[index].isActive ? 'Active' : 'Inactive',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ),
                                ],
                              ),

                              const SizedBox(height: AppDimensions.paddingSM),

                              Text(
                                _automations[index].description,
                                style: Theme.of(
                                  context,
                                ).textTheme.bodyMedium?.copyWith(color: Colors.grey[600]),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),

                              const SizedBox(height: AppDimensions.paddingSM),

                              Row(
                                children: [
                                  Text(
                                    'Action: ${_automations[index].action.type}',
                                    style: Theme.of(context).textTheme.bodySmall,
                                  ),
                                  const Spacer(),
                                  Text(
                                    '${_automations[index].reactions.length} reaction${_automations[index].reactions.length != 1 ? 's' : ''}',
                                    style: Theme.of(context).textTheme.bodySmall,
                                  ),
                                ],
                              ),

                              const SizedBox(height: AppDimensions.paddingMD),

                              Row(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  IconButton(
                                    onPressed: () =>
                                        _toggleAutomationStatus(_automations[index]),
                                    icon: Icon(
                                      _automations[index].isActive
                                          ? Icons.pause
                                          : Icons.play_arrow,
                                    ),
                                    color: _automations[index].isActive
                                        ? Colors.orange
                                        : Colors.green,
                                    tooltip: _automations[index].isActive
                                        ? 'Deactivate automation'
                                        : 'Activate automation',
                                  ),

                                  IconButton(
                                    onPressed: () =>
                                        _showDeleteConfirmation(_automations[index]),
                                    icon: const Icon(Icons.delete_outline),
                                    color: Colors.red,
                                    tooltip: 'Delete automation',
                                  ),
                                ],
                              ),
                            ],
                          ),
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
