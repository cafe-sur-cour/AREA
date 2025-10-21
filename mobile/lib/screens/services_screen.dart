import 'package:area/core/constants/app_colors.dart';
import 'package:area/core/notifiers/backend_address_notifier.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/services/mobile_oauth_service.dart';
import 'package:area/services/service_subscription_service.dart';
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
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        content: Row(
          children: [
            const CircularProgressIndicator(),
            const SizedBox(width: 16),
            Expanded(child: Text(message)),
          ],
        ),
      ),
    );
  }

  Future<bool> _showConfirmDialog(String title, String message) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: Text(AppLocalizations.of(this.context)!.cancel),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: Text(AppLocalizations.of(this.context)!.confirm),
          ),
        ],
      ),
    );

    return result ?? false;
  }

  void _showSuccess(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.success,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.error,
        duration: const Duration(seconds: 4),
      ),
    );
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
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: AppColors.success.withValues(alpha: 0.2),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.success),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.check_circle, size: 16, color: AppColors.success),
            const SizedBox(width: 4),
            Text(
              AppLocalizations.of(context)!.connected,
              style: TextStyle(
                color: AppColors.success,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      );
    } else if (service.oauthConnected) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.orange.withValues(alpha: 0.2),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.orange),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.link, size: 16, color: Colors.orange),
            SizedBox(width: 4),
            Text(
              AppLocalizations.of(context)!.not_subscribed,
              style: TextStyle(
                color: Colors.orange,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      );
    } else {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.grey.withValues(alpha: 0.2),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.link_off, size: 16, color: Colors.grey),
            SizedBox(width: 4),
            Text(
              AppLocalizations.of(context)!.not_connected,
              style: TextStyle(color: Colors.grey, fontSize: 12, fontWeight: FontWeight.w600),
            ),
          ],
        ),
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
              child: ElevatedButton(
                onPressed: () => _handleServiceAction(service),
                style: ElevatedButton.styleFrom(
                  backgroundColor: service.isSubscribed ? AppColors.error : AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: Text(
                  service.isSubscribed
                      ? AppLocalizations.of(context)!.unsubscribe
                      : service.oauthConnected
                      ? AppLocalizations.of(context)!.subscribe
                      : AppLocalizations.of(context)!.connect_and_subscribe,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                ),
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
      appBar: AppBar(title: Text(AppLocalizations.of(context)?.services ?? 'Services')),
      body: RefreshIndicator(onRefresh: _loadServices, child: _buildBody()),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(),
            const SizedBox(height: 16),
            Text(AppLocalizations.of(context)!.loading_services),
          ],
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              AppLocalizations.of(context)!.error,
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.red),
            ),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Text(
                _error!,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 16),
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loadServices,
              child: Text(AppLocalizations.of(context)!.retry),
            ),
          ],
        ),
      );
    }

    if (_services.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.api, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            Text(
              AppLocalizations.of(context)!.no_services_available_title,
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.grey),
            ),
            const SizedBox(height: 8),
            Text(
              AppLocalizations.of(context)!.no_services_found,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 16, color: Colors.grey),
            ),
          ],
        ),
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
