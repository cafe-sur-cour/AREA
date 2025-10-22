import 'package:area/core/constants/app_colors.dart';
import 'package:flutter/material.dart';

class PrimaryButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final IconData? icon;
  final double? iconSize;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final EdgeInsetsGeometry? padding;
  final double borderRadius;

  const PrimaryButton({
    super.key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
    this.icon,
    this.iconSize,
    this.backgroundColor,
    this.foregroundColor,
    this.padding,
    this.borderRadius = 8,
  });

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    final button = icon != null
        ? ElevatedButton.icon(
            onPressed: onPressed,
            icon: Icon(
              icon,
              color: foregroundColor ?? AppColors.areaLightGray,
              size: iconSize,
            ),
            label: Text(
              text,
              style: TextStyle(color: foregroundColor ?? AppColors.areaLightGray),
            ),
            style: _buildButtonStyle(),
          )
        : ElevatedButton(
            onPressed: onPressed,
            style: _buildButtonStyle(),
            child: Text(
              text,
              style: TextStyle(color: foregroundColor ?? AppColors.areaLightGray),
            ),
          );

    return button;
  }

  ButtonStyle _buildButtonStyle() {
    return ElevatedButton.styleFrom(
      backgroundColor: backgroundColor ?? AppColors.primary,
      foregroundColor: foregroundColor ?? AppColors.areaLightGray,
      padding: padding ?? const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(borderRadius)),
    );
  }
}
