import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:area/core/utils/color_utils.dart';
import 'package:area/core/constants/app_colors.dart';
import 'package:area/models/action_models.dart';
import 'package:area/models/reaction_models.dart';
import 'package:area/models/service_models.dart';

void main() {
  group('ColorUtils', () {
    group('parseColorString', () {
      test('should parse valid hex color with #', () {
        final color = ColorUtils.parseColorString('#FF0000');
        expect(color, const Color(0xFFFF0000));
      });

      test('should parse valid hex color without #', () {
        final color = ColorUtils.parseColorString('00FF00');
        expect(color, const Color(0xFF00FF00));
      });

      test('should add FF alpha when 6 digits', () {
        final color = ColorUtils.parseColorString('0000FF');
        expect(color, const Color(0xFF0000FF));
      });

      test('should return fallback for null input', () {
        final color = ColorUtils.parseColorString(null, AppColors.primary);
        expect(color, AppColors.primary);
      });

      test('should return fallback for empty string', () {
        final color = ColorUtils.parseColorString('', AppColors.primary);
        expect(color, AppColors.primary);
      });

      test('should return fallback for invalid hex', () {
        final color = ColorUtils.parseColorString('invalid', AppColors.primary);
        expect(color, AppColors.primary);
      });

      test('should return default fallback when no fallback provided', () {
        final color = ColorUtils.parseColorString('invalid');
        expect(color, AppColors.areaBlue3);
      });
    });

    group('getActionColor', () {
      test('should return action metadata color when available', () {
        final metadata = ActionMetadata(
          category: 'test',
          tags: [],
          color: '#FF0000',
          requiresAuth: false,
        );
        final action = ActionModel(
          id: 'test',
          name: 'Test',
          description: 'Test',
          metadata: metadata,
        );

        final color = ColorUtils.getActionColor(action);
        expect(color, const Color(0xFFFF0000));
      });

      test('should return service color when action has no metadata color', () {
        final service = ServiceModel(
          id: 'test',
          name: 'Test',
          description: 'Test',
          color: '#00FF00',
        );
        final action = ActionModel(id: 'test', name: 'Test', description: 'Test');

        final color = ColorUtils.getActionColor(action, service);
        expect(color, const Color(0xFF00FF00));
      });

      test('should return default color when no colors available', () {
        final action = ActionModel(id: 'test', name: 'Test', description: 'Test');

        final color = ColorUtils.getActionColor(action);
        expect(color, AppColors.areaBlue3);
      });
    });

    group('getReactionColor', () {
      test('should return reaction metadata color when available', () {
        final metadata = ReactionMetadata(
          category: 'test',
          tags: [],
          color: '#FF0000',
          requiresAuth: false,
        );
        final reaction = ReactionModel(
          id: 'test',
          name: 'Test',
          description: 'Test',
          metadata: metadata,
        );

        final color = ColorUtils.getReactionColor(reaction);
        expect(color, const Color(0xFFFF0000));
      });

      test('should return service color when reaction has no metadata color', () {
        final service = ServiceModel(
          id: 'test',
          name: 'Test',
          description: 'Test',
          color: '#00FF00',
        );
        final reaction = ReactionModel(id: 'test', name: 'Test', description: 'Test');

        final color = ColorUtils.getReactionColor(reaction, service);
        expect(color, const Color(0xFF00FF00));
      });

      test('should return default color when no colors available', () {
        final reaction = ReactionModel(id: 'test', name: 'Test', description: 'Test');

        final color = ColorUtils.getReactionColor(reaction);
        expect(color, AppColors.areaBlue3);
      });
    });

    group('getServiceColor', () {
      test('should return parsed service color', () {
        final service = ServiceModel(
          id: 'test',
          name: 'Test',
          description: 'Test',
          color: '#FF0000',
        );

        final color = ColorUtils.getServiceColor(service);
        expect(color, const Color(0xFFFF0000));
      });
    });

    group('createColorGradient', () {
      test('should create gradient with default parameters', () {
        final baseColor = AppColors.primary;
        final gradient = ColorUtils.createColorGradient(baseColor);

        expect(gradient.begin, Alignment.topLeft);
        expect(gradient.end, Alignment.bottomRight);
        expect(gradient.colors.length, 2);
        expect(gradient.colors[0], baseColor.withValues(alpha: 0.1));
        expect(gradient.colors[1], baseColor.withValues(alpha: 0.05));
      });

      test('should create gradient with custom parameters', () {
        final baseColor = AppColors.primary;
        final gradient = ColorUtils.createColorGradient(
          baseColor,
          startAlpha: 0.2,
          endAlpha: 0.1,
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        );

        expect(gradient.begin, Alignment.topCenter);
        expect(gradient.end, Alignment.bottomCenter);
        expect(gradient.colors[0], baseColor.withValues(alpha: 0.2));
        expect(gradient.colors[1], baseColor.withValues(alpha: 0.1));
      });
    });

    group('getActionIcon and getReactionIcon', () {
      test('getActionIcon should return null', () {
        final action = ActionModel(id: 'test', name: 'Test', description: 'Test');

        final icon = ColorUtils.getActionIcon(action);
        expect(icon, isNull);
      });

      test('getReactionIcon should return null', () {
        final reaction = ReactionModel(id: 'test', name: 'Test', description: 'Test');

        final icon = ColorUtils.getReactionIcon(reaction);
        expect(icon, isNull);
      });
    });
  });
}
