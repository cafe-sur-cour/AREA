import 'package:area/core/constants/app_colors.dart';
import 'package:flutter/material.dart';

class CustomAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget>? actions;
  final bool centerTitle;
  final Color? bgColor;
  final Color? fgColor;

  const CustomAppBar({
    super.key,
    required this.title,
    this.actions,
    this.centerTitle = false,
    this.bgColor,
    this.fgColor,
  });

  @override
  Widget build(BuildContext context) {
    return AppBar(
      title: Text(
        title,
        style: const TextStyle(fontFamily: 'Montserrat', fontWeight: FontWeight.bold),
      ),
      centerTitle: centerTitle,
      backgroundColor: bgColor ?? AppColors.areaBlue3,
      foregroundColor: fgColor ?? AppColors.areaLightGray,
      actions: actions,
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
