import 'dart:io';

import 'package:area/widgets/common/app_bar/custom_app_bar.dart';
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
    // Only add observer in release/profile mode, not during tests
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
    // Check if running in test mode by looking for flutter test environment
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
                    'Automate your life with powerful connections',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.headlineLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      fontSize: isMobile ? 28 : 40,
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'Connect your favorite apps and services to create powerful automations. Save time and focus on what matters most.',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodyLarge?.copyWith(
                      fontSize: 16,
                    ),
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
                                    'Get started free',
                                    style: theme.textTheme.labelLarge?.copyWith(
                                      fontSize: 16,
                                    ),
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
                                'Sign in',
                                style: theme.textTheme.labelLarge?.copyWith(
                                  fontSize: 16,
                                ),
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
                                    'Go to Dashboard',
                                    style: theme.textTheme.labelLarge?.copyWith(
                                      fontSize: 16,
                                    ),
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
                        _StatCard(
                          number: '10M+',
                          label: 'Active automations',
                        ),
                        const SizedBox(height: 24),
                        _StatCard(
                          number: '500+',
                          label: 'Connected services',
                        ),
                        const SizedBox(height: 24),
                        _StatCard(
                          number: '2M+',
                          label: 'Happy users',
                        ),
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
                    'How it works',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      fontSize: 32,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Create powerful automations in three simple steps',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodyLarge,
                  ),
                  const SizedBox(height: 32),
                  Column(
                    children: [
                      _StepCard(
                        step: 1,
                        title: 'Choose a trigger',
                        description:
                            'Select an app and event that starts your automation',
                      ),
                      const SizedBox(height: 16),
                      _StepCard(
                        step: 2,
                        title: 'Add an action',
                        description:
                            'Choose what happens when your trigger fires',
                      ),
                      const SizedBox(height: 16),
                      _StepCard(
                        step: 3,
                        title: 'Activate & relax',
                        description:
                            'Your automation runs automatically in the background',
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
                    'Popular automations',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      fontSize: 32,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Get inspired by what others are building',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodyLarge,
                  ),
                  const SizedBox(height: 32),
                  Column(
                    children: [
                      _AutomationCard(
                        icon: '📧',
                        title: 'Email to Slack',
                        description:
                            'Get notified in Slack when you receive important emails',
                      ),
                      const SizedBox(height: 12),
                      _AutomationCard(
                        icon: '📱',
                        title: 'Social Media Sync',
                        description: 'Post to multiple social networks at once',
                      ),
                      const SizedBox(height: 12),
                      _AutomationCard(
                        icon: '📅',
                        title: 'Calendar Reminders',
                        description: 'Send SMS reminders before calendar events',
                      ),
                      const SizedBox(height: 12),
                      _AutomationCard(
                        icon: '💾',
                        title: 'File Backup',
                        description:
                            'Automatically backup files to cloud storage',
                      ),
                      const SizedBox(height: 12),
                      _AutomationCard(
                        icon: '✅',
                        title: 'Task Management',
                        description: 'Create tasks from emails or messages',
                      ),
                      const SizedBox(height: 12),
                      _AutomationCard(
                        icon: '📊',
                        title: 'Data Collection',
                        description: 'Save form responses to spreadsheets',
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
                  _FeatureItem(
                    icon: Icons.flash_on,
                    title: 'Lightning fast',
                    description:
                        'Your automations run instantly when triggered, with no delays or waiting.',
                  ),
                  const SizedBox(height: 24),
                  _FeatureItem(
                    icon: Icons.schedule,
                    title: 'Save time',
                    description:
                        'Automate repetitive tasks and focus on what really matters to you.',
                  ),
                  const SizedBox(height: 24),
                  _FeatureItem(
                    icon: Icons.shield,
                    title: 'Secure & reliable',
                    description:
                        'Enterprise-grade security with 99.9% uptime guarantee for your peace of mind.',
                  ),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 40.0),
              child: Column(
                children: [
                  Text(
                    'Ready to automate your workflow?',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      fontSize: 32,
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'Join millions of users who are already saving time with powerful automations.',
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
                        onPressed: isAuthenticated ? _navigateToDashboard : _navigateToRegister,
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
                              isAuthenticated ? 'Go to My AREAs' : 'Start for free',
                              style: theme.textTheme.labelLarge?.copyWith(
                                fontSize: 16,
                              ),
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
                '© 2025 Area. All rights reserved.',
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

class _StatCard extends StatelessWidget {
  final String number;
  final String label;

  const _StatCard({
    required this.number,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          number,
          style: theme.textTheme.headlineMedium?.copyWith(
            fontWeight: FontWeight.bold,
            fontSize: 36,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: theme.textTheme.bodyMedium,
        ),
      ],
    );
  }
}

class _StepCard extends StatelessWidget {
  final int step;
  final String title;
  final String description;

  const _StepCard({
    required this.step,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: theme.primaryColor,
              ),
              child: Center(
                child: Text(
                  '$step',
                  style: theme.textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              title,
              textAlign: TextAlign.center,
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              description,
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium,
            ),
          ],
        ),
      ),
    );
  }
}

class _AutomationCard extends StatelessWidget {
  final String icon;
  final String title;
  final String description;

  const _AutomationCard({
    required this.icon,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              icon,
              style: const TextStyle(fontSize: 36),
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              description,
              style: theme.textTheme.bodySmall,
            ),
          ],
        ),
      ),
    );
  }
}

class _FeatureItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;

  const _FeatureItem({
    required this.icon,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8),
            color: theme.primaryColor.withAlpha(26),
          ),
          child: Icon(
            icon,
            color: theme.primaryColor,
            size: 24,
          ),
        ),
        const SizedBox(height: 16),
        Text(
          title,
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          description,
          style: theme.textTheme.bodyMedium,
        ),
      ],
    );
  }
}
