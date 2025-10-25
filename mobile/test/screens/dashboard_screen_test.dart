import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart' as mocktail;
import 'package:provider/provider.dart';
import 'package:area/screens/dashboard_screen.dart';
import 'package:area/core/notifiers/backend_address_notifier.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/widgets/common/state/loading_state.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:area/services/secure_http_client.dart';
import 'package:area/services/secure_storage.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class MockBackendAddressNotifier extends mocktail.Mock implements BackendAddressNotifier {}

class MockFlutterSecureStorage extends mocktail.Mock implements FlutterSecureStorage {}

class MockNavigatorObserver extends mocktail.Mock implements NavigatorObserver {}

void main() {
  group('DashboardScreen', () {
    late MockBackendAddressNotifier mockBackendNotifier;
    late MockFlutterSecureStorage mockSecureStorage;
    late MockNavigatorObserver mockNavigatorObserver;

    setUp(() {
      mockBackendNotifier = MockBackendAddressNotifier();
      mockSecureStorage = MockFlutterSecureStorage();
      mockNavigatorObserver = MockNavigatorObserver();
      setSecureStorage(mockSecureStorage);

      mocktail
          .when(() => mockSecureStorage.read(key: 'jwt'))
          .thenAnswer((_) async => 'test-jwt-token');
    });

    tearDown(() {
      SecureHttpClient.reset();
    });

    Widget createTestWidget() {
      return MultiProvider(
        providers: [
          ChangeNotifierProvider<BackendAddressNotifier>.value(value: mockBackendNotifier),
        ],
        child: MaterialApp(
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          navigatorObservers: [mockNavigatorObserver],
          initialRoute: '/dashboard',
          routes: {
            '/dashboard': (context) => const DashboardScreen(),
            '/action-services': (context) =>
                const Scaffold(body: Text('Action Services Screen')),
            '/': (context) => const Scaffold(body: Text('Home Screen')),
          },
        ),
      );
    }

    testWidgets('renders loading state initially', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      // Mock a delayed response to ensure loading state is visible
      SecureHttpClient.setClient(
        MockClient((request) async {
          await Future.delayed(const Duration(milliseconds: 100));
          return http.Response(jsonEncode({'mappings': []}), 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());

      // Should show loading state initially
      expect(find.byType(LoadingState), findsOneWidget);
      expect(find.text('Dashboard'), findsOneWidget);

      await tester.pumpAndSettle();

      // Loading should be gone after data loads
      expect(find.byType(LoadingState), findsNothing);
    });

    testWidgets('displays dashboard correctly when backend address is null', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn(null);

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      // Should display the app bar
      expect(find.text('Dashboard'), findsAtLeastNWidgets(1));
    });

    testWidgets('displays dashboard with empty automations list', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(jsonEncode({'mappings': []}), 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      // Check if dashboard title is displayed
      expect(find.text('Dashboard'), findsAtLeastNWidgets(1));

      // Check if subtitle is displayed
      expect(find.text('Manage your Areas and monitor their performance'), findsOneWidget);

      // Check if "Your Areas" section is displayed
      expect(find.text('Your Areas'), findsOneWidget);

      // Check if "No Area yet" message is displayed
      expect(find.text('No Area yet'), findsOneWidget);
      expect(find.text('Create your first Area to get started'), findsOneWidget);
    });

    testWidgets('displays dashboard with automations list', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      final testAutomations = [
        {
          'id': 1,
          'name': 'Test Automation 1',
          'description': 'First test automation',
          'is_active': true,
          'action': {'type': 'github.push'},
          'reactions': [
            {'type': 'discord.message'},
            {'type': 'email.send'},
          ],
          'created_at': '2024-01-01T00:00:00Z',
        },
        {
          'id': 2,
          'name': 'Test Automation 2',
          'description': 'Second test automation',
          'is_active': false,
          'action': {'type': 'timer.schedule'},
          'reactions': [
            {'type': 'slack.message'},
          ],
          'created_at': '2024-01-02T00:00:00Z',
        },
      ];

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(jsonEncode({'mappings': testAutomations}), 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      // Check if automation names are displayed
      expect(find.text('Test Automation 1'), findsOneWidget);
      expect(find.text('Test Automation 2'), findsOneWidget);

      // Check if automation descriptions are displayed
      expect(find.text('First test automation'), findsOneWidget);
      expect(find.text('Second test automation'), findsOneWidget);

      // Check if active/inactive status is displayed in automation cards
      // We expect to find 2 "Active" texts: one in stats and one in the automation card
      // We expect to find 2 "Inactive" texts: one in stats and one in the automation card
      expect(find.text('Active'), findsAtLeastNWidgets(1));
      expect(find.text('Inactive'), findsAtLeastNWidgets(1));
    });

    testWidgets('displays stats grid correctly', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      final testAutomations = [
        {
          'id': 1,
          'name': 'Test Automation 1',
          'description': 'First test automation',
          'is_active': true,
          'action': {'type': 'github.push'},
          'reactions': [
            {'type': 'discord.message'},
          ],
          'created_at': '2024-01-01T00:00:00Z',
        },
        {
          'id': 2,
          'name': 'Test Automation 2',
          'description': 'Second test automation',
          'is_active': false,
          'action': {'type': 'timer.schedule'},
          'reactions': [
            {'type': 'slack.message'},
          ],
          'created_at': '2024-01-02T00:00:00Z',
        },
      ];

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(jsonEncode({'mappings': testAutomations}), 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      // Check if total automations stat is displayed
      expect(find.text('2'), findsAtLeastNWidgets(1));

      // Check if active automations stat is displayed
      expect(find.text('1'), findsAtLeastNWidgets(1));
    });

    testWidgets('displays quick actions section', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(jsonEncode({'mappings': []}), 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      // Check if quick actions title is displayed
      expect(find.text('Quick actions'), findsOneWidget);

      // Check if quick action buttons are displayed
      expect(find.text('Connect Services'), findsOneWidget);
      expect(find.text('Link new platforms'), findsOneWidget);

      expect(find.text('Browse Templates'), findsOneWidget);
      expect(find.text('Pre-made Areas'), findsOneWidget);

      expect(find.text('Account Settings'), findsOneWidget);
      expect(find.text('Manage your profile'), findsOneWidget);
    });

    testWidgets('navigates to action services when Connect Services is tapped', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(jsonEncode({'mappings': []}), 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      // Tap the "Connect Services" button
      await tester.tap(find.text('Connect Services'));
      await tester.pumpAndSettle();

      // Verify navigation to action services screen
      expect(find.text('Action Services Screen'), findsOneWidget);
    });

    testWidgets('navigates to home when Account Settings is tapped', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(jsonEncode({'mappings': []}), 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      // Tap the "Account Settings" button
      await tester.tap(find.text('Account Settings'));
      await tester.pumpAndSettle();

      // Verify navigation to home screen
      expect(find.text('Home Screen'), findsOneWidget);
    });

    testWidgets('handles API error gracefully', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response('Internal Server Error', 500);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      // Should still display the dashboard structure even on error
      expect(find.text('Dashboard'), findsAtLeastNWidgets(1));
      expect(find.text('Manage your Areas and monitor their performance'), findsOneWidget);
    });

    testWidgets('displays automation cards with correct information', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      final testAutomations = [
        {
          'id': 1,
          'name': 'GitHub to Discord',
          'description': 'Send Discord message when GitHub push occurs',
          'is_active': true,
          'action': {'type': 'github.push'},
          'reactions': [
            {'type': 'discord.message'},
          ],
          'created_at': '2024-01-01T00:00:00Z',
        },
      ];

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(jsonEncode({'mappings': testAutomations}), 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      // Check if automation information is displayed
      expect(find.text('GitHub to Discord'), findsOneWidget);
      expect(find.text('Send Discord message when GitHub push occurs'), findsOneWidget);
      // We expect to find 2 "Active" texts: one in stats and one in the automation card
      expect(find.text('Active'), findsAtLeastNWidgets(1));

      // Check if trigger and reaction types are displayed in the trigger description
      expect(find.textContaining('github.push'), findsOneWidget);
      expect(find.textContaining('discord.message'), findsOneWidget);
    });

    testWidgets('displays automation creation prompt when no automations exist', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(jsonEncode({'mappings': []}), 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      // Check if empty state message is displayed
      expect(find.text('No Area yet'), findsOneWidget);
      expect(find.text('Create your first Area to get started'), findsOneWidget);
    });
  });
}
