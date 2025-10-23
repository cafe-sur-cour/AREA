import 'package:area/services/mobile_oauth_service.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('MobileOAuthService', () {
    test('should exist', () {
      expect(MobileOAuthService, isNotNull);
    });
  });

  group('ServiceSubscriptionWebView', () {
    testWidgets('should create widget', (tester) async {
      const widget = ServiceSubscriptionWebView(
        subscriptionUrl: 'https://example.com',
        serviceName: 'TestService',
      );
      expect(widget, isNotNull);
      expect(widget.subscriptionUrl, 'https://example.com');
      expect(widget.serviceName, 'TestService');
    });
  });
}
