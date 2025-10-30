import 'package:area/core/constants/app_constants.dart';
import 'package:area/core/notifiers/backend_address_notifier.dart';
import 'package:area/core/notifiers/navigation_index_notifier.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/services/secure_http_client.dart';
import 'package:area/services/secure_storage.dart';
import 'package:area/widgets/common/app_bar/custom_app_bar.dart';
import 'package:area/widgets/common/buttons/primary_button.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class AboutScreen extends StatefulWidget {
  const AboutScreen({super.key});

  @override
  State<AboutScreen> createState() => _AboutScreenState();
}

class _AboutScreenState extends State<AboutScreen> {
  bool _isAuthenticated = false;

  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    final jwt = await getJwt();
    if (!mounted) {
      setState(() {
        _isAuthenticated = false;
      });
      return;
    }
    final backendAddressNotifier = Provider.of<BackendAddressNotifier>(context, listen: false);
    final backendAddress = backendAddressNotifier.backendAddress!;
    final url = Uri.parse(backendAddress + AppRoutes.jwtCheck);

    if (jwt == null) {
      setState(() {
        _isAuthenticated = false;
      });
      return;
    }
    final headers = {'Authorization': "Bearer $jwt"};
    final client = SecureHttpClient.getClient();

    try {
      final response = await client.get(url, headers: headers);
      if (response.statusCode != 200) {
        await deleteJwt();
        setState(() {
          _isAuthenticated = false;
        });
        return;
      }
    } catch (e) {
      await deleteJwt();
      setState(() {
        _isAuthenticated = false;
      });
      return;
    }
    setState(() {
      _isAuthenticated = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final theme = Theme.of(context);
    final primaryColor = theme.primaryColor;

    return Scaffold(
      appBar: CustomAppBar(title: l10n.about),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Hero Section
            Container(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  Text(
                    l10n.about_hero_title,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.headlineLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      fontSize: 32,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    l10n.about_hero_title_highlight,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.headlineLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      fontSize: 32,
                      color: primaryColor,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    l10n.about_hero_description,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodyLarge?.copyWith(color: Colors.grey[600]),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Mission Section
            Container(
              padding: const EdgeInsets.all(24),
              color: Colors.grey[50],
              child: Column(
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: primaryColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(Icons.track_changes, color: primaryColor, size: 32),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Text(
                          l10n.about_mission_title,
                          style: theme.textTheme.headlineMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    l10n.about_mission_description1,
                    style: theme.textTheme.bodyLarge?.copyWith(color: Colors.grey[700]),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    l10n.about_mission_description2,
                    style: theme.textTheme.bodyLarge?.copyWith(color: Colors.grey[700]),
                  ),
                  const SizedBox(height: 24),
                  // Stats Grid
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 1.5,
                    children: [
                      _buildStatCard(theme, '2M+', l10n.about_mission_stats_users),
                      _buildStatCard(theme, '10M+', l10n.about_mission_stats_automations),
                      _buildStatCard(theme, '500+', l10n.about_mission_stats_integrations),
                      _buildStatCard(theme, '99.9%', l10n.about_mission_stats_uptime),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 32),

            // Values Section
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  Text(
                    l10n.about_values_title,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    l10n.about_values_subtitle,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodyLarge?.copyWith(color: Colors.grey[600]),
                  ),
                  const SizedBox(height: 24),
                  _buildValueCard(
                    theme,
                    Icons.people,
                    Colors.blue,
                    l10n.about_values_user_centric_title,
                    l10n.about_values_user_centric_description,
                  ),
                  const SizedBox(height: 16),
                  _buildValueCard(
                    theme,
                    Icons.bolt,
                    Colors.purple,
                    l10n.about_values_innovation_title,
                    l10n.about_values_innovation_description,
                  ),
                  const SizedBox(height: 16),
                  _buildValueCard(
                    theme,
                    Icons.shield,
                    Colors.green,
                    l10n.about_values_security_title,
                    l10n.about_values_security_description,
                  ),
                  const SizedBox(height: 16),
                  _buildValueCard(
                    theme,
                    Icons.language,
                    Colors.orange,
                    l10n.about_values_global_title,
                    l10n.about_values_global_description,
                  ),
                  const SizedBox(height: 16),
                  _buildValueCard(
                    theme,
                    Icons.code,
                    Colors.teal,
                    l10n.about_values_open_source_title,
                    l10n.about_values_open_source_description,
                  ),
                  const SizedBox(height: 16),
                  _buildValueCard(
                    theme,
                    Icons.favorite,
                    primaryColor,
                    l10n.about_values_passion_title,
                    l10n.about_values_passion_description,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Story Section
            Container(
              padding: const EdgeInsets.all(24),
              color: Colors.grey[50],
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: primaryColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Icon(Icons.rocket_launch, color: primaryColor, size: 40),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    l10n.about_story_title,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    l10n.about_story_paragraph1,
                    style: theme.textTheme.bodyLarge?.copyWith(color: Colors.grey[700]),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    l10n.about_story_paragraph2,
                    style: theme.textTheme.bodyLarge?.copyWith(color: Colors.grey[700]),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    l10n.about_story_paragraph3,
                    style: theme.textTheme.bodyLarge?.copyWith(color: Colors.grey[700]),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    l10n.about_story_paragraph4,
                    style: theme.textTheme.bodyLarge?.copyWith(color: Colors.grey[700]),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 32),

            // Technology Section
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  Text(
                    l10n.about_technology_title,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    l10n.about_technology_subtitle,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodyLarge?.copyWith(color: Colors.grey[600]),
                  ),
                  const SizedBox(height: 24),
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 1.2,
                    children: [
                      _buildTechCard(theme, '⚡', 'Next.js'),
                      _buildTechCard(theme, '📘', 'TypeScript'),
                      _buildTechCard(theme, '📱', 'Flutter'),
                      _buildTechCard(theme, '🚂', 'Express'),
                      _buildTechCard(theme, '🐘', 'PostgreSQL'),
                      _buildTechCard(theme, '🐳', 'Docker'),
                      _buildTechCard(theme, '🔄', 'GitHub Actions'),
                      _buildTechCard(theme, '🎨', 'Tailwind CSS'),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Why Choose Section
            Container(
              padding: const EdgeInsets.all(24),
              color: Colors.grey[50],
              child: Column(
                children: [
                  Text(
                    l10n.about_why_choose_title,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    l10n.about_why_choose_subtitle,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodyLarge?.copyWith(color: Colors.grey[600]),
                  ),
                  const SizedBox(height: 24),
                  _buildWhyChooseCard(
                    theme,
                    Icons.star,
                    primaryColor,
                    l10n.about_why_choose_easy_to_use_title,
                    l10n.about_why_choose_easy_to_use_description,
                  ),
                  const SizedBox(height: 16),
                  _buildWhyChooseCard(
                    theme,
                    Icons.bolt,
                    Colors.purple,
                    l10n.about_why_choose_lightning_fast_title,
                    l10n.about_why_choose_lightning_fast_description,
                  ),
                  const SizedBox(height: 16),
                  _buildWhyChooseCard(
                    theme,
                    Icons.shield,
                    Colors.green,
                    l10n.about_why_choose_enterprise_security_title,
                    l10n.about_why_choose_enterprise_security_description,
                  ),
                  const SizedBox(height: 16),
                  _buildWhyChooseCard(
                    theme,
                    Icons.support_agent,
                    Colors.orange,
                    l10n.about_why_choose_amazing_support_title,
                    l10n.about_why_choose_amazing_support_description,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 32),

            // CTA Section
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  Text(
                    l10n.about_cta_title,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    l10n.about_cta_description,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodyLarge?.copyWith(color: Colors.grey[600]),
                  ),
                  const SizedBox(height: 24),
                  if (_isAuthenticated) ...[
                    SizedBox(
                      width: double.infinity,
                      child: PrimaryButton(
                        text: l10n.about_cta_button_dashboard,
                        icon: Icons.arrow_forward,
                        onPressed: () {
                          Navigator.pushNamed(context, '/dashboard');
                        },
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                    ),
                  ] else ...[
                    SizedBox(
                      width: double.infinity,
                      child: PrimaryButton(
                        text: l10n.about_cta_button_start,
                        icon: Icons.arrow_forward,
                        onPressed: () {
                          Navigator.pushNamed(context, '/register');
                        },
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () {
                          final navIndex = Provider.of<NavigationIndexNotifier>(
                            context,
                            listen: false,
                          );
                          navIndex.setNavIndex(1);
                          Navigator.of(
                            context,
                          ).pushNamedAndRemoveUntil('/', (Route<dynamic> route) => false);
                        },
                        icon: const Icon(Icons.explore),
                        label: Text(l10n.about_cta_button_explore),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(ThemeData theme, String value, String label) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              value,
              style: theme.textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: theme.primaryColor,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              textAlign: TextAlign.center,
              style: theme.textTheme.bodySmall?.copyWith(color: Colors.grey[600]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildValueCard(
    ThemeData theme,
    IconData icon,
    Color color,
    String title,
    String description,
  ) {
    return Card(
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    description,
                    style: theme.textTheme.bodyMedium?.copyWith(color: Colors.grey[700]),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTechCard(ThemeData theme, String emoji, String name) {
    return Card(
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(emoji, style: const TextStyle(fontSize: 32)),
            const SizedBox(height: 8),
            Text(
              name,
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWhyChooseCard(
    ThemeData theme,
    IconData icon,
    Color color,
    String title,
    String description,
  ) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              description,
              style: theme.textTheme.bodyMedium?.copyWith(color: Colors.grey[700]),
            ),
          ],
        ),
      ),
    );
  }
}
