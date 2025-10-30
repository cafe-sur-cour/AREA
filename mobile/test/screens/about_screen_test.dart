import 'package:area/l10n/app_localizations.dart';
import 'package:area/screens/about_screen.dart';
import 'package:area/services/secure_storage.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart' as mocktail;
import 'package:provider/provider.dart';
import 'package:area/core/notifiers/backend_address_notifier.dart';
import 'package:area/core/notifiers/navigation_index_notifier.dart';
import 'package:http/http.dart' as http;
import 'package:area/services/secure_http_client.dart';

class MockFlutterSecureStorage extends mocktail.Mock implements FlutterSecureStorage {}

class MockHttpClient extends mocktail.Mock implements http.Client {}

void main() {
  late MockFlutterSecureStorage mockSecureStorage;
  late MockHttpClient mockHttpClient;

  setUpAll(() {
    mocktail.registerFallbackValue(Uri.parse('http://test.com'));
    mocktail.registerFallbackValue(<String, String>{});
  });

  setUp(() {
    mockSecureStorage = MockFlutterSecureStorage();
    mockHttpClient = MockHttpClient();
    setSecureStorage(mockSecureStorage);
    SecureHttpClient.setClient(mockHttpClient);
  });

  Widget createTestWidget() {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (_) =>
              BackendAddressNotifier()..setBackendAddress('http://test-backend.com'),
        ),
        ChangeNotifierProvider(create: (_) => NavigationIndexNotifier()),
      ],
      child: MaterialApp(
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: const AboutScreen(),
      ),
    );
  }

  testWidgets('renders About screen correctly', (WidgetTester tester) async {
    mocktail
        .when(() => mockSecureStorage.read(key: mocktail.any(named: 'key')))
        .thenAnswer((_) async => null);

    await tester.pumpWidget(createTestWidget());
    await tester.pumpAndSettle();

    final context = tester.element(find.byType(AboutScreen));
    final localizations = AppLocalizations.of(context)!;

    // Check if the about screen title is displayed
    expect(find.text(localizations.about), findsOneWidget);

    // Check if hero section is displayed
    expect(find.text(localizations.about_hero_title), findsOneWidget);
    expect(find.text(localizations.about_hero_title_highlight), findsOneWidget);

    // Check if mission section is displayed
    expect(find.text(localizations.about_mission_title), findsOneWidget);

    // Check if values section is displayed
    expect(find.text(localizations.about_values_title), findsOneWidget);

    // Check if story section is displayed
    expect(find.text(localizations.about_story_title), findsOneWidget);

    // Check if technology section is displayed
    expect(find.text(localizations.about_technology_title), findsOneWidget);

    // Check if why choose section is displayed
    expect(find.text(localizations.about_why_choose_title), findsOneWidget);

    // Check if CTA section is displayed
    expect(find.text(localizations.about_cta_title), findsOneWidget);
  });

  testWidgets('shows register button when not authenticated', (WidgetTester tester) async {
    mocktail
        .when(() => mockSecureStorage.read(key: mocktail.any(named: 'key')))
        .thenAnswer((_) async => null);

    await tester.pumpWidget(createTestWidget());
    await tester.pumpAndSettle();

    final context = tester.element(find.byType(AboutScreen));
    final localizations = AppLocalizations.of(context)!;

    // Should show register and explore buttons
    expect(find.text(localizations.about_cta_button_start), findsOneWidget);
    expect(find.text(localizations.about_cta_button_explore), findsOneWidget);
  });

  testWidgets('shows dashboard button when authenticated', (WidgetTester tester) async {
    mocktail
        .when(() => mockSecureStorage.read(key: mocktail.any(named: 'key')))
        .thenAnswer((_) async => 'test-jwt-token');

    mocktail
        .when(
          () => mockHttpClient.get(mocktail.any(), headers: mocktail.any(named: 'headers')),
        )
        .thenAnswer((_) async => http.Response('', 200));

    await tester.pumpWidget(createTestWidget());
    await tester.pumpAndSettle();

    final context = tester.element(find.byType(AboutScreen));
    final localizations = AppLocalizations.of(context)!;

    // Should show dashboard button
    expect(find.text(localizations.about_cta_button_dashboard), findsOneWidget);
  });

  testWidgets('displays stats cards', (WidgetTester tester) async {
    mocktail
        .when(() => mockSecureStorage.read(key: mocktail.any(named: 'key')))
        .thenAnswer((_) async => null);

    await tester.pumpWidget(createTestWidget());
    await tester.pumpAndSettle();

    final context = tester.element(find.byType(AboutScreen));
    final localizations = AppLocalizations.of(context)!;

    // Check stats labels
    expect(find.text(localizations.about_mission_stats_users), findsOneWidget);
    expect(find.text(localizations.about_mission_stats_automations), findsOneWidget);
    expect(find.text(localizations.about_mission_stats_integrations), findsOneWidget);
    expect(find.text(localizations.about_mission_stats_uptime), findsOneWidget);

    // Check stats values
    expect(find.text('2M+'), findsOneWidget);
    expect(find.text('10M+'), findsOneWidget);
    expect(find.text('500+'), findsOneWidget);
    expect(find.text('99.9%'), findsOneWidget);
  });

  testWidgets('displays technology cards', (WidgetTester tester) async {
    mocktail
        .when(() => mockSecureStorage.read(key: mocktail.any(named: 'key')))
        .thenAnswer((_) async => null);

    await tester.pumpWidget(createTestWidget());
    await tester.pumpAndSettle();

    // Check technology names
    expect(find.text('Next.js'), findsOneWidget);
    expect(find.text('TypeScript'), findsOneWidget);
    expect(find.text('Flutter'), findsOneWidget);
    expect(find.text('Express'), findsOneWidget);
    expect(find.text('PostgreSQL'), findsOneWidget);
    expect(find.text('Docker'), findsOneWidget);
    expect(find.text('GitHub Actions'), findsOneWidget);
    expect(find.text('Tailwind CSS'), findsOneWidget);
  });
}
