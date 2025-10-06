import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:area/core/constants/app_colors.dart';
import 'package:area/core/utils/color_utils.dart';
import 'package:area/core/notifiers/backend_address_notifier.dart';
import 'package:area/models/service_models.dart';
import 'package:area/models/action_models.dart';
import 'package:area/services/api_service.dart';
import 'package:area/widgets/action_selection_card.dart';
import 'package:area/screens/action_details_screen.dart';
import 'package:area/l10n/app_localizations.dart';

class ServiceActionsScreen extends StatefulWidget {
  final ServiceModel service;

  const ServiceActionsScreen({super.key, required this.service});

  @override
  ServiceActionsScreenState createState() => ServiceActionsScreenState();
}

class ServiceActionsScreenState extends State<ServiceActionsScreen> {
  List<ActionModel> _actions = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchActions();
  }

  Future<void> _fetchActions() async {
    if (!mounted) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final backendAddressNotifier = Provider.of<BackendAddressNotifier>(
        context,
        listen: false,
      );

      if (backendAddressNotifier.backendAddress == null) {
        throw Exception(AppLocalizations.of(context)!.empty_backend_server_address);
      }

      final actions = await ApiService.fetchServiceActions(
        backendAddressNotifier.backendAddress!,
        widget.service.id,
      );

      if (mounted) {
        setState(() {
          _actions = actions;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  void _onActionTap(ActionModel action) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ActionDetailsScreen(action: action, service: widget.service),
      ),
    );
  }

  Color _getServiceColor() {
    return ColorUtils.getServiceColor(widget.service);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              widget.service.name,
              style: const TextStyle(
                fontFamily: 'Montserrat',
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
            Text(
              'Actions',
              style: TextStyle(
                fontFamily: 'Montserrat',
                fontWeight: FontWeight.normal,
                fontSize: 14,
                color: AppColors.areaLightGray.withValues(alpha: 0.9),
              ),
            ),
          ],
        ),
        backgroundColor: _getServiceColor(),
        foregroundColor: AppColors.areaLightGray,
        elevation: 0,
      ),
      body: Column(
        children: [
          Container(
            width: double.infinity,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [_getServiceColor(), _getServiceColor().withValues(alpha: 0.8)],
              ),
            ),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: AppColors.areaLightGray.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: widget.service.icon != null
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.network(
                              widget.service.icon!,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) {
                                return const Icon(
                                  Icons.web,
                                  color: AppColors.areaLightGray,
                                  size: 32,
                                );
                              },
                            ),
                          )
                        : const Icon(Icons.web, color: AppColors.areaLightGray, size: 32),
                  ),

                  const SizedBox(width: 16),

                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (widget.service.description.isNotEmpty)
                          Text(
                            widget.service.description,
                            style: const TextStyle(
                              fontFamily: 'Montserrat',
                              fontSize: 14,
                              color: AppColors.areaLightGray,
                              height: 1.4,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),

                        const SizedBox(height: 4),

                        Text(
                          '${_actions.length} available action${_actions.length == 1 ? '' : 's'}',
                          style: TextStyle(
                            fontFamily: 'Montserrat',
                            fontSize: 12,
                            color: AppColors.areaLightGray.withValues(alpha: 0.8),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          Expanded(child: _buildBody()),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(_getServiceColor()),
            ),

            const SizedBox(height: 16),

            Text(
              'Loading actions...',
              style: TextStyle(
                fontFamily: 'Montserrat',
                fontSize: 16,
                color: AppColors.areaDarkGray,
              ),
            ),
          ],
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 64, color: AppColors.error),

              const SizedBox(height: 16),

              const Text(
                'Error loading actions',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.areaBlack,
                ),
              ),

              const SizedBox(height: 8),

              Text(
                _error!.replaceAll('Exception: ', ''),
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 14, color: AppColors.areaDarkGray),
              ),

              const SizedBox(height: 24),

              ElevatedButton(
                onPressed: _fetchActions,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _getServiceColor(),
                  foregroundColor: AppColors.areaLightGray,
                ),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    if (_actions.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.flash_off, size: 64, color: AppColors.areaDarkGray),

              const SizedBox(height: 16),

              const Text(
                'No actions available',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.areaBlack,
                ),
              ),

              const SizedBox(height: 8),

              Text(
                'This service doesn\'t have any available actions at the moment.',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 14, color: AppColors.areaDarkGray),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchActions,
      color: _getServiceColor(),
      child: ListView.builder(
        padding: const EdgeInsets.all(16.0),
        itemCount: _actions.length,
        itemBuilder: (context, index) {
          final action = _actions[index];
          return Padding(
            padding: const EdgeInsets.only(bottom: 12.0),
            child: ActionSelectionCard(action: action, onTap: () => _onActionTap(action)),
          );
        },
      ),
    );
  }
}
