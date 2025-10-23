import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:area/core/themes/app_theme.dart';
import 'package:area/core/constants/app_colors.dart';
import 'package:area/core/constants/app_constants.dart';
import 'package:area/core/constants/app_text_styles.dart';

void main() {
  group('AppTheme', () {
    group('lightTheme', () {
      test('should have correct brightness', () {
        expect(AppTheme.lightTheme.brightness, Brightness.light);
      });

      test('should have correct color scheme', () {
        final colorScheme = AppTheme.lightTheme.colorScheme;

        expect(colorScheme.primary, AppColors.primary);
        expect(colorScheme.secondary, AppColors.secondary);
        expect(colorScheme.surface, AppColors.background);
        expect(colorScheme.error, AppColors.error);
        expect(colorScheme.onPrimary, AppColors.areaLightGray);
        expect(colorScheme.onSecondary, AppColors.areaLightGray);
        expect(colorScheme.onSurface, AppColors.textPrimary);
        expect(colorScheme.onError, AppColors.areaLightGray);
      });

      test('should have correct app bar theme', () {
        final appBarTheme = AppTheme.lightTheme.appBarTheme;

        expect(appBarTheme.elevation, AppDimensions.appBarElevation);
        expect(appBarTheme.backgroundColor, AppColors.primary);
        expect(appBarTheme.foregroundColor, AppColors.areaLightGray);
        expect(appBarTheme.titleTextStyle?.fontFamily, 'Montserrat');
        expect(appBarTheme.titleTextStyle?.color, AppColors.areaLightGray);
        expect(appBarTheme.titleTextStyle?.fontSize, 20);
        expect(appBarTheme.titleTextStyle?.fontWeight, FontWeight.w600);
      });

      test('should have correct bottom navigation bar theme', () {
        final bottomNavTheme = AppTheme.lightTheme.bottomNavigationBarTheme;

        expect(bottomNavTheme.backgroundColor, AppColors.background);
        expect(bottomNavTheme.selectedItemColor, AppColors.primary);
        expect(bottomNavTheme.unselectedItemColor, AppColors.textSecondary);
        expect(bottomNavTheme.type, BottomNavigationBarType.fixed);
        expect(bottomNavTheme.elevation, 8);
      });

      test('should have correct text theme', () {
        final textTheme = AppTheme.lightTheme.textTheme;

        expect(textTheme.headlineLarge?.fontFamily, 'Montserrat');
        expect(textTheme.headlineLarge?.fontSize, 32);
        expect(textTheme.headlineLarge?.fontWeight, FontWeight.w600);
        expect(textTheme.headlineLarge?.color, AppColors.textPrimary);

        expect(textTheme.headlineMedium?.fontFamily, 'Montserrat');
        expect(textTheme.headlineMedium?.fontSize, 24);
        expect(textTheme.headlineMedium?.fontWeight, FontWeight.w500);
        expect(textTheme.headlineMedium?.color, AppColors.textPrimary);

        expect(textTheme.headlineSmall?.fontFamily, 'Montserrat');
        expect(textTheme.headlineSmall?.fontSize, 20);
        expect(textTheme.headlineSmall?.fontWeight, FontWeight.w400);
        expect(textTheme.headlineSmall?.color, AppColors.textPrimary);

        expect(textTheme.bodyLarge?.fontFamily, 'OpenSans');
        expect(textTheme.bodyLarge?.fontSize, 16);
        expect(textTheme.bodyLarge?.fontWeight, FontWeight.w400);
        expect(textTheme.bodyLarge?.color, AppColors.textPrimary);

        expect(textTheme.bodyMedium?.fontFamily, 'OpenSans');
        expect(textTheme.bodyMedium?.fontSize, 14);
        expect(textTheme.bodyMedium?.fontWeight, FontWeight.w400);
        expect(textTheme.bodyMedium?.color, AppColors.textSecondary);

        expect(textTheme.bodySmall?.fontFamily, 'OpenSans');
        expect(textTheme.bodySmall?.fontSize, 12);
        expect(textTheme.bodySmall?.fontWeight, FontWeight.w300);
        expect(textTheme.bodySmall?.color, AppColors.textHint);
      });

      test('should have correct icon theme', () {
        final iconTheme = AppTheme.lightTheme.iconTheme;

        expect(iconTheme.color, AppColors.textSecondary);
        expect(iconTheme.size, AppDimensions.iconSizeMD);
      });
    });

    group('darkTheme', () {
      test('should have correct brightness', () {
        expect(AppTheme.darkTheme.brightness, Brightness.dark);
      });

      test('should have correct color scheme', () {
        final colorScheme = AppTheme.darkTheme.colorScheme;

        expect(colorScheme.primary, AppColors.primary);
        expect(colorScheme.secondary, AppColors.secondary);
        expect(colorScheme.surface, AppColors.background);
        expect(colorScheme.error, AppColors.error);
        expect(colorScheme.onPrimary, AppColors.areaLightGray);
        expect(colorScheme.onSecondary, AppColors.areaLightGray);
        expect(colorScheme.onSurface, AppColors.textPrimary);
        expect(colorScheme.onError, AppColors.areaLightGray);
      });

      test('should have correct app bar theme', () {
        final appBarTheme = AppTheme.darkTheme.appBarTheme;

        expect(appBarTheme.elevation, AppDimensions.appBarElevation);
        expect(appBarTheme.backgroundColor, AppColors.primary);
        expect(appBarTheme.foregroundColor, AppColors.areaLightGray);
        expect(appBarTheme.titleTextStyle?.fontFamily, 'Montserrat');
        expect(appBarTheme.titleTextStyle?.color, AppColors.areaLightGray);
        expect(appBarTheme.titleTextStyle?.fontSize, 20);
        expect(appBarTheme.titleTextStyle?.fontWeight, FontWeight.w600);
      });

      test('should have correct bottom navigation bar theme', () {
        final bottomNavTheme = AppTheme.darkTheme.bottomNavigationBarTheme;

        expect(bottomNavTheme.backgroundColor, AppColors.background);
        expect(bottomNavTheme.selectedItemColor, AppColors.primary);
        expect(bottomNavTheme.unselectedItemColor, AppColors.textSecondary);
        expect(bottomNavTheme.type, BottomNavigationBarType.fixed);
        expect(bottomNavTheme.elevation, 8);
      });

      test('should have correct text theme', () {
        final textTheme = AppTheme.darkTheme.textTheme;

        expect(textTheme.headlineLarge?.fontFamily, 'Montserrat');
        expect(textTheme.headlineLarge?.fontSize, 32);
        expect(textTheme.headlineLarge?.fontWeight, FontWeight.w600);
        expect(textTheme.headlineLarge?.color, AppColors.textPrimary);

        expect(textTheme.headlineMedium?.fontFamily, 'Montserrat');
        expect(textTheme.headlineMedium?.fontSize, 24);
        expect(textTheme.headlineMedium?.fontWeight, FontWeight.w500);
        expect(textTheme.headlineMedium?.color, AppColors.textPrimary);

        expect(textTheme.headlineSmall?.fontFamily, 'Montserrat');
        expect(textTheme.headlineSmall?.fontSize, 20);
        expect(textTheme.headlineSmall?.fontWeight, FontWeight.w400);
        expect(textTheme.headlineSmall?.color, AppColors.textPrimary);

        expect(textTheme.bodyLarge?.fontFamily, 'OpenSans');
        expect(textTheme.bodyLarge?.fontSize, 16);
        expect(textTheme.bodyLarge?.fontWeight, FontWeight.w400);
        expect(textTheme.bodyLarge?.color, AppColors.textPrimary);

        expect(textTheme.bodyMedium?.fontFamily, 'OpenSans');
        expect(textTheme.bodyMedium?.fontSize, 14);
        expect(textTheme.bodyMedium?.fontWeight, FontWeight.w400);
        expect(textTheme.bodyMedium?.color, AppColors.textSecondary);

        expect(textTheme.bodySmall?.fontFamily, 'OpenSans');
        expect(textTheme.bodySmall?.fontSize, 12);
        expect(textTheme.bodySmall?.fontWeight, FontWeight.w300);
        expect(textTheme.bodySmall?.color, AppColors.textHint);
      });

      test('should have correct icon theme', () {
        final iconTheme = AppTheme.darkTheme.iconTheme;

        expect(iconTheme.color, AppColors.textSecondary);
        expect(iconTheme.size, AppDimensions.iconSizeMD);
      });
    });
  });
}
