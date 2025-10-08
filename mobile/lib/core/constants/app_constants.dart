class AppRoutes {
  // Api health
  static const String healthCheck = "api/info/health";

  // Auth
  static const String login = "api/auth/login";
  static const String register = "api/auth/register";
  static const String logout = "api/auth/logout";
  static const String forgotPassword = "api/auth/forgot-password";

  // Profile
  static const String me = "api/user/me";

  // OAuth2
  static const String githubLogin = "api/auth/github/login";
  static const String microsoftLogin = "api/auth/microsoft/login";
  static const String googleLogin = "api/auth/google/login";

  // Services
  static const String services = "api/services";
  static const String servicesSubscribed = "api/services/subscribed";
  static const String servicesWithActions = "api/services/actions";
  static const String servicesWithReactions = "api/services/reactions";

  // Service-specific routes
  static String actionsFromService(String serviceId) => "api/services/$serviceId/actions";
  static String reactionsFromService(String serviceId) => "api/services/$serviceId/reactions";

  // Action Reaction mapping
  static String createAutomation = "api/mappings";
}

class AppDimensions {
  // Padding & Margins
  static const double paddingXS = 4.0;
  static const double paddingSM = 8.0;
  static const double paddingMD = 16.0;
  static const double paddingLG = 24.0;
  static const double paddingXL = 32.0;

  // Border Radius
  static const double borderRadiusXS = 4.0;
  static const double borderRadiusSM = 8.0;
  static const double borderRadiusMD = 12.0;
  static const double borderRadiusLG = 16.0;
  static const double borderRadiusXL = 20.0;

  // Icon Sizes
  static const double iconSizeSM = 16.0;
  static const double iconSizeMD = 24.0;
  static const double iconSizeLG = 32.0;
  static const double iconSizeXL = 48.0;

  // Button Heights
  static const double buttonHeightSM = 32.0;
  static const double buttonHeightMD = 48.0;
  static const double buttonHeightLG = 56.0;

  // AppBar
  static const double appBarHeight = 56.0;
  static const double appBarElevation = 4.0;

  // BottomNavigationBar
  static const double bottomNavBarHeight = 60.0;
}
