import 'package:area/core/constants/app_colors.dart';
import 'package:flutter/material.dart';

class OAuthButton extends StatelessWidget {
  final String providerName;
  final IconData icon;
  final VoidCallback onPressed;
  final Color backgroundColor;
  final bool isExpanded;

  const OAuthButton({
    super.key,
    required this.providerName,
    required this.icon,
    required this.onPressed,
    required this.backgroundColor,
    this.isExpanded = false,
  });

  @override
  Widget build(BuildContext context) {
    final button = ElevatedButton(
      onPressed: onPressed,
      style: ElevatedButton.styleFrom(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        backgroundColor: backgroundColor,
        padding: const EdgeInsets.symmetric(vertical: 12),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: AppColors.areaLightGray),
          const SizedBox(width: 8),
          Text(providerName, style: TextStyle(color: AppColors.areaLightGray)),
        ],
      ),
    );

    return isExpanded ? Expanded(child: button) : button;
  }
}
