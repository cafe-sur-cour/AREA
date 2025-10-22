import 'package:flutter_test/flutter_test.dart';
import 'package:area/core/config/app_config.dart';

void main() {
  group('AppConfig', () {
    test('frontendUrl should return default value when no environment variable is set', () {
      expect(AppConfig.frontendUrl, 'https://frontend.nduboi.fr');
    });

    test('backendUrl should return default value when no environment variable is set', () {
      expect(AppConfig.backendUrl, 'https://backend.nduboi.fr');
    });

    test('callBackUrl should return default value when no environment variable is set', () {
      expect(AppConfig.callBackUrl, 'mobileapp://callback');
    });
  });
}
