class AppConfig {
  static const String _defaultFrontendUrl = 'https://frontend.nduboi.fr:16836';
  static const String _defaultBackendUrl = 'https://backend.nduboi.fr:16836';

  static const String frontendUrl = String.fromEnvironment(
    'FRONTEND_URL',
    defaultValue: _defaultFrontendUrl,
  );

  static const String backendUrl = String.fromEnvironment(
    'BACKEND_URL',
    defaultValue: _defaultBackendUrl,
  );

  static const String callBackUrl = 'mobileapp://callback';
}
