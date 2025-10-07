import 'dart:async';
import 'package:area/core/config/app_config.dart';
import 'package:app_links/app_links.dart';

class DeepLinkService {
  static DeepLinkService? _instance;
  static DeepLinkService get instance => _instance ??= DeepLinkService._();

  DeepLinkService._();

  final AppLinks _appLinks = AppLinks();
  final StreamController<String> _deepLinkController = StreamController<String>.broadcast();
  StreamSubscription<Uri>? _linkSubscription;

  Stream<String> get deepLinkStream => _deepLinkController.stream;

  Future<void> initialize() async {
    try {
      // Check if app was launched by a deep link
      final initialLink = await _appLinks.getInitialLink();
      if (initialLink != null) {
        _handleIncomingLink(initialLink);
      }

      // Listen for incoming links when app is already running
      _linkSubscription = _appLinks.uriLinkStream.listen(
        _handleIncomingLink,
        onError: (err) {
          // Handle link stream errors
        },
      );
    } catch (e) {
      // Handle initialization errors
    }
  }

  void _handleIncomingLink(Uri uri) {
    try {
      _deepLinkController.add(uri.toString());
    } catch (e) {
      // Handle error silently or log it
    }
  }

  Future<void> handleDeepLink(String link) async {
    try {
      _deepLinkController.add(link);
    } catch (e) {
      // Handle error silently or log it
    }
  }

  void dispose() {
    _linkSubscription?.cancel();
    _deepLinkController.close();
  }
}

extension DeepLinkExtensions on String {
  bool get isMobileCallback => startsWith(AppConfig.callBackUrl);

  Map<String, String> get queryParameters {
    try {
      final uri = Uri.parse(this);
      return uri.queryParameters;
    } catch (e) {
      return {};
    }
  }

  bool get hasToken =>
      queryParameters.containsKey('token') ||
      queryParameters.containsKey('auth_token') ||
      queryParameters.containsKey('jwt');

  bool get isSubscriptionSuccess =>
      queryParameters.values.any((v) => v.endsWith('_subscribed=true'));
}
