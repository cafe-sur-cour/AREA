import 'package:area/core/constants/app_colors.dart';
import 'package:flutter/material.dart';

void showSuccessSnackbar(BuildContext context, String message) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(message, style: TextStyle(color: AppColors.areaLightGray, fontSize: 16)),
      backgroundColor: AppColors.success,
      duration: const Duration(seconds: 3),
    ),
  );
}

void showErrorSnackbar(BuildContext context, String message) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(message, style: TextStyle(color: AppColors.areaLightGray, fontSize: 16)),
      backgroundColor: AppColors.error,
      duration: const Duration(seconds: 4),
    ),
  );
}

void showInfoSnackbar(BuildContext context, String message) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(message, style: TextStyle(color: AppColors.areaLightGray, fontSize: 16)),
      backgroundColor: AppColors.primary,
      duration: const Duration(seconds: 3),
    ),
  );
}
