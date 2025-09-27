import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import '../constants/app_constants.dart';
import '../constants/app_text_styles.dart';

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: const ColorScheme.light(
        primary: AppColors.primary,
        secondary: AppColors.secondary,
        surface: AppColors.background,
        error: AppColors.error,
        onPrimary: AppColors.areaLightGray,
        onSecondary: AppColors.areaLightGray,
        onSurface: AppColors.textPrimary,
        onError: AppColors.areaLightGray,
      ),

      // AppBar Theme
      appBarTheme: const AppBarTheme(
        elevation: AppDimensions.appBarElevation,
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.areaLightGray,
        titleTextStyle: TextStyle(
          fontFamily: 'Montserrat',
          color: AppColors.areaLightGray,
          fontSize: 20,
          fontWeight: FontWeight.w600,
        ),
      ),

      // Bottom Navigation Bar Theme
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.background,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.textSecondary,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),

      textTheme: const TextTheme(
        headlineLarge: AppTextStyles.headlineLarge,
        headlineMedium: AppTextStyles.headlineMedium,
        headlineSmall: AppTextStyles.headlineSmall,
        bodyLarge: AppTextStyles.bodyLarge,
        bodyMedium: AppTextStyles.bodyMedium,
        bodySmall: AppTextStyles.bodySmall,
      ),

      iconTheme: const IconThemeData(
        color: AppColors.textSecondary,
        size: AppDimensions.iconSizeMD,
      ),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: const ColorScheme.dark(
        primary: AppColors.primary,
        secondary: AppColors.secondary,
        surface: AppColors.background,
        error: AppColors.error,
        onPrimary: AppColors.areaLightGray,
        onSecondary: AppColors.areaLightGray,
        onSurface: AppColors.textPrimary,
        onError: AppColors.areaLightGray,
      ),

      // AppBar Theme
      appBarTheme: const AppBarTheme(
        elevation: AppDimensions.appBarElevation,
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.areaLightGray,
        titleTextStyle: TextStyle(
          fontFamily: 'Montserrat',
          color: AppColors.areaLightGray,
          fontSize: 20,
          fontWeight: FontWeight.w600,
        ),
      ),

      // Bottom Navigation Bar Theme
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.background,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.textSecondary,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),

      textTheme: const TextTheme(
        headlineLarge: AppTextStyles.headlineLarge,
        headlineMedium: AppTextStyles.headlineMedium,
        headlineSmall: AppTextStyles.headlineSmall,
        bodyLarge: AppTextStyles.bodyLarge,
        bodyMedium: AppTextStyles.bodyMedium,
        bodySmall: AppTextStyles.bodySmall,
      ),

      iconTheme: const IconThemeData(
        color: AppColors.textSecondary,
        size: AppDimensions.iconSizeMD,
      ),
    );
  }
}
