import 'dart:io';

import 'package:area/widgets/common/app_bar/custom_app_bar.dart';
import 'package:area/widgets/home/home_automation_card.dart';
import 'package:area/widgets/home/home_feature_item.dart';
import 'package:area/widgets/home/home_stat_card.dart';
import 'package:area/widgets/home/home_step_card.dart';
import 'package:flutter/material.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/services/secure_storage.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  HomeScreenState createState() => HomeScreenState();
}

class HomeScreenState extends State<HomeScreen> with WidgetsBindingObserver {
  late Future<bool> _isAuthenticatedFuture;
  bool _isDisposed = false;

  @override
  void initState() {
    super.initState();
    if (!_isTestMode()) {
      WidgetsBinding.instance.addObserver(this);
    }
    _isAuthenticatedFuture = _checkAuthentication();
  }

  @override
  void dispose() {
    _isDisposed = true;
    if (!_isTestMode()) {
      WidgetsBinding.instance.removeObserver(this);
    }
    super.dispose();
  }

  bool _isTestMode() {
    return Platform.environment.containsKey('FLUTTER_TEST');
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (_isDisposed) return;
    if (state == AppLifecycleState.resumed) {
      if (mounted) {
        setState(() {
          _isAuthenticatedFuture = _checkAuthentication();
        });
      }
    }
  }

  Future<bool> _checkAuthentication() async {
    final jwt = await getJwt();
    return jwt != null;
  }

  void _navigateToRegister() {
    Navigator.of(context).pushNamed('/register');
  }

  void _navigateToLogin() {
    Navigator.of(context).pushNamed('/login');
  }

