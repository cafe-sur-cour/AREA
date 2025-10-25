import 'package:flutter/material.dart';

class SecondaryButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final IconData? icon;
  final Color? color;
  final double borderRadius;

  const SecondaryButton({
    super.key,
    required this.text,
    this.onPressed,
    this.icon,
    this.color,
    this.borderRadius = 8,
  });

  @override
  Widget build(BuildContext context) {
    final button = icon != null
        ? ElevatedButton.icon(
            onPressed: onPressed,
            icon: Icon(icon),
            label: Text(text),
            style: _buildButtonStyle(),
          )
        : ElevatedButton(onPressed: onPressed, style: _buildButtonStyle(), child: Text(text));

    return button;
  }

  ButtonStyle _buildButtonStyle() {
    return ElevatedButton.styleFrom(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(borderRadius)),
      foregroundColor: color,
    );
  }
}
