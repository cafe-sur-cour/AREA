import 'package:flutter/material.dart';

class HomeAutomationCard extends StatelessWidget {
  final String icon;
  final String title;
  final String description;

  const HomeAutomationCard({
    super.key,
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
            Text(icon, style: const TextStyle(fontSize: 36)),
            const SizedBox(height: 16),
            Text(
              title,
              style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            Text(description, style: theme.textTheme.bodySmall),
          ],
        ),
      ),
    );
  }
}
