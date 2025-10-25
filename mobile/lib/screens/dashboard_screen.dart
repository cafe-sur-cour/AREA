import 'dart:convert';
import 'package:area/core/constants/app_constants.dart';
import 'package:area/core/notifiers/backend_address_notifier.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/models/automation_models.dart';
import 'package:area/models/dashboard_stats_model.dart';
import 'package:area/services/secure_http_client.dart';
import 'package:area/services/secure_storage.dart';
import 'package:area/widgets/common/app_bar/custom_app_bar.dart';
import 'package:area/widgets/common/snackbars/app_snackbar.dart';
import 'package:area/widgets/common/state/loading_state.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  DashboardScreenState createState() => DashboardScreenState();
}

class DashboardScreenState extends State<DashboardScreen> {
  List<AutomationModel> _automations = [];
  DashboardStats? _stats;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchDashboardData();
    });
  }

  Future<void> _fetchDashboardData() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final backendAddressNotifier = Provider.of<BackendAddressNotifier>(
        context,
        listen: false,
      );
      final baseUrl = backendAddressNotifier.backendAddress;

      if (baseUrl == null) {
        if (mounted) {
          showErrorSnackbar(
            context,
            AppLocalizations.of(context)!.empty_backend_server_address,
          );
        }
        setState(() {
          _isLoading = false;
        });
        return;
      }

      final jwt = await getJwt();
      if (jwt == null) {
        if (mounted) {
          showErrorSnackbar(context, AppLocalizations.of(context)!.not_authenticated);
        }
        setState(() {
          _isLoading = false;
        });
        return;
      }

      final headers = {'Authorization': 'Bearer $jwt'};
      final client = SecureHttpClient.getClient();

      final mappingsUrl = Uri.parse('$baseUrl${AppRoutes.getAutomations}');
      final mappingsResponse = await client.get(mappingsUrl, headers: headers);

      if (mappingsResponse.statusCode != 200) {
        throw 'Failed to fetch mappings: ${mappingsResponse.statusCode}';
      }

      final mappingsData = jsonDecode(mappingsResponse.body) as Map<String, dynamic>;
      final rawMappings =
          (mappingsData['mappings'] as List?)
              ?.map((m) => AutomationModel.fromJson(m as Map<String, dynamic>))
              .toList() ??
          [];

      final servicesUrl = Uri.parse('$baseUrl${AppRoutes.servicesSubscribed}');
      final servicesResponse = await client.get(servicesUrl, headers: headers);

      int totalServices = 0;
      if (servicesResponse.statusCode == 200) {
        final servicesData = jsonDecode(servicesResponse.body) as Map<String, dynamic>;
        final services = (servicesData['services'] as List?) ?? [];
        totalServices = services.length;
      }

      setState(() {
        _automations = rawMappings;
        _stats = DashboardStats(
          totalAutomations: rawMappings.length,
          activeAutomations: rawMappings.where((a) => a.isActive).length,
          inactiveAutomations: rawMappings.where((a) => !a.isActive).length,
          totalServices: totalServices,
        );
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) {
        showErrorSnackbar(context, e.toString());
      }
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final theme = Theme.of(context);

    if (_isLoading) {
      return Scaffold(
        appBar: CustomAppBar(title: l10n.dashboard),
        body: const LoadingState(),
      );
    }

    return Scaffold(
      appBar: CustomAppBar(title: l10n.dashboard),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l10n.dashboard,
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    l10n.manage_areas_performance,
                    style: theme.textTheme.bodySmall?.copyWith(color: Colors.black),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              if (_stats != null) ...[
                _buildStatsGrid(theme, l10n),
                const SizedBox(height: 24),
              ],

              Text(
                l10n.quick_actions,
                style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              Column(
                children: [
                  _QuickActionButton(
                    icon: Icons.people,
                    title: l10n.connect_services,
                    subtitle: l10n.link_new_platforms,
                    onPressed: () {
                      Navigator.pushNamed(context, '/action-services');
                    },
                  ),
                  const SizedBox(height: 8),
                  _QuickActionButton(
                    icon: Icons.bolt,
                    title: l10n.browse_templates,
                    subtitle: l10n.pre_made_areas,
                    onPressed: () {},
                  ),
                  const SizedBox(height: 8),
                  _QuickActionButton(
                    icon: Icons.settings,
                    title: l10n.account_settings,
                    subtitle: l10n.manage_your_profile,
                    onPressed: () {
                      Navigator.pushNamed(context, '/');
                    },
                  ),
                ],
              ),
              const SizedBox(height: 24),

              Text(
                l10n.your_areas,
                style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              if (_automations.isEmpty)
                _buildEmptyState(theme, l10n)
              else
                Column(
                  children: _automations
                      .map((automation) => _AutomationCard(automation: automation))
                      .toList(),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatsGrid(ThemeData theme, AppLocalizations l10n) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _StatCard(
                label: l10n.total_areas,
                value: _stats!.totalAutomations.toString(),
                icon: Icons.bolt,
                color: Colors.blue,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _StatCard(
                label: l10n.connected_services,
                value: _stats!.totalServices.toString(),
                icon: Icons.cloud_circle,
                color: Colors.blue,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _StatCard(
                label: l10n.active,
                value: _stats!.activeAutomations.toString(),
                icon: Icons.power_settings_new,
                color: Colors.green,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _StatCard(
                label: l10n.inactive,
                value: _stats!.inactiveAutomations.toString(),
                icon: Icons.power_settings_new,
                color: Colors.red,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildEmptyState(ThemeData theme, AppLocalizations l10n) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 48.0),
        child: Column(
          children: [
            Icon(Icons.bolt_outlined, size: 48, color: Colors.black),
            const SizedBox(height: 16),
            Text(
              l10n.no_area_yet,
              style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              l10n.create_first_area,
              style: theme.textTheme.bodySmall?.copyWith(color: Colors.black),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(label, style: theme.textTheme.bodySmall?.copyWith(color: Colors.black)),
                Icon(icon, color: color, size: 20),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              value,
              style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }
}

class _QuickActionButton extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onPressed;

  const _QuickActionButton({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return OutlinedButton(
      onPressed: onPressed,
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.all(16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 24),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                ),
                Text(
                  subtitle,
                  style: theme.textTheme.bodySmall?.copyWith(color: Colors.black),
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right),
        ],
      ),
    );
  }
}

class _AutomationCard extends StatelessWidget {
  final AutomationModel automation;

  const _AutomationCard({required this.automation});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  automation.action.type.toLowerCase().contains('github')
                      ? Icons.code
                      : Icons.bolt,
                  size: 20,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        automation.name,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        automation.description,
                        style: theme.textTheme.bodySmall?.copyWith(color: Colors.black),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: automation.isActive
                        ? Colors.green.withAlpha(51)
                        : Colors.red.withAlpha(51),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    automation.isActive
                        ? AppLocalizations.of(context)!.active
                        : AppLocalizations.of(context)!.inactive,
                    style: theme.textTheme.bodySmall?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: automation.isActive ? Colors.green : Colors.red,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              '${AppLocalizations.of(context)!.trigger_colon(automation.action.type)} ${automation.reactions.isNotEmpty ? '→ ${automation.reactions.map((r) => r.type).join(', ')}' : ''}',
              style: theme.textTheme.bodySmall?.copyWith(color: Colors.black),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
