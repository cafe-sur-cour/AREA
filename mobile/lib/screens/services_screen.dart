import 'package:area/core/constants/app_colors.dart';
import 'package:area/core/notifiers/backend_address_notifier.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/services/mobile_oauth_service.dart';
import 'package:area/services/service_subscription_service.dart';
import 'package:area/widgets/common/app_bar/custom_app_bar.dart';
import 'package:area/widgets/common/buttons/primary_button.dart';
import 'package:area/widgets/common/cards/status_badge.dart';
import 'package:area/widgets/common/dialogs/confirm_dialog.dart';
import 'package:area/widgets/common/dialogs/loading_dialog.dart';
import 'package:area/widgets/common/snackbars/app_snackbar.dart';
import 'package:area/widgets/common/state/empty_state.dart';
import 'package:area/widgets/common/state/error_state.dart';
import 'package:area/widgets/common/state/loading_state.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:provider/provider.dart';

class ServicesScreen extends StatefulWidget {
  const ServicesScreen({super.key});

  @override
  ServicesScreenState createState() => ServicesScreenState();
}

class ServicesScreenState extends State<ServicesScreen> {
  List<ServiceInfo> _services = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadServices();
  }

  Future<void> _loadServices() async {
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
        setState(() {
          _error = AppLocalizations.of(context)!.backend_server_not_configured;
          _isLoading = false;
        });
        return;
      }

      final services = await ServiceSubscriptionService.getAllServices(
        backendAddressNotifier.backendAddress!,
      );

      setState(() {
        _services = services;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = AppLocalizations.of(context)!.failed_load_services(e.toString());
        _isLoading = false;
      });
    }
  }

  Future<void> _refreshServiceStatus(ServiceInfo service) async {
    try {
      final backendAddressNotifier = Provider.of<BackendAddressNotifier>(
        context,
        listen: false,
      );

      if (backendAddressNotifier.backendAddress == null) return;

      final status = await ServiceSubscriptionService.getServiceStatus(
        backendAddressNotifier.backendAddress!,
        service,
      );

      final oauthStatus = await ServiceSubscriptionService.getOAuthStatus(
        backendAddressNotifier.backendAddress!,
        service,
      );

      setState(() {
        final index = _services.indexWhere((s) => s.id == service.id);
        if (index != -1) {
          _services[index] = ServiceInfo(
            id: service.id,
            name: service.name,
            description: service.description,
            version: service.version,
            icon: service.icon,
            isSubscribed: status.subscribed,
            oauthConnected: oauthStatus,
            canCreateWebhooks: status.canCreateWebhooks,
            statusEndpoint: service.statusEndpoint,
            loginStatusEndpoint: service.loginStatusEndpoint,
            authEndpoint: service.authEndpoint,
            subscribeEndpoint: service.subscribeEndpoint,
            unsubscribeEndpoint: service.unsubscribeEndpoint,
          );
        }
      });
    } catch (e) {
      // Silently handle refresh errors
    }
  }

  Future<void> _handleServiceAction(ServiceInfo service) async {
    final backendAddressNotifier = Provider.of<BackendAddressNotifier>(context, listen: false);

    if (backendAddressNotifier.backendAddress == null) {
      _showError(AppLocalizations.of(context)!.backend_server_not_configured);
      return;
    }

    try {
      if (service.isSubscribed) {
        await _handleUnsubscribe(service, backendAddressNotifier.backendAddress!);
      } else {
        await _handleSubscribe(service, backendAddressNotifier.backendAddress!);
      }
    } catch (e) {
      if (mounted) {
        _showError(AppLocalizations.of(context)!.action_failed(e.toString()));
      }
    }
  }

  Future<void> _handleSubscribe(ServiceInfo service, String backendAddress) async {
    try {
      _showLoading(AppLocalizations.of(context)!.connecting_to_service(service.name));

      final success = await MobileOAuthService.handleServiceSubscription(
        context: context,
        backendAddress: backendAddress,
        subscriptionUrl: ServiceSubscriptionService.getSubscriptionUrl(
          backendAddress,
          service,
        ),
        serviceName: service.name,
      );

      if (mounted) {
        Navigator.of(context).pop();
      }

      if (success && mounted) {
        _showSuccess(AppLocalizations.of(context)!.successfully_connected_to(service.name));
        await _refreshServiceStatus(service);
      }
    } catch (e) {
      if (mounted) {
        Navigator.of(context).pop();
        _showError(
          AppLocalizations.of(context)!.failed_connect_service(service.name, e.toString()),
        );
      }
    }
  }

  Future<void> _handleUnsubscribe(ServiceInfo service, String backendAddress) async {
    final confirmed = await _showConfirmDialog(
      AppLocalizations.of(context)!.unsubscribe_from(service.name),
      AppLocalizations.of(context)!.unsubscribe_confirm(service.name),
    );

    if (!confirmed) return;

    try {
      if (mounted) {
        _showLoading(AppLocalizations.of(context)!.unsubscribing_from_service(service.name));
      }

      await ServiceSubscriptionService.unsubscribeFromService(backendAddress, service);

      if (mounted) {
        Navigator.of(context).pop();
        _showSuccess(AppLocalizations.of(context)!.unsubscribed_from(service.name));
        await _refreshServiceStatus(service);
      }
    } catch (e) {
      if (mounted) {
        Navigator.of(context).pop();
        _showError(AppLocalizations.of(context)!.unsubscribe_failed(e.toString()));
      }
    }
  }

  void _showLoading(String message) {
    showLoadingDialog(context, message);
  }

  Future<bool> _showConfirmDialog(String title, String message) async {
    return await showConfirmDialog(
      context: context,
      title: title,
      message: message,
      confirmText: AppLocalizations.of(context)!.confirm,
      cancelText: AppLocalizations.of(context)!.cancel,
    );
  }

  void _showSuccess(String message) {
    showSuccessSnackbar(context, message);
  }

  void _showError(String message) {
    showErrorSnackbar(context, message);
  }

  Widget _buildServiceIcon(String svgIcon) {
    if (svgIcon.isNotEmpty && svgIcon.contains('<svg')) {
      try {

        return SizedBox(

          width: 40,
          height: 40,
          child: SvgPicture.string(svgIcon, width: 40, height: 40, fit: BoxFit.contain),
        );
      } catch (e) {
        // Fallback to default icon
      }
    }
    return const Icon(Icons.api, size: 40, color: Colors.grey);
  }

  Widget _buildServiceStatus(ServiceInfo service) {
    if (service.isSubscribed) {
      return StatusBadge(
        text: AppLocalizations.of(context)!.connected,
        color: AppColors.success,
        icon: Icons.check_circle,
      );
    } else if (service.oauthConnected) {
      return StatusBadge(
        text: AppLocalizations.of(context)!.not_subscribed,
        color: Colors.orange,
        icon: Icons.link,
      );
    } else {
      return StatusBadge(
        text: AppLocalizations.of(context)!.not_connected,
        color: Colors.grey,
        icon: Icons.link_off,
      );
    }
  }

  Widget _buildServiceCard(ServiceInfo service) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                _buildServiceIcon(service.icon),

                const SizedBox(width: 16),

                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        service.name,
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),

                      const SizedBox(height: 4),

                      _buildServiceStatus(service),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            Text(service.description, style: TextStyle(fontSize: 14, color: Colors.grey[600])),

            const SizedBox(height: 16),

            SizedBox(

              width: double.infinity,
              child: PrimaryButton(
                text: service.isSubscribed
                    ? AppLocalizations.of(context)!.unsubscribe
                    : service.oauthConnected
                        ? AppLocalizations.of(context)!.subscribe
                        : AppLocalizations.of(context)!.connect_and_subscribe,
                onPressed: () => _handleServiceAction(service),
                backgroundColor: service.isSubscribed ? AppColors.error : AppColors.primary,
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: CustomAppBar(title: AppLocalizations.of(context)!.services),
      body: RefreshIndicator(onRefresh: _loadServices, child: _buildBody()),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return LoadingState(message: AppLocalizations.of(context)!.loading_services);
    }

    if (_error != null) {
      return ErrorState(
        title: AppLocalizations.of(context)!.error,
        message: _error!,
        onRetry: _loadServices,
        retryButtonText: AppLocalizations.of(context)!.retry,
      );
    }

    if (_services.isEmpty) {
      return EmptyState(
        title: AppLocalizations.of(context)!.no_services_available_title,
        message: AppLocalizations.of(context)!.no_services_found,
        icon: Icons.api,
      );
    }

    return ListView.builder(
      itemCount: _services.length,
      itemBuilder: (context, index) {
        return _buildServiceCard(_services[index]);
      },
    );
  }
}
