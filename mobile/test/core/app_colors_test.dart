import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:area/core/constants/app_colors.dart';

void main() {
  group('AppColors', () {
    test('primary color should be correct', () {
      expect(AppColors.primary, const Color(0xFF3E6172));
    });

    test('primaryDark color should be correct', () {
      expect(AppColors.primaryDark, const Color(0xFF57798B));
    });

    test('secondary color should be correct', () {
      expect(AppColors.secondary, const Color(0xFF648BA0));
    });

    test('accent color should be correct', () {
      expect(AppColors.accent, const Color(0xFF648BA0));
    });

    test('background color should be correct', () {
      expect(AppColors.background, const Color(0xFFE4E2DD));
    });

    test('surface color should be correct', () {
      expect(AppColors.surface, const Color(0xFFFFFFFF));
    });

    test('error color should be correct', () {
      expect(AppColors.error, const Color(0xFFF44336));
    });

    test('success color should be correct', () {
      expect(AppColors.success, const Color(0xFF4CAF50));
    });

    test('textPrimary color should be correct', () {
      expect(AppColors.textPrimary, const Color(0xFF000000));
    });

    test('textSecondary color should be correct', () {
      expect(AppColors.textSecondary, const Color(0xFF45433E));
    });

    test('textHint color should be correct', () {
      expect(AppColors.textHint, const Color(0xFF45433E));
    });

    test('divider color should be correct', () {
      expect(AppColors.divider, const Color(0xFFE4E2DD));
    });

    test('disabled color should be correct', () {
      expect(AppColors.disabled, const Color(0xFFE4E2DD));
    });

    test('areaBlue1 color should be correct', () {
      expect(AppColors.areaBlue1, const Color(0xFF3E6172));
    });

    test('areaBlue2 color should be correct', () {
      expect(AppColors.areaBlue2, const Color(0xFF57798B));
    });

    test('areaBlue3 color should be correct', () {
      expect(AppColors.areaBlue3, const Color(0xFF648BA0));
    });

    test('areaLightGray color should be correct', () {
      expect(AppColors.areaLightGray, const Color(0xFFE4E2DD));
    });

    test('areaDarkGray color should be correct', () {
      expect(AppColors.areaDarkGray, const Color(0xFF45433E));
    });

    test('areaBlack color should be correct', () {
      expect(AppColors.areaBlack, const Color(0xFF000000));
    });
  });
}
