import 'package:flutter/material.dart';

class HomeFeatureItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;

  const HomeFeatureItem({
    super.key,
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
          child: Icon(icon, color: theme.primaryColor, size: 24),
        ),
        const SizedBox(height: 16),
        Text(title, style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        Text(description, style: theme.textTheme.bodyMedium),
      ],
    );
  }
}