  void _navigateToDashboard() {
    Navigator.of(context).pushNamed('/dashboard');
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final theme = Theme.of(context);
    final isMobile = MediaQuery.of(context).size.width < 600;

    return Scaffold(
      appBar: CustomAppBar(title: l10n.label_home),
      body: SingleChildScrollView(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 32.0),
              child: Image.asset(
                'assets/base-logo-resized.png',
                height: 100,
                fit: BoxFit.contain,
              ),
            ),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 40.0),
              child: Column(
                children: [
                  Text(
                    l10n.automate_your_life,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.headlineLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      fontSize: isMobile ? 28 : 40,
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    l10n.connect_favorite_apps,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodyLarge?.copyWith(fontSize: 16),
                  ),
                  const SizedBox(height: 30),
                  FutureBuilder<bool>(
                    future: _isAuthenticatedFuture,
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return const CircularProgressIndicator();
                      }

                      final isAuthenticated = snapshot.data ?? false;

                      return Column(
                        children: [
                          if (!isAuthenticated) ...[
                            ElevatedButton(
                              onPressed: _navigateToRegister,
                              style: ElevatedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 32,
                                  vertical: 16,
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    l10n.get_started_free,
                                    style: theme.textTheme.labelLarge?.copyWith(fontSize: 16),
                                  ),
                                  const SizedBox(width: 8),
                                  const Icon(Icons.arrow_forward, size: 20),
                                ],
                              ),
                            ),
                            if (isMobile) const SizedBox(height: 12),
                            OutlinedButton(
                              onPressed: _navigateToLogin,
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 32,
                                  vertical: 16,
                                ),
                              ),
                              child: Text(
                                l10n.sign_in,
                                style: theme.textTheme.labelLarge?.copyWith(fontSize: 16),
                              ),
                            ),
                          ] else
                            ElevatedButton(
                              onPressed: _navigateToDashboard,
                              style: ElevatedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 32,
                                  vertical: 16,
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    l10n.go_to_dashboard,
                                    style: theme.textTheme.labelLarge?.copyWith(fontSize: 16),
                                  ),
                                  const SizedBox(width: 8),
                                  const Icon(Icons.arrow_forward, size: 20),
                                ],
                              ),
                            ),
                        ],
                      );
                    },
                  ),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.symmetric(vertical: 40.0),
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                    child: Column(
                      children: [
                        HomeStatCard(number: l10n.active_automations, label: l10n.active_automations_label),
                        const SizedBox(height: 24),
                        HomeStatCard(number: l10n.connected_services_count, label: l10n.connected_services_label),
                        const SizedBox(height: 24),
                        HomeStatCard(number: l10n.happy_users, label: l10n.happy_users_label),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 40.0),
              child: Column(
                children: [
                  Text(
                    l10n.how_it_works,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      fontSize: 32,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    l10n.create_powerful_automations,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodyLarge,
                  ),
                  const SizedBox(height: 32),
                  Column(
                    children: [
                      HomeStepCard(
                        step: 1,
                        title: l10n.choose_a_trigger,
                        description: l10n.select_app_event,
                      ),
                      const SizedBox(height: 16),
                      HomeStepCard(
                        step: 2,
                        title: l10n.add_an_action,
                        description: l10n.choose_what_happens,
                      ),
                      const SizedBox(height: 16),
                      HomeStepCard(
                        step: 3,
                        title: l10n.activate_relax,
                        description: l10n.automation_runs_automatically,
                      ),
                    ],
                  ),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 40.0),
              child: Column(
                children: [
                  Text(
                    l10n.popular_automations,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      fontSize: 32,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    l10n.get_inspired,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodyLarge,
                  ),
                  const SizedBox(height: 32),
                  Column(
                    children: [
                      HomeAutomationCard(
                        icon: '📧',
                        title: l10n.email_to_slack,
                        description: l10n.slack_email_notifications,
                      ),
                      const SizedBox(height: 12),
                      HomeAutomationCard(
                        icon: '📱',
                        title: l10n.social_media_sync,
                        description: l10n.post_multiple_networks,
                      ),
                      const SizedBox(height: 12),
                      HomeAutomationCard(
                        icon: '📅',
                        title: l10n.calendar_reminders,
                        description: l10n.sms_calendar_reminders,
                      ),
                      const SizedBox(height: 12),
                      HomeAutomationCard(
                        icon: '💾',
                        title: l10n.file_backup,
                        description: l10n.automatic_cloud_backup,
                      ),
                      const SizedBox(height: 12),
                      HomeAutomationCard(
                        icon: '✅',
                        title: l10n.task_management,
                        description: l10n.create_tasks_from_emails,
                      ),
                      const SizedBox(height: 12),
                      HomeAutomationCard(
                        icon: '📊',
                        title: l10n.data_collection,
                        description: l10n.save_forms_to_spreadsheets,
                      ),
                    ],
                  ),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 40.0),
              child: Column(
                children: [
                  HomeFeatureItem(
                    icon: Icons.flash_on,
                    title: l10n.lightning_fast,
                    description: l10n.automations_run_instantly,
                  ),
                  const SizedBox(height: 24),
                  HomeFeatureItem(
                    icon: Icons.schedule,
                    title: l10n.save_time,
                    description: l10n.automate_repetitive_tasks,
                  ),
                  const SizedBox(height: 24),
                  HomeFeatureItem(
                    icon: Icons.shield,
                    title: l10n.secure_reliable,
                    description: l10n.enterprise_grade_security,
                  ),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 40.0),
              child: Column(
                children: [
                  Text(
                    l10n.ready_to_automate,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      fontSize: 32,
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    l10n.join_millions_users,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodyLarge,
                  ),
                  const SizedBox(height: 30),
                  FutureBuilder<bool>(
                    future: _isAuthenticatedFuture,
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return const CircularProgressIndicator();
                      }

                      final isAuthenticated = snapshot.data ?? false;

                      return ElevatedButton(
                        onPressed: isAuthenticated
                            ? _navigateToDashboard
                            : _navigateToRegister,
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              isAuthenticated ? l10n.go_to_my_areas : l10n.start_for_free,
                              style: theme.textTheme.labelLarge?.copyWith(fontSize: 16),
                            ),
                            const SizedBox(width: 8),
                            const Icon(Icons.arrow_forward, size: 20),
                          ],
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),

            // Footer
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 24.0),
              child: Text(
                l10n.copyright_notice,
                style: theme.textTheme.bodySmall,
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
