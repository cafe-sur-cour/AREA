import 'package:area/core/config/app_config.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/screens/action_services_screen.dart';
import 'package:area/screens/reaction_services_screen.dart';
import 'package:area/screens/forgot_password_screen.dart';
import 'package:area/screens/register_screen.dart';
import 'package:area/screens/login_screen.dart';
import 'package:area/navigation/main_navigation.dart';
import 'package:area/core/themes/app_theme.dart';
import 'package:area/core/notifiers/backend_address_notifier.dart';
import 'package:area/core/notifiers/locale_notifier.dart';
import 'package:area/core/notifiers/automation_builder_notifier.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (context) => LocaleNotifier()),
        ChangeNotifierProvider(
          create: (context) =>
              BackendAddressNotifier()..setBackendAddress(AppConfig.backendUrl),
        ),
        ChangeNotifierProvider(create: (context) => AutomationBuilderNotifier()),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    final locale = Provider.of<LocaleNotifier>(context).locale;

    return MaterialApp(
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        AppLocalizations.delegate,
      ],
      supportedLocales: const [Locale('en', ''), Locale('fr', '')],
      locale: locale,
      title: 'AREA',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.lightTheme,
      themeMode: ThemeMode.system,
      initialRoute: '/',
      routes: {
        '/': (context) => const MainNavigation(),
        '/login': (context) => const LoginScreen(),
        '/register': (context) => const RegisterScreen(),
        '/forgot-password': (context) => const ForgotPasswordScreen(),
        '/action-services': (context) => const ActionServicesScreen(),
        '/reaction-services': (context) => const ReactionServicesScreen(),
      },
    );
  }
}
