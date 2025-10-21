import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:area/core/constants/app_colors.dart';
import 'package:area/core/notifiers/backend_address_notifier.dart';
import 'package:area/models/service_models.dart';
import 'package:area/services/api_service.dart';
import 'package:area/widgets/service_card.dart';
import 'package:area/screens/service_reactions_screen.dart';
import 'package:area/l10n/app_localizations.dart';

class ReactionServicesScreen extends StatefulWidget {
  const ReactionServicesScreen({super.key});

  @override
  ReactionServicesScreenState createState() => ReactionServicesScreenState();
}

class ReactionServicesScreenState extends State<ReactionServicesScreen> {
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

      final services = await ApiService.fetchServicesWithReactions(
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
      MaterialPageRoute(builder: (context) => ServiceReactionsScreen(service: service)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          AppLocalizations.of(context)!.reaction_services,
          style: TextStyle(fontFamily: 'Montserrat', fontWeight: FontWeight.bold),
        ),
        backgroundColor: AppColors.areaBlue3,
        foregroundColor: AppColors.areaLightGray,
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(AppColors.areaBlue3),
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: AppColors.error),

            const SizedBox(height: 16),

            Text(
              AppLocalizations.of(context)!.error_loading_services,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.areaBlack,
              ),
            ),

            const SizedBox(height: 8),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Text(
                _error!.replaceAll('Exception: ', ''),
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 14, color: AppColors.areaDarkGray),
              ),
            ),

            const SizedBox(height: 24),

            ElevatedButton(
              onPressed: _fetchServices,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.areaBlue3,
                foregroundColor: AppColors.areaLightGray,
              ),
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
            const Icon(Icons.cloud_off, size: 64, color: AppColors.areaDarkGray),

            const SizedBox(height: 16),

            Text(
              AppLocalizations.of(context)!.no_services_available,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.areaBlack,
              ),
            ),

            const SizedBox(height: 8),

            Text(
              AppLocalizations.of(context)!.no_services_with_reactions,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 14, color: AppColors.areaDarkGray),
            ),
          ],
        ),
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
