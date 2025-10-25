import 'dart:convert';
import 'package:area/core/config/app_config.dart';
import 'package:area/core/constants/app_constants.dart';
import 'package:area/core/notifiers/backend_address_notifier.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/services/secure_http_client.dart';
import 'package:area/services/secure_storage.dart';
import 'package:area/widgets/common/app_bar/custom_app_bar.dart';
import 'package:area/widgets/common/snackbars/app_snackbar.dart';
import 'package:area/widgets/common/state/loading_state.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class Mapping {
  final int id;
  final String name;
  final String description;
  final bool isActive;
  final String trigger;
  final List<String> actions;
  final DateTime createdAt;

  Mapping({
    required this.id,
    required this.name,
    required this.description,
    required this.isActive,
    required this.trigger,
    required this.actions,
    required this.createdAt,
  });

  factory Mapping.fromJson(Map<String, dynamic> json) {
    return Mapping(
      id: json['id'] ?? 0,
      name: json['name'] ?? 'Untitled',
      description: json['description'] ?? '',
      isActive: json['is_active'] ?? false,
      trigger: json['action']?['type'] ?? 'Unknown',
      actions: List<String>.from(
        (json['reactions'] as List?)?.map((r) => r['type'] ?? 'Unknown') ?? [],
      ),
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : DateTime.now(),
    );
  }
}

class DashboardStats {
  final int totalAutomations;
  final int activeAutomations;
  final int inactiveAutomations;
  final int totalServices;

  DashboardStats({
    required this.totalAutomations,
    required this.activeAutomations,
    required this.inactiveAutomations,
    required this.totalServices,
  });
}

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  DashboardScreenState createState() => DashboardScreenState();
}

class DashboardScreenState extends State<DashboardScreen> {
  List<Mapping> _automations = [];
  DashboardStats? _stats;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchDashboardData();
  }

  Future<void> _fetchDashboardData() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final backendAddressNotifier =
          Provider.of<BackendAddressNotifier>(context, listen: false);
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
          showErrorSnackbar(context, 'Not authenticated');
        }
        setState(() {
          _isLoading = false;
        });
        return;
      }

      final headers = {'Authorization': 'Bearer $jwt'};
      final client = SecureHttpClient.getClient();

      // Fetch mappings using AppRoutes
      final mappingsUrl = Uri.parse('$baseUrl${AppRoutes.getAutomations}');
      final mappingsResponse =
          await client.get(mappingsUrl, headers: headers);

      if (mappingsResponse.statusCode != 200) {
        throw 'Failed to fetch mappings: ${mappingsResponse.statusCode}';
      }

      final mappingsData =
          jsonDecode(mappingsResponse.body) as Map<String, dynamic>;
      final rawMappings = (mappingsData['mappings'] as List?)
              ?.map((m) => Mapping.fromJson(m as Map<String, dynamic>))
              .toList() ??
          [];

      // Fetch services using AppRoutes
      final servicesUrl = Uri.parse('$baseUrl${AppRoutes.servicesSubscribed}');
      final servicesResponse =
          await client.get(servicesUrl, headers: headers);

      int totalServices = 0;
      if (servicesResponse.statusCode == 200) {
        final servicesData =
            jsonDecode(servicesResponse.body) as Map<String, dynamic>;
        final services = (servicesData['services'] as List?) ?? [];
        totalServices = services.length;
      }

      setState(() {
        _automations = rawMappings;
        _stats = DashboardStats(
          totalAutomations: rawMappings.length,
          activeAutomations:
              rawMappings.where((a) => a.isActive).length,
          inactiveAutomations:
              rawMappings.where((a) => !a.isActive).length,
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

  IconData _getTriggerIcon(String trigger) {
    if (trigger.toLowerCase().contains('github'))
      return Icons.code;
    if (trigger.toLowerCase().contains('gmail') ||
        trigger.toLowerCase().contains('mail'))
      return Icons.mail;
    if (trigger.toLowerCase().contains('calendar'))
      return Icons.calendar_today;
    if (trigger.toLowerCase().contains('discord') ||
        trigger.toLowerCase().contains('twitter') ||
        trigger.toLowerCase().contains('slack'))
      return Icons.message;
    if (trigger.toLowerCase().contains('timer'))
      return Icons.timer;
    return Icons.bolt;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final theme = Theme.of(context);

    if (_isLoading) {
      return Scaffold(
        appBar: CustomAppBar(title: 'Dashboard'),
        body: const LoadingState(),
      );
    }

    return Scaffold(
      appBar: CustomAppBar(title: 'Dashboard'),
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
                    'Dashboard',
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Manage your Areas and monitor their performance',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: Colors.black,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Stats Cards
              if (_stats != null) ...[
                _buildStatsGrid(theme),
                const SizedBox(height: 24),
              ],

              // Quick Actions
              Text(
                'Quick actions',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              Column(
                children: [
                  _QuickActionButton(
                    icon: Icons.people,
                    title: 'Connect Services',
                    subtitle: 'Link new platforms',
                    onPressed: () {
                      Navigator.pushNamed(context, '/action-services');
                    },
                  ),
                  const SizedBox(height: 8),
                  _QuickActionButton(
                    icon: Icons.bolt,
                    title: 'Browse Templates',
                    subtitle: 'Pre-made Areas',
                    onPressed: () {
                      // Navigate to templates
                    },
                  ),
                  const SizedBox(height: 8),
                  _QuickActionButton(
                    icon: Icons.settings,
                    title: 'Account Settings',
                    subtitle: 'Manage your profile',
                    onPressed: () {
                      Navigator.pushNamed(context, '/');
                    },
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Your Areas Section
              Text(
                'Your Areas',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              if (_automations.isEmpty)
                _buildEmptyState(theme, l10n)
              else
                Column(
                  children: _automations
                      .map((automation) =>
                          _AutomationCard(automation: automation))
                      .toList(),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatsGrid(ThemeData theme) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _StatCard(
                label: 'Total Areas',
                value: _stats!.totalAutomations.toString(),
                icon: Icons.bolt,
                color: Colors.blue,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _StatCard(
                label: 'Connected Services',
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
                label: 'Active',
                value: _stats!.activeAutomations.toString(),
                icon: Icons.power_settings_new,
                color: Colors.green,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _StatCard(
                label: 'Inactive',
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
            Icon(
              Icons.bolt_outlined,
              size: 48,
              color: Colors.black,
            ),
            const SizedBox(height: 16),
            Text(
              'No Area yet',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Create your first Area to get started',
              style: theme.textTheme.bodySmall?.copyWith(
                color: Colors.black,
              ),
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
                Text(
                  label,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: Colors.black,
                  ),
                ),
                Icon(icon, color: color, size: 20),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              value,
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
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
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
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
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  subtitle,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: Colors.black,
                  ),
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
  final Mapping automation;

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
                  automation.trigger.toLowerCase().contains('github')
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
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: Colors.black,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: automation.isActive
                        ? Colors.green.withOpacity(0.2)
                        : Colors.red.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    automation.isActive ? 'Active' : 'Inactive',
                    style: theme.textTheme.bodySmall?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: automation.isActive
                          ? Colors.green
                          : Colors.red,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              'Trigger: ${automation.trigger} ${automation.actions.isNotEmpty ? '→ ${automation.actions.join(', ')}' : ''}',
              style: theme.textTheme.bodySmall?.copyWith(
                color: Colors.black,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
