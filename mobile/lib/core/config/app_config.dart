class AppConfig {
  static const String _defaultFrontendUrl = 'https://frontend.nduboi.fr:16836';

  static const String frontendUrl = String.fromEnvironment(
    'FRONTEND_URL',
    defaultValue: _defaultFrontendUrl,
  );

  static String getOAuthRedirectUrl() {
    return frontendUrl;
  }
}
