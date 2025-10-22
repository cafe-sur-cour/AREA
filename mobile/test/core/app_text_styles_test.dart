import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:area/core/constants/app_text_styles.dart';
import 'package:area/core/constants/app_colors.dart';

void main() {
  group('AppTextStyles', () {
    group('Montserrat styles', () {
      test('montserratLight should have correct properties', () {
        expect(AppTextStyles.montserratLight.fontFamily, 'Montserrat');
        expect(AppTextStyles.montserratLight.fontWeight, FontWeight.w300);
        expect(AppTextStyles.montserratLight.fontStyle, isNull);
        expect(AppTextStyles.montserratLight.color, AppColors.textPrimary);
      });

      test('montserratLightItalic should have correct properties', () {
        expect(AppTextStyles.montserratLightItalic.fontFamily, 'Montserrat');
        expect(AppTextStyles.montserratLightItalic.fontWeight, FontWeight.w300);
        expect(AppTextStyles.montserratLightItalic.fontStyle, FontStyle.italic);
        expect(AppTextStyles.montserratLightItalic.color, AppColors.textPrimary);
      });

      test('montserratNormal should have correct properties', () {
        expect(AppTextStyles.montserratNormal.fontFamily, 'Montserrat');
        expect(AppTextStyles.montserratNormal.fontWeight, FontWeight.w400);
        expect(AppTextStyles.montserratNormal.fontStyle, isNull);
        expect(AppTextStyles.montserratNormal.color, AppColors.textPrimary);
      });

      test('montserratNormalItalic should have correct properties', () {
        expect(AppTextStyles.montserratNormalItalic.fontFamily, 'Montserrat');
        expect(AppTextStyles.montserratNormalItalic.fontWeight, FontWeight.w400);
        expect(AppTextStyles.montserratNormalItalic.fontStyle, FontStyle.italic);
        expect(AppTextStyles.montserratNormalItalic.color, AppColors.textPrimary);
      });

      test('montserratMedium should have correct properties', () {
        expect(AppTextStyles.montserratMedium.fontFamily, 'Montserrat');
        expect(AppTextStyles.montserratMedium.fontWeight, FontWeight.w500);
        expect(AppTextStyles.montserratMedium.fontStyle, isNull);
        expect(AppTextStyles.montserratMedium.color, AppColors.textPrimary);
      });

      test('montserratMediumItalic should have correct properties', () {
        expect(AppTextStyles.montserratMediumItalic.fontFamily, 'Montserrat');
        expect(AppTextStyles.montserratMediumItalic.fontWeight, FontWeight.w500);
        expect(AppTextStyles.montserratMediumItalic.fontStyle, FontStyle.italic);
        expect(AppTextStyles.montserratMediumItalic.color, AppColors.textPrimary);
      });

      test('montserratSemiBold should have correct properties', () {
        expect(AppTextStyles.montserratSemiBold.fontFamily, 'Montserrat');
        expect(AppTextStyles.montserratSemiBold.fontWeight, FontWeight.w600);
        expect(AppTextStyles.montserratSemiBold.fontStyle, isNull);
        expect(AppTextStyles.montserratSemiBold.color, AppColors.textPrimary);
      });

      test('montserratSemiBoldItalic should have correct properties', () {
        expect(AppTextStyles.montserratSemiBoldItalic.fontFamily, 'Montserrat');
        expect(AppTextStyles.montserratSemiBoldItalic.fontWeight, FontWeight.w600);
        expect(AppTextStyles.montserratSemiBoldItalic.fontStyle, FontStyle.italic);
        expect(AppTextStyles.montserratSemiBoldItalic.color, AppColors.textPrimary);
      });
    });

    group('Open Sans styles', () {
      test('openSansLight should have correct properties', () {
        expect(AppTextStyles.openSansLight.fontFamily, 'OpenSans');
        expect(AppTextStyles.openSansLight.fontWeight, FontWeight.w300);
        expect(AppTextStyles.openSansLight.fontStyle, isNull);
        expect(AppTextStyles.openSansLight.color, AppColors.textPrimary);
      });

      test('openSansLightItalic should have correct properties', () {
        expect(AppTextStyles.openSansLightItalic.fontFamily, 'OpenSans');
        expect(AppTextStyles.openSansLightItalic.fontWeight, FontWeight.w300);
        expect(AppTextStyles.openSansLightItalic.fontStyle, FontStyle.italic);
        expect(AppTextStyles.openSansLightItalic.color, AppColors.textPrimary);
      });

      test('openSansNormal should have correct properties', () {
        expect(AppTextStyles.openSansNormal.fontFamily, 'OpenSans');
        expect(AppTextStyles.openSansNormal.fontWeight, FontWeight.w400);
        expect(AppTextStyles.openSansNormal.fontStyle, isNull);
        expect(AppTextStyles.openSansNormal.color, AppColors.textPrimary);
      });

      test('openSansNormalItalic should have correct properties', () {
        expect(AppTextStyles.openSansNormalItalic.fontFamily, 'OpenSans');
        expect(AppTextStyles.openSansNormalItalic.fontWeight, FontWeight.w400);
        expect(AppTextStyles.openSansNormalItalic.fontStyle, FontStyle.italic);
        expect(AppTextStyles.openSansNormalItalic.color, AppColors.textPrimary);
      });

      test('openSansMedium should have correct properties', () {
        expect(AppTextStyles.openSansMedium.fontFamily, 'OpenSans');
        expect(AppTextStyles.openSansMedium.fontWeight, FontWeight.w500);
        expect(AppTextStyles.openSansMedium.fontStyle, isNull);
        expect(AppTextStyles.openSansMedium.color, AppColors.textPrimary);
      });

      test('openSansMediumItalic should have correct properties', () {
        expect(AppTextStyles.openSansMediumItalic.fontFamily, 'OpenSans');
        expect(AppTextStyles.openSansMediumItalic.fontWeight, FontWeight.w500);
        expect(AppTextStyles.openSansMediumItalic.fontStyle, FontStyle.italic);
        expect(AppTextStyles.openSansMediumItalic.color, AppColors.textPrimary);
      });

      test('openSansSemiBold should have correct properties', () {
        expect(AppTextStyles.openSansSemiBold.fontFamily, 'OpenSans');
        expect(AppTextStyles.openSansSemiBold.fontWeight, FontWeight.w600);
        expect(AppTextStyles.openSansSemiBold.fontStyle, isNull);
        expect(AppTextStyles.openSansSemiBold.color, AppColors.textPrimary);
      });

      test('openSansSemiBoldItalic should have correct properties', () {
        expect(AppTextStyles.openSansSemiBoldItalic.fontFamily, 'OpenSans');
        expect(AppTextStyles.openSansSemiBoldItalic.fontWeight, FontWeight.w600);
        expect(AppTextStyles.openSansSemiBoldItalic.fontStyle, FontStyle.italic);
        expect(AppTextStyles.openSansSemiBoldItalic.color, AppColors.textPrimary);
      });
    });

    group('Predefined sizes', () {
      test('headlineLarge should have correct properties', () {
        expect(AppTextStyles.headlineLarge.fontFamily, 'Montserrat');
        expect(AppTextStyles.headlineLarge.fontSize, 32);
        expect(AppTextStyles.headlineLarge.fontWeight, FontWeight.w600);
        expect(AppTextStyles.headlineLarge.color, AppColors.textPrimary);
      });

      test('headlineMedium should have correct properties', () {
        expect(AppTextStyles.headlineMedium.fontFamily, 'Montserrat');
        expect(AppTextStyles.headlineMedium.fontSize, 24);
        expect(AppTextStyles.headlineMedium.fontWeight, FontWeight.w500);
        expect(AppTextStyles.headlineMedium.color, AppColors.textPrimary);
      });

      test('headlineSmall should have correct properties', () {
        expect(AppTextStyles.headlineSmall.fontFamily, 'Montserrat');
        expect(AppTextStyles.headlineSmall.fontSize, 20);
        expect(AppTextStyles.headlineSmall.fontWeight, FontWeight.w400);
        expect(AppTextStyles.headlineSmall.color, AppColors.textPrimary);
      });

      test('bodyLarge should have correct properties', () {
        expect(AppTextStyles.bodyLarge.fontFamily, 'OpenSans');
        expect(AppTextStyles.bodyLarge.fontSize, 16);
        expect(AppTextStyles.bodyLarge.fontWeight, FontWeight.w400);
        expect(AppTextStyles.bodyLarge.color, AppColors.textPrimary);
      });

      test('bodyMedium should have correct properties', () {
        expect(AppTextStyles.bodyMedium.fontFamily, 'OpenSans');
        expect(AppTextStyles.bodyMedium.fontSize, 14);
        expect(AppTextStyles.bodyMedium.fontWeight, FontWeight.w400);
        expect(AppTextStyles.bodyMedium.color, AppColors.textSecondary);
      });

      test('bodySmall should have correct properties', () {
        expect(AppTextStyles.bodySmall.fontFamily, 'OpenSans');
        expect(AppTextStyles.bodySmall.fontSize, 12);
        expect(AppTextStyles.bodySmall.fontWeight, FontWeight.w300);
        expect(AppTextStyles.bodySmall.color, AppColors.textHint);
      });
    });
  });
}
