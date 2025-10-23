import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart' as mocktail;
import 'package:provider/provider.dart';
import 'package:area/screens/service_reactions_screen.dart';
import 'package:area/models/service_models.dart';
import 'package:area/models/reaction_models.dart';
import 'package:area/core/notifiers/backend_address_notifier.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/widgets/reaction_selection_card.dart';
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
  group('ServiceReactionsScreen', () {
    late MockBackendAddressNotifier mockBackendNotifier;
    late MockFlutterSecureStorage mockSecureStorage;
    late ServiceModel testService;
    late List<ReactionModel> testReactions;

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

      testReactions = [
        ReactionModel(
          id: 'reaction1',
          name: 'Reaction One',
          description: 'First test reaction',
        ),
        ReactionModel(
          id: 'reaction2',
          name: 'Reaction Two',
          description: 'Second test reaction',
        ),
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
          home: ServiceReactionsScreen(service: testService),
        ),
      );
    }

    testWidgets('shows loading state initially', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com');

      await tester.pumpWidget(createTestWidget());

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('loads and displays reactions successfully', (WidgetTester tester) async {
      mocktail
          .when(() => mockBackendNotifier.backendAddress)
          .thenReturn('http://localhost:8080/');

      final mockClient = MockClient((request) async {
        if (request.url.toString().contains('api/services/service1/reactions')) {
          return http.Response(
            jsonEncode({'reactions': testReactions.map((r) => r.toJson()).toList()}),
            200,
          );
        }
        return http.Response(jsonEncode({'error': 'Not Found'}), 404);
      });

      SecureHttpClient.setClient(mockClient);

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byType(ReactionSelectionCard), findsNWidgets(2));
      expect(find.text('Reaction One'), findsOneWidget);
      expect(find.text('Reaction Two'), findsOneWidget);
    });

    testWidgets('shows error state when backend address is null', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn(null);

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ServiceReactionsScreen));
      final localizations = AppLocalizations.of(context)!;
      expect(find.text(localizations.error_loading_reactions), findsOneWidget);
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

      final context = tester.element(find.byType(ServiceReactionsScreen));
      final localizations = AppLocalizations.of(context)!;
      expect(find.text(localizations.error_loading_reactions), findsOneWidget);
    });

    testWidgets('shows empty state when no reactions available', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response('{"reactions": []}', 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byType(EmptyState), findsOneWidget);
      expect(find.text('No reactions available'), findsOneWidget);
    });

    testWidgets('displays reactions in list layout', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({
              'reactions': [
                {
                  'id': 'reaction1',
                  'name': 'Reaction One',
                  'description': 'First test reaction',
                },
                {
                  'id': 'reaction2',
                  'name': 'Reaction Two',
                  'description': 'Second test reaction',
                },
              ],
            }),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byType(ListView), findsOneWidget);
      expect(find.byType(ReactionSelectionCard), findsNWidgets(2));
    });

    testWidgets('navigates to ReactionDetailsScreen when reaction is tapped', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({
              'reactions': [
                {
                  'id': 'reaction1',
                  'name': 'Reaction One',
                  'description': 'First test reaction',
                },
              ],
            }),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      await tester.tap(find.byType(ReactionSelectionCard).first);
      await tester.pumpAndSettle();
    });

    testWidgets('refreshes reactions when pull to refresh', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({
              'reactions': [
                {
                  'id': 'reaction1',
                  'name': 'Reaction One',
                  'description': 'First test reaction',
                },
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
      expect(find.text('Reactions'), findsOneWidget);
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

      final context = tester.element(find.byType(ServiceReactionsScreen));
      final localizations = AppLocalizations.of(context)!;
      await tester.tap(find.text(localizations.retry));
      await tester.pumpAndSettle();
    });

    testWidgets('displays service icon correctly', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response('{"reactions": []}', 200);
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
          return http.Response('{"reactions": []}', 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.text('A test service'), findsOneWidget);
    });

    testWidgets('displays reaction count correctly', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({
              'reactions': [
                {
                  'id': 'reaction1',
                  'name': 'Reaction One',
                  'description': 'First test reaction',
                },
              ],
            }),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.text('1 available reaction'), findsOneWidget);
    });

    testWidgets('displays plural reaction count correctly', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({
              'reactions': [
                {
                  'id': 'reaction1',
                  'name': 'Reaction One',
                  'description': 'First test reaction',
                },
                {
                  'id': 'reaction2',
                  'name': 'Reaction Two',
                  'description': 'Second test reaction',
                },
              ],
            }),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.text('2 available reactions'), findsOneWidget);
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

      final context = tester.element(find.byType(ServiceReactionsScreen));
      final localizations = AppLocalizations.of(context)!;
      expect(find.text(localizations.error_loading_reactions), findsOneWidget);
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
          return http.Response('{"reactions": []}', 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.replay_outlined), findsOneWidget);
    });

    testWidgets('displays service color in app bar', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response('{"reactions": []}', 200);
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

      final context = tester.element(find.byType(ServiceReactionsScreen));
      final localizations = AppLocalizations.of(context)!;
      expect(find.text(localizations.error_loading_reactions), findsOneWidget);
    });
  });
}
