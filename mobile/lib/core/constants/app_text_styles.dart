import 'package:flutter/material.dart';
import 'app_colors.dart';

// Text styles following the AREA brand style guide

class AppTextStyles {
  // Montserrat - Headlines and Titles

  static const TextStyle montserratLight = TextStyle(
    fontFamily: 'Montserrat',
    fontWeight: FontWeight.w300,
    color: AppColors.textPrimary,
  );

  static const TextStyle montserratLightItalic = TextStyle(
    fontFamily: 'Montserrat',
    fontWeight: FontWeight.w300,
    fontStyle: FontStyle.italic,
    color: AppColors.textPrimary,
  );

  static const TextStyle montserratNormal = TextStyle(
    fontFamily: 'Montserrat',
    fontWeight: FontWeight.w400,
    color: AppColors.textPrimary,
  );

  static const TextStyle montserratNormalItalic = TextStyle(
    fontFamily: 'Montserrat',
    fontWeight: FontWeight.w400,
    fontStyle: FontStyle.italic,
    color: AppColors.textPrimary,
  );

  static const TextStyle montserratMedium = TextStyle(
    fontFamily: 'Montserrat',
    fontWeight: FontWeight.w500,
    color: AppColors.textPrimary,
  );

  static const TextStyle montserratMediumItalic = TextStyle(
    fontFamily: 'Montserrat',
    fontWeight: FontWeight.w500,
    fontStyle: FontStyle.italic,
    color: AppColors.textPrimary,
  );

  static const TextStyle montserratSemiBold = TextStyle(
    fontFamily: 'Montserrat',
    fontWeight: FontWeight.w600,
    color: AppColors.textPrimary,
  );

  static const TextStyle montserratSemiBoldItalic = TextStyle(
    fontFamily: 'Montserrat',
    fontWeight: FontWeight.w600,
    fontStyle: FontStyle.italic,
    color: AppColors.textPrimary,
  );

  // Open Sans - Body Text

  static const TextStyle openSansLight = TextStyle(
    fontFamily: 'OpenSans',
    fontWeight: FontWeight.w300,
    color: AppColors.textPrimary,
  );

  static const TextStyle openSansLightItalic = TextStyle(
    fontFamily: 'OpenSans',
    fontWeight: FontWeight.w300,
    fontStyle: FontStyle.italic,
    color: AppColors.textPrimary,
  );

  static const TextStyle openSansNormal = TextStyle(
    fontFamily: 'OpenSans',
    fontWeight: FontWeight.w400,
    color: AppColors.textPrimary,
  );

  static const TextStyle openSansNormalItalic = TextStyle(
    fontFamily: 'OpenSans',
    fontWeight: FontWeight.w400,
    fontStyle: FontStyle.italic,
    color: AppColors.textPrimary,
  );

  static const TextStyle openSansMedium = TextStyle(
    fontFamily: 'OpenSans',
    fontWeight: FontWeight.w500,
    color: AppColors.textPrimary,
  );

  static const TextStyle openSansMediumItalic = TextStyle(
    fontFamily: 'OpenSans',
    fontWeight: FontWeight.w500,
    fontStyle: FontStyle.italic,
    color: AppColors.textPrimary,
  );

  static const TextStyle openSansSemiBold = TextStyle(
    fontFamily: 'OpenSans',
    fontWeight: FontWeight.w600,
    color: AppColors.textPrimary,
  );

  static const TextStyle openSansSemiBoldItalic = TextStyle(
    fontFamily: 'OpenSans',
    fontWeight: FontWeight.w600,
    fontStyle: FontStyle.italic,
    color: AppColors.textPrimary,
  );

  // Predefined sizes for common use cases

  static const TextStyle headlineLarge = TextStyle(
    fontFamily: 'Montserrat',
    fontSize: 32,
    fontWeight: FontWeight.w600,
    color: AppColors.textPrimary,
  );

  static const TextStyle headlineMedium = TextStyle(
    fontFamily: 'Montserrat',
    fontSize: 24,
    fontWeight: FontWeight.w500,
    color: AppColors.textPrimary,
  );

  static const TextStyle headlineSmall = TextStyle(
    fontFamily: 'Montserrat',
    fontSize: 20,
    fontWeight: FontWeight.w400,
    color: AppColors.textPrimary,
  );

  static const TextStyle bodyLarge = TextStyle(
    fontFamily: 'OpenSans',
    fontSize: 16,
    fontWeight: FontWeight.w400,
    color: AppColors.textPrimary,
  );

  static const TextStyle bodyMedium = TextStyle(
    fontFamily: 'OpenSans',
    fontSize: 14,
    fontWeight: FontWeight.w400,
    color: AppColors.textSecondary,
  );

  static const TextStyle bodySmall = TextStyle(
    fontFamily: 'OpenSans',
    fontSize: 12,
    fontWeight: FontWeight.w300,
    color: AppColors.textHint,
  );
}
