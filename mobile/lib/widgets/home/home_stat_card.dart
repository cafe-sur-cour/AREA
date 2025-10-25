import 'package:flutter/material.dart';

class HomeStatCard extends StatelessWidget {
  final String number;
  final String label;

  const HomeStatCard({
    super.key,
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
        Text(label, style: theme.textTheme.bodyMedium),
      ],
    );
  }
}
