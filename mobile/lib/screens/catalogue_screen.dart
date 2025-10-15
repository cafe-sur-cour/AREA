import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:area/core/constants/app_colors.dart';
import 'package:area/core/constants/app_constants.dart';
import 'package:area/core/notifiers/backend_address_notifier.dart';
import 'package:area/core/notifiers/automation_builder_notifier.dart';
import 'package:area/services/secure_http_client.dart';
import 'package:area/services/secure_storage.dart';
import 'dart:convert';

class CatalogueItem {
  final String name;
  final String description;
  final String serviceName;
  final bool isAction;

  CatalogueItem({
    required this.name,
    required this.description,
    required this.serviceName,
    required this.isAction,
  });
}

class CatalogueScreen extends StatefulWidget {
  const CatalogueScreen({super.key});

  @override
  CatalogueScreenState createState() => CatalogueScreenState();
}

class CatalogueScreenState extends State<CatalogueScreen> {
  List<CatalogueItem> _items = [];
  bool _isLoading = true;
  String? _error;
  String _filter = 'all';

  @override
  void initState() {
    super.initState();
    _fetchCatalogue();
  }

  Future<void> _fetchCatalogue() async {
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
        throw Exception('Backend server address is not configured');
      }

      final jwt = await getJwt();
      final url = Uri.parse('${backendAddressNotifier.backendAddress}${AppRoutes.about}');

      final headers = <String, String>{'Content-Type': 'application/json'};
      if (jwt != null) {
        headers['Authorization'] = 'Bearer $jwt';
      }

      final client = SecureHttpClient.getClient();
      final response = await client.get(url, headers: headers);

      if (response.statusCode != 200) {
        throw Exception('Failed to fetch catalogue: ${response.statusCode}');
      }

      final data = jsonDecode(response.body);
      final List<CatalogueItem> items = [];

      if (data['server'] != null && data['server']['services'] != null) {
        final services = data['server']['services'] as List;

        for (var service in services) {
          final serviceName = service['name'] as String;

          if (service['actions'] != null) {
            final actions = service['actions'] as List;
            for (var action in actions) {
              items.add(
                CatalogueItem(
                  name: action['name'] as String,
                  description: action['description'] as String? ?? '',
                  serviceName: serviceName,
                  isAction: true,
                ),
              );
            }
          }

          if (service['reactions'] != null) {
            final reactions = service['reactions'] as List;
            for (var reaction in reactions) {
              items.add(
                CatalogueItem(
                  name: reaction['name'] as String,
                  description: reaction['description'] as String? ?? '',
                  serviceName: serviceName,
                  isAction: false,
                ),
              );
            }
          }
        }
      }

      if (mounted) {
        setState(() {
          _items = items;
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

  List<CatalogueItem> get _filteredItems {
    if (_filter == 'actions') {
      return _items.where((item) => item.isAction).toList();
    } else if (_filter == 'reactions') {
      return _items.where((item) => !item.isAction).toList();
    }
    return _items;
  }

  void _showItemDialog(CatalogueItem item) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Row(
          children: [
            Icon(
              item.isAction ? Icons.play_arrow : Icons.bolt,
              color: item.isAction ? AppColors.areaBlue3 : AppColors.areaBlue1,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                item.name,
                style: const TextStyle(fontFamily: 'Montserrat', fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.areaBlue3.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  item.serviceName,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.areaBlue3,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                item.description.isNotEmpty ? item.description : 'No description available',
                style: const TextStyle(fontSize: 14),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(dialogContext).pop();
              _useItemInAutomation(item);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.areaBlue3,
              foregroundColor: Colors.white,
            ),
            child: Text(item.isAction ? 'Use as Action' : 'Use as Reaction'),
          ),
        ],
      ),
    );
  }

  void _useItemInAutomation(CatalogueItem item) {
    final automationBuilder = Provider.of<AutomationBuilderNotifier>(context, listen: false);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          item.isAction
              ? 'Please select the service and action from the Add AREA page'
              : 'Please select the service and reaction from the Add AREA page',
        ),
        backgroundColor: AppColors.areaBlue3,
        duration: const Duration(seconds: 3),
      ),
    );

    Navigator.of(context).pushReplacementNamed('/');
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const SizedBox(height: 50),

        _buildFilterChips(),

        Expanded(child: _buildBody()),
      ],
    );
  }

  Widget _buildFilterChips() {
    return Container(
      padding: const EdgeInsets.all(AppDimensions.paddingMD),
      child: Row(
        children: [
          FilterChip(
            label: const Text('All'),
            selected: _filter == 'all',
            onSelected: (selected) {
              if (selected) setState(() => _filter = 'all');
            },
            selectedColor: AppColors.areaDarkGray.withValues(alpha: 0.2),
          ),
          const SizedBox(width: 8),
          FilterChip(
            label: const Text('Actions'),
            selected: _filter == 'actions',
            onSelected: (selected) {
              if (selected) setState(() => _filter = 'actions');
            },
            selectedColor: AppColors.areaBlue3.withValues(alpha: 0.2),
            avatar: Icon(
              Icons.play_arrow,
              size: 18,
              color: _filter == 'actions' ? AppColors.areaBlue3 : null,
            ),
          ),
          const SizedBox(width: 8),
          FilterChip(
            label: const Text('Reactions'),
            selected: _filter == 'reactions',
            onSelected: (selected) {
              if (selected) setState(() => _filter = 'reactions');
            },
            selectedColor: AppColors.areaBlue1.withValues(alpha: 0.3),
            avatar: Icon(
              Icons.bolt,
              size: 18,
              color: _filter == 'reactions' ? AppColors.areaBlue1 : null,
            ),
          ),
        ],
      ),
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
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              'Error loading catalogue',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Text(
                _error!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.grey),
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _fetchCatalogue,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.areaBlue3,
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      );
    }

    if (_filteredItems.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              _filter == 'actions'
                  ? Icons.play_arrow
                  : _filter == 'reactions'
                  ? Icons.bolt
                  : Icons.apps,
              size: 64,
              color: Colors.grey,
            ),
            const SizedBox(height: 16),
            Text(
              _filter == 'all' ? 'No items available' : 'No $_filter available',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.grey,
              ),
            ),
          ],
        ),
      );
    }

    return GridView.builder(
      padding: const EdgeInsets.all(AppDimensions.paddingMD),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 1.5,
        crossAxisSpacing: AppDimensions.paddingMD,
        mainAxisSpacing: AppDimensions.paddingMD,
      ),
      itemCount: _filteredItems.length,
      itemBuilder: (context, index) {
        final item = _filteredItems[index];
        return _buildCatalogueCard(item);
      },
    );
  }

  Widget _buildCatalogueCard(CatalogueItem item) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppDimensions.borderRadiusMD),
      ),
      child: InkWell(
        onTap: () => _showItemDialog(item),
        borderRadius: BorderRadius.circular(AppDimensions.borderRadiusMD),
        child: Container(
          padding: const EdgeInsets.all(AppDimensions.paddingMD),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppDimensions.borderRadiusMD),
            border: Border.all(
              color: item.isAction
                  ? AppColors.areaBlue3.withValues(alpha: 0.3)
                  : AppColors.areaBlue1.withValues(alpha: 0.3),
              width: 2,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(
                    item.isAction ? Icons.play_arrow : Icons.bolt,
                    color: item.isAction ? AppColors.areaBlue3 : AppColors.areaBlue1,
                    size: 20,
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      item.serviceName,
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.grey[600],
                        fontWeight: FontWeight.w500,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Expanded(
                child: Text(
                  item.name,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Montserrat',
                  ),
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
