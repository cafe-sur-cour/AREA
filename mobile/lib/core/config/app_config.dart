class AppConfig {
  static const String _defaultFrontendUrl = 'https://frontend.nduboi.fr';
  static const String _defaultBackendUrl = 'https://backend.nduboi.fr';
  static const String _defaultMobileCallbackUrl = 'mobileapp://callback';

  static const String frontendUrl = String.fromEnvironment(
    'FRONTEND_URL',
    defaultValue: _defaultFrontendUrl,
  );

  static const String backendUrl = String.fromEnvironment(
    'BACKEND_URL',
    defaultValue: _defaultBackendUrl,
  );

  static const String callBackUrl = String.fromEnvironment(
    'MOBILE_CALLBACK_URL',
    defaultValue: _defaultMobileCallbackUrl,
  );
}
