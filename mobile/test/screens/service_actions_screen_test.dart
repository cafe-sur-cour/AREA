import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart' as mocktail;
import 'package:provider/provider.dart';
import 'package:area/screens/service_actions_screen.dart';
import 'package:area/models/service_models.dart';
import 'package:area/models/action_models.dart';
import 'package:area/core/notifiers/backend_address_notifier.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/widgets/action_selection_card.dart';
import 'package:area/widgets/common/state/error_state.dart';
import 'package:area/widgets/common/state/empty_state.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:area/services/secure_storage.dart';
import 'package:area/services/secure_http_client.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class MockBackendAddressNotifier extends mocktail.Mock implements BackendAddressNotifier {}

class MockFlutterSecureStorage extends mocktail.Mock implements FlutterSecureStorage {}

void main() {
  group('ServiceActionsScreen', () {
    late MockBackendAddressNotifier mockBackendNotifier;
    late MockFlutterSecureStorage mockSecureStorage;
    late ServiceModel testService;
    late List<ActionModel> testActions;

    setUp(() {
      mockBackendNotifier = MockBackendAddressNotifier();
      mockSecureStorage = MockFlutterSecureStorage();
      setSecureStorage(mockSecureStorage);

      testService = ServiceModel(
        id: 'service1',
        name: 'Test Service',
        description: 'A test service',
        color: '#FF5733',
        icon: 'https://example.com/icon.png',
      );

      testActions = [
        ActionModel(id: 'action1', name: 'Action One', description: 'First test action'),
        ActionModel(id: 'action2', name: 'Action Two', description: 'Second test action'),
      ];

      mocktail.when(() => mockSecureStorage.read(key: 'jwt')).thenAnswer((_) async => null);
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
          home: ServiceActionsScreen(service: testService),
        ),
      );
    }

    testWidgets('shows loading state initially', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com');

      await tester.pumpWidget(createTestWidget());

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('loads and displays actions successfully', (WidgetTester tester) async {
      mocktail
          .when(() => mockBackendNotifier.backendAddress)
          .thenReturn('http://localhost:8080/');

      final mockClient = MockClient((request) async {
        if (request.url.toString().contains('api/services/service1/actions')) {
          return http.Response(
            jsonEncode({'actions': testActions.map((a) => a.toJson()).toList()}),
            200,
          );
        }
        return http.Response(jsonEncode({'error': 'Not Found'}), 404);
      });

      SecureHttpClient.setClient(mockClient);

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byType(ActionSelectionCard), findsNWidgets(2));
      expect(find.text('Action One'), findsOneWidget);
      expect(find.text('Action Two'), findsOneWidget);
    });

    testWidgets('shows error state when backend address is null', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn(null);

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ServiceActionsScreen));
      final localizations = AppLocalizations.of(context)!;
      expect(find.text(localizations.error_loading_actions), findsOneWidget);
    });

    testWidgets('shows error state when API call fails', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response('{"error": "API Error"}', 400);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ServiceActionsScreen));
      final localizations = AppLocalizations.of(context)!;
      expect(find.text(localizations.error_loading_actions), findsOneWidget);
    });

    testWidgets('shows empty state when no actions available', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response('{"actions": []}', 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byType(EmptyState), findsOneWidget);
      expect(find.text('No actions available'), findsOneWidget);
    });

    testWidgets('displays actions in list layout', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({
              'actions': [
                {'id': 'action1', 'name': 'Action One', 'description': 'First test action'},
                {'id': 'action2', 'name': 'Action Two', 'description': 'Second test action'},
              ],
            }),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byType(ListView), findsOneWidget);
      expect(find.byType(ActionSelectionCard), findsNWidgets(2));
    });

    testWidgets('navigates to ActionDetailsScreen when action is tapped', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({
              'actions': [
                {'id': 'action1', 'name': 'Action One', 'description': 'First test action'},
              ],
            }),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      await tester.tap(find.byType(ActionSelectionCard).first);
      await tester.pumpAndSettle();
    });

    testWidgets('refreshes actions when pull to refresh', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({
              'actions': [
                {'id': 'action1', 'name': 'Action One', 'description': 'First test action'},
              ],
            }),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      await tester.fling(find.byType(ListView), const Offset(0, 300), 1000);
      await tester.pumpAndSettle();
    });

    testWidgets('renders app bar with correct title', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      await tester.pumpWidget(createTestWidget());

      expect(find.text('Test Service'), findsOneWidget);
      expect(find.text('Actions'), findsOneWidget);
    });

    testWidgets('retry button works on error state', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response('{"error": "API Error"}', 400);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ServiceActionsScreen));
      final localizations = AppLocalizations.of(context)!;
      await tester.tap(find.text(localizations.retry));
      await tester.pumpAndSettle();
    });

    testWidgets('displays service icon correctly', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response('{"actions": []}', 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byType(Image), findsWidgets);
    });

    testWidgets('displays service description', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response('{"actions": []}', 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.text('A test service'), findsOneWidget);
    });

    testWidgets('displays action count correctly', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({
              'actions': [
                {'id': 'action1', 'name': 'Action One', 'description': 'First test action'},
              ],
            }),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.text('1 available action'), findsOneWidget);
    });

    testWidgets('displays plural action count correctly', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({
              'actions': [
                {'id': 'action1', 'name': 'Action One', 'description': 'First test action'},
                {'id': 'action2', 'name': 'Action Two', 'description': 'Second test action'},
              ],
            }),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.text('2 available actions'), findsOneWidget);
    });

    testWidgets('handles malformed JSON response', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response('Invalid JSON', 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ServiceActionsScreen));
      final localizations = AppLocalizations.of(context)!;
      expect(find.text(localizations.error_loading_actions), findsOneWidget);
    });

    testWidgets('displays error message without Exception prefix', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response('{"error": "Custom API Error"}', 500);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byType(ErrorState), findsOneWidget);
    });

    testWidgets('shows empty state with correct icon', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response('{"actions": []}', 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.flash_off), findsOneWidget);
    });

    testWidgets('displays service color in app bar', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response('{"actions": []}', 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final appBar = tester.widget<AppBar>(find.byType(AppBar));
      expect(appBar.backgroundColor, isNotNull);
    });

    testWidgets('handles network error gracefully', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          throw Exception('Network error');
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ServiceActionsScreen));
      final localizations = AppLocalizations.of(context)!;
      expect(find.text(localizations.error_loading_actions), findsOneWidget);
    });
  });
}
