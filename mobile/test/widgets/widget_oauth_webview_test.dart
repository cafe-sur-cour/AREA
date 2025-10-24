import 'package:area/widgets/widget_oauth_webview.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('OAuthWebView', () {
    test('should create widget', () {
      const widget = OAuthWebView(
        oauthUrl: 'https://example.com/oauth',
        redirectUrl: 'https://example.com/callback',
        providerName: 'TestProvider',
      );
      expect(widget, isNotNull);
      expect(widget.oauthUrl, 'https://example.com/oauth');
      expect(widget.redirectUrl, 'https://example.com/callback');
      expect(widget.providerName, 'TestProvider');
    });
  });
}
