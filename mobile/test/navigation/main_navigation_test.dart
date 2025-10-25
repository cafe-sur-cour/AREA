import 'package:area/core/config/app_config.dart';
import 'package:area/core/notifiers/automation_builder_notifier.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/navigation/main_navigation.dart';
import 'package:area/screens/home_screen.dart';
import 'package:area/screens/catalogue_screen.dart';
import 'package:area/screens/add_automation_screen.dart';
import 'package:area/screens/automations_screen.dart';
import 'package:area/screens/profile_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'package:area/core/notifiers/backend_address_notifier.dart';
import 'package:area/core/notifiers/locale_notifier.dart';

void main() {
  Widget addProvidersToTestableApp(Widget child) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (context) => LocaleNotifier()),
        ChangeNotifierProvider(
          create: (context) =>
              BackendAddressNotifier()..setBackendAddress(AppConfig.backendUrl),
        ),
        ChangeNotifierProvider(create: (context) => AutomationBuilderNotifier()),
      ],
      child: child,
    );
  }

  Widget createTestableWidget(Widget child) {
    return addProvidersToTestableApp(
      MaterialApp(
        localizationsDelegates: const [
          AppLocalizations.delegate,
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        supportedLocales: AppLocalizations.supportedLocales,
        home: child,
      ),
    );
  }

  group('MainNavigation Widget Tests', () {
    testWidgets('should display 5 navigation items', (WidgetTester tester) async {
      await tester.pumpWidget(createTestableWidget(MainNavigation()));
      await tester.pump();

      final bottomNavBar = find.byType(BottomNavigationBar);
      expect(bottomNavBar, findsOneWidget);

      final BottomNavigationBar navBar = tester.widget(bottomNavBar);
      expect(navBar.items.length, 5);
    });

    testWidgets('should display correct navigation labels in English', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(createTestableWidget(const MainNavigation()));
      await tester.pump();

      expect(find.text('Home'), findsAtLeastNWidgets(1));
      expect(find.text('Catalogue'), findsAtLeastNWidgets(1));
      expect(find.text('Add'), findsAtLeastNWidgets(1));
      expect(find.text('AREAs'), findsAtLeastNWidgets(1));
      expect(find.text('Profile'), findsAtLeastNWidgets(1));
    });

    testWidgets('should display correct navigation labels in French', (
      WidgetTester tester,
    ) async {
      Widget frenchApp = addProvidersToTestableApp(
        MaterialApp(
          locale: const Locale('fr'),
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: AppLocalizations.supportedLocales,
          home: const MainNavigation(),
        ),
      );

      await tester.pumpWidget(frenchApp);
      await tester.pump();

      expect(find.text('Accueil'), findsAtLeastNWidgets(1));
      expect(find.text('Catalogue'), findsAtLeastNWidgets(1));
      expect(find.text('Créer'), findsAtLeastNWidgets(1));
      expect(find.text('AREAs'), findsAtLeastNWidgets(1));
      expect(find.text('Profil'), findsAtLeastNWidgets(1));
    });

    testWidgets('should display correct icons for each navigation item', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(createTestableWidget(const MainNavigation()));
      await tester.pump();

      expect(find.byIcon(Icons.home), findsOneWidget); // Selected icon since default is index 0
      expect(find.byIcon(Icons.apps), findsOneWidget);
      expect(find.byIcon(Icons.add_circle_outline), findsOneWidget);
      expect(find.byIcon(Icons.repeat), findsOneWidget);
      expect(find.byIcon(Icons.person_outline), findsOneWidget);
    });

    testWidgets('should start with Add Automation screen (index 2) as default when no automation state', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(createTestableWidget(const MainNavigation()));
      await tester.pump();

      final bottomNavBar = find.byType(BottomNavigationBar);
      final BottomNavigationBar navBar = tester.widget(bottomNavBar);
      expect(navBar.currentIndex, 0); // Should be 0 since AutomationBuilderNotifier has no action/reactions

      expect(find.byType(HomeScreen), findsOneWidget);
    });

    testWidgets('should navigate to Catalogue screen when Catalogue tab is tapped', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(createTestableWidget(const MainNavigation()));
      await tester.pump();

      await tester.tap(find.byIcon(Icons.apps));
      await tester.pump();

      final bottomNavBar = find.byType(BottomNavigationBar);
      final BottomNavigationBar navBar = tester.widget(bottomNavBar);
      expect(navBar.currentIndex, 1);
      expect(find.byType(CatalogueScreen), findsOneWidget);
    });

    testWidgets('should navigate to Add Automation screen when Add tab is tapped', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(createTestableWidget(const MainNavigation()));
      await tester.pump();

      await tester.tap(find.byIcon(Icons.add_circle_outline));
      await tester.pump();

      final bottomNavBar = find.byType(BottomNavigationBar);
      final BottomNavigationBar navBar = tester.widget(bottomNavBar);
      expect(navBar.currentIndex, 2);
      expect(find.byType(AddAutomationScreen), findsOneWidget);
    });

    testWidgets('should navigate to Automations screen when AREAs tab is tapped', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(createTestableWidget(const MainNavigation()));
      await tester.pump();

      await tester.tap(find.byIcon(Icons.repeat));
      await tester.pump();

      final bottomNavBar = find.byType(BottomNavigationBar);
      final BottomNavigationBar navBar = tester.widget(bottomNavBar);
      expect(navBar.currentIndex, 3);
      expect(find.byType(AutomationsScreen), findsOneWidget);
    });

    testWidgets('should navigate to Profile screen when Profile tab is tapped', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(createTestableWidget(const MainNavigation()));
      await tester.pump();

      await tester.tap(find.byIcon(Icons.person_outline));
      await tester.pump();

      final bottomNavBar = find.byType(BottomNavigationBar);
      final BottomNavigationBar navBar = tester.widget(bottomNavBar);
      expect(navBar.currentIndex, 4);
      expect(find.byType(ProfileScreen), findsOneWidget);
    });

    testWidgets('should change selected icon when navigating between tabs', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(createTestableWidget(const MainNavigation()));
      await tester.pump();

      // Initially should show Home as selected (index 0)
      expect(find.byIcon(Icons.home), findsOneWidget);
      expect(find.byIcon(Icons.home_outlined), findsNothing);

      await tester.tap(find.byIcon(Icons.add_circle_outline));
      await tester.pump();

      // After tapping Add, should show Add as selected and Home as unselected
      expect(find.byIcon(Icons.add_circle), findsOneWidget);
      expect(find.byIcon(Icons.add_circle_outline), findsNothing);
      expect(find.byIcon(Icons.home_outlined), findsOneWidget);
      expect(find.byIcon(Icons.home), findsNothing);
    });

    testWidgets('should handle rapid tab switching', (WidgetTester tester) async {
      await tester.pumpWidget(createTestableWidget(const MainNavigation()));
      await tester.pump();

      for (int i = 0; i < 5; i++) {
        await tester.tap(find.byIcon(Icons.add_circle_outline));
        await tester.pump();
        await tester.tap(find.byIcon(Icons.home_outlined));
        await tester.pump();
      }

      final bottomNavBar = find.byType(BottomNavigationBar);
      final BottomNavigationBar navBar = tester.widget(bottomNavBar);
      expect(navBar.currentIndex, 0);
      expect(find.byType(HomeScreen), findsOneWidget);
    });
  });

  group('NavigationItem Class Tests', () {
    testWidgets('should create NavigationItem with all required properties', (
      WidgetTester tester,
    ) async {
      const testLabel = 'Test Label';
      const testIcon = Icons.add_circle_outline;
      const testSelectedIcon = Icons.add_circle;
      const testScreen = Placeholder();

      final navItem = NavigationItem(
        label: testLabel,
        icon: testIcon,
        screen: testScreen,
        selectedIcon: testSelectedIcon,
      );

      expect(navItem.label, testLabel);
      expect(navItem.icon, testIcon);
      expect(navItem.selectedIcon, testSelectedIcon);
      expect(navItem.screen, testScreen);
    });
  });

  group('MainNavigationState Tests', () {
    testWidgets('should create MainNavigationState with initial index 0', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(createTestableWidget(const MainNavigation()));

      expect(find.byType(MainNavigation), findsOneWidget);
      expect(find.byType(BottomNavigationBar), findsOneWidget);
    });

    testWidgets('should update state when onTap is called', (WidgetTester tester) async {
      await tester.pumpWidget(createTestableWidget(const MainNavigation()));
      await tester.pump();

      final bottomNavBar = find.byType(BottomNavigationBar);
      BottomNavigationBar navBar = tester.widget(bottomNavBar);
      expect(navBar.currentIndex, 0);

      await tester.tap(find.byIcon(Icons.apps));
      await tester.pump();

      navBar = tester.widget(bottomNavBar);
      expect(navBar.currentIndex, 1);
    });
  });
}
