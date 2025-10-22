import 'package:area/widgets/common/app_bar/custom_app_bar.dart';
import 'package:area/widgets/common/state/empty_state.dart';
import 'package:area/widgets/common/state/error_state.dart';
import 'package:area/widgets/common/state/loading_state.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:area/core/constants/app_colors.dart';
import 'package:area/core/notifiers/backend_address_notifier.dart';
import 'package:area/models/service_models.dart';
import 'package:area/services/api_service.dart';
import 'package:area/widgets/service_card.dart';
import 'package:area/screens/service_actions_screen.dart';
import 'package:area/l10n/app_localizations.dart';

class ActionServicesScreen extends StatefulWidget {
  const ActionServicesScreen({super.key});

  @override
  ActionServicesScreenState createState() => ActionServicesScreenState();
}

class ActionServicesScreenState extends State<ActionServicesScreen> {
  List<ServiceModel> _services = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchServices();
  }

  Future<void> _fetchServices() async {
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

      final services = await ApiService.fetchServicesWithActions(
        backendAddressNotifier.backendAddress!,
      );

      if (mounted) {
        setState(() {
          _services = services;
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

  void _onServiceTap(ServiceModel service) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => ServiceActionsScreen(service: service)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: CustomAppBar(title: AppLocalizations.of(context)!.action_services),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const LoadingState();
    }

    if (_error != null) {
      return ErrorState(
        title: AppLocalizations.of(context)!.error_loading_services,
        message: _error!.replaceAll('Exception: ', ''),
        onRetry: _fetchServices,
      );
    }

    if (_services.isEmpty) {
      return EmptyState(
        icon: Icons.cloud_off,
        title: AppLocalizations.of(context)!.no_services_available,
        message: AppLocalizations.of(context)!.no_services_with_actions,
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchServices,
      color: AppColors.areaBlue3,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: GridView.builder(
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: _getCrossAxisCount(context),
            childAspectRatio: 0.8,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
          ),
          itemCount: _services.length,
          itemBuilder: (context, index) {
            final service = _services[index];
            return ServiceCard(service: service, onTap: () => _onServiceTap(service));
          },
        ),
      ),
    );
  }

  int _getCrossAxisCount(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    if (screenWidth < 600) {
      return 2;
    } else {
      return 4;
    }
  }
}
