import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart' as mocktail;
import 'package:provider/provider.dart';
import 'package:area/screens/catalogue_screen.dart';
import 'package:area/core/notifiers/backend_address_notifier.dart';
import 'package:area/core/notifiers/automation_builder_notifier.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/widgets/common/state/error_state.dart';
import 'package:area/widgets/common/state/loading_state.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:area/services/secure_http_client.dart';
import 'package:area/services/secure_storage.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class MockBackendAddressNotifier extends mocktail.Mock implements BackendAddressNotifier {}

class MockAutomationBuilderNotifier extends mocktail.Mock
    implements AutomationBuilderNotifier {}

class MockFlutterSecureStorage extends mocktail.Mock implements FlutterSecureStorage {}

void main() {
  group('CatalogueScreen', () {
    late MockBackendAddressNotifier mockBackendNotifier;
    late MockAutomationBuilderNotifier mockAutomationBuilder;
    late MockFlutterSecureStorage mockSecureStorage;

    setUp(() {
      mockBackendNotifier = MockBackendAddressNotifier();
      mockAutomationBuilder = MockAutomationBuilderNotifier();
      mockSecureStorage = MockFlutterSecureStorage();
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
          ChangeNotifierProvider<AutomationBuilderNotifier>.value(
            value: mockAutomationBuilder,
          ),
        ],
        child: MaterialApp(
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: const Scaffold(body: CatalogueScreen()),
        ),
      );
    }

    testWidgets('shows loading state initially', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      bool requestReceived = false;
      SecureHttpClient.setClient(
        MockClient((request) async {
          if (!requestReceived) {
            requestReceived = true;
            await Future.delayed(const Duration(milliseconds: 50));
          }
          return http.Response(
            jsonEncode({
              'server': {'services': []},
            }),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pump();

      expect(find.byType(LoadingState), findsOneWidget);

      await tester.pumpAndSettle();

      expect(find.byType(LoadingState), findsNothing);
    });

    testWidgets('loads and displays catalogue items successfully', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({
              'server': {
                'services': [
                  {
                    'id': 'service1',
                    'name': 'Test Service',
                    'icon': '<svg></svg>',
                    'actions': [
                      {
                        'id': 'action1',
                        'name': 'Test Action',
                        'description': 'Action description',
                      },
                    ],
                    'reactions': [
                      {
                        'id': 'reaction1',
                        'name': 'Test Reaction',
                        'description': 'Reaction description',
                      },
                    ],
                  },
                ],
              },
            }),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.text('Test Action'), findsOneWidget);
      expect(find.text('Test Reaction'), findsOneWidget);
    });

    testWidgets('shows error state when backend address is null', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn(null);

      await tester.pumpWidget(createTestWidget());
      await tester.pump();
      await tester.pumpAndSettle();

      expect(find.byType(ErrorState), findsOneWidget);
    });

    testWidgets('shows error state when API call fails', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(jsonEncode({'error': 'API Error'}), 500);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pump();
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(CatalogueScreen));
      final localizations = AppLocalizations.of(context)!;
      expect(find.text(localizations.error_loading_catalogue), findsOneWidget);
    });

    testWidgets('shows empty state when no items available', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({
              'server': {'services': []},
            }),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pump();
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(CatalogueScreen));
      final localizations = AppLocalizations.of(context)!;
      expect(find.text(localizations.no_items_available), findsOneWidget);
    });

    testWidgets('filter dropdowns work correctly', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({
              'server': {
                'services': [
                  {
                    'id': 'service1',
                    'name': 'Test Service',
                    'icon': '',
                    'actions': [
                      {
                        'id': 'action1',
                        'name': 'Test Action',
                        'description': 'Action description',
                      },
                    ],
                    'reactions': [
                      {
                        'id': 'reaction1',
                        'name': 'Test Reaction',
                        'description': 'Reaction description',
                      },
                    ],
                  },
                ],
              },
            }),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(CatalogueScreen));
      final localizations = AppLocalizations.of(context)!;

      expect(find.text('Test Action'), findsOneWidget);
      expect(find.text('Test Reaction'), findsOneWidget);

      // Filter to actions
      await tester.tap(find.byType(DropdownButton<String>).first);
      await tester.pumpAndSettle();
      await tester.tap(find.text(localizations.actions));
      await tester.pumpAndSettle();

      expect(find.text('Test Action'), findsOneWidget);
      expect(find.text('Test Reaction'), findsNothing);

      // Filter to reactions
      await tester.tap(find.byType(DropdownButton<String>).first);
      await tester.pumpAndSettle();
      await tester.tap(find.text(localizations.reactions_filter));
      await tester.pumpAndSettle();

      expect(find.text('Test Action'), findsNothing);
      expect(find.text('Test Reaction'), findsOneWidget);

      // Filter to all
      await tester.tap(find.byType(DropdownButton<String>).first);
      await tester.pumpAndSettle();
      await tester.tap(find.text(localizations.all));
      await tester.pumpAndSettle();

      expect(find.text('Test Action'), findsOneWidget);
      expect(find.text('Test Reaction'), findsOneWidget);
    });

    testWidgets('shows item dialog when card is tapped', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({
              'server': {
                'services': [
                  {
                    'id': 'service1',
                    'name': 'Test Service',
                    'icon': '',
                    'actions': [
                      {
                        'id': 'action1',
                        'name': 'Test Action',
                        'description': 'Action description',
                      },
                    ],
                    'reactions': [],
                  },
                ],
              },
            }),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      await tester.tap(find.text('Test Action'));
      await tester.pumpAndSettle();

      expect(find.byType(AlertDialog), findsOneWidget);
      expect(find.text('Action description'), findsOneWidget);
    });

    testWidgets('dialog shows use as action button for actions', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({
              'server': {
                'services': [
                  {
                    'id': 'service1',
                    'name': 'Test Service',
                    'icon': '',
                    'actions': [
                      {
                        'id': 'action1',
                        'name': 'Test Action',
                        'description': 'Action description',
                      },
                    ],
                    'reactions': [],
                  },
                ],
              },
            }),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      await tester.tap(find.text('Test Action'));
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(AlertDialog));
      final localizations = AppLocalizations.of(context)!;
      expect(find.text(localizations.use_as_action), findsOneWidget);
    });

    testWidgets('dialog shows use as reaction button for reactions', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({
              'server': {
                'services': [
                  {
                    'id': 'service1',
                    'name': 'Test Service',
                    'icon': '',
                    'actions': [],
                    'reactions': [
                      {
                        'id': 'reaction1',
                        'name': 'Test Reaction',
                        'description': 'Reaction description',
                      },
                    ],
                  },
                ],
              },
            }),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      await tester.tap(find.text('Test Reaction'));
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(AlertDialog));
      final localizations = AppLocalizations.of(context)!;
      expect(find.text(localizations.use_as_reaction), findsOneWidget);
    });

    testWidgets('displays catalogue cards in grid layout', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({
              'server': {
                'services': [
                  {
                    'id': 'service1',
                    'name': 'Test Service',
                    'icon': '',
                    'actions': [
                      {'id': 'action1', 'name': 'Test Action 1', 'description': ''},
                      {'id': 'action2', 'name': 'Test Action 2', 'description': ''},
                    ],
                    'reactions': [],
                  },
                ],
              },
            }),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byType(GridView), findsOneWidget);
      expect(find.byType(Card), findsNWidgets(2));
    });

    testWidgets('shows no description available when description is empty', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({
              'server': {
                'services': [
                  {
                    'id': 'service1',
                    'name': 'Test Service',
                    'icon': '',
                    'actions': [
                      {'id': 'action1', 'name': 'Test Action', 'description': ''},
                    ],
                    'reactions': [],
                  },
                ],
              },
            }),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      await tester.tap(find.text('Test Action'));
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(AlertDialog));
      final localizations = AppLocalizations.of(context)!;
      expect(find.text(localizations.no_description_available), findsOneWidget);
    });

    testWidgets('displays service icon when available', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({
              'server': {
                'services': [
                  {
                    'id': 'service1',
                    'name': 'Test Service',
                    'icon': '<svg><circle r="10"/></svg>',
                    'actions': [
                      {'id': 'action1', 'name': 'Test Action', 'description': ''},
                    ],
                    'reactions': [],
                  },
                ],
              },
            }),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byType(Card), findsOneWidget);
    });

    testWidgets('shows correct action icon', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({
              'server': {
                'services': [
                  {
                    'id': 'service1',
                    'name': 'Test Service',
                    'icon': '',
                    'actions': [
                      {'id': 'action1', 'name': 'Test Action', 'description': ''},
                    ],
                    'reactions': [],
                  },
                ],
              },
            }),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.play_arrow), findsOneWidget);
    });

    testWidgets('shows correct reaction icon', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({
              'server': {
                'services': [
                  {
                    'id': 'service1',
                    'name': 'Test Service',
                    'icon': '',
                    'actions': [],
                    'reactions': [
                      {'id': 'reaction1', 'name': 'Test Reaction', 'description': ''},
                    ],
                  },
                ],
              },
            }),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.bolt), findsOneWidget);
    });

    testWidgets('shows empty state for actions filter when no actions', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({
              'server': {
                'services': [
                  {
                    'id': 'service1',
                    'name': 'Test Service',
                    'icon': '',
                    'actions': [],
                    'reactions': [
                      {'id': 'reaction1', 'name': 'Test Reaction', 'description': ''},
                    ],
                  },
                ],
              },
            }),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(CatalogueScreen));
      final localizations = AppLocalizations.of(context)!;

      await tester.tap(find.byType(DropdownButton<String>).first);
      await tester.pumpAndSettle();
      await tester.tap(find.text(localizations.actions));
      await tester.pumpAndSettle();

      expect(find.text(localizations.no_filter_available('actions')), findsOneWidget);
    });

    testWidgets('shows empty state for reactions filter when no reactions', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({
              'server': {
                'services': [
                  {
                    'id': 'service1',
                    'name': 'Test Service',
                    'icon': '',
                    'actions': [
                      {'id': 'action1', 'name': 'Test Action', 'description': ''},
                    ],
                    'reactions': [],
                  },
                ],
              },
            }),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(CatalogueScreen));
      final localizations = AppLocalizations.of(context)!;

      await tester.tap(find.byType(DropdownButton<String>).first);
      await tester.pumpAndSettle();
      await tester.tap(find.text(localizations.reactions_filter));
      await tester.pumpAndSettle();

      expect(find.text(localizations.no_filter_available('reactions')), findsOneWidget);
    });

    testWidgets('displays filter dropdowns', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({
              'server': {'services': []},
            }),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byType(DropdownButton<String>), findsNWidgets(2));
    });

    testWidgets('handles multiple services with actions and reactions', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({
              'server': {
                'services': [
                  {
                    'id': 'service1',
                    'name': 'Service 1',
                    'icon': '',
                    'actions': [
                      {'id': 'action1', 'name': 'Action 1', 'description': ''},
                    ],
                    'reactions': [
                      {'id': 'reaction1', 'name': 'Reaction 1', 'description': ''},
                    ],
                  },
                  {
                    'id': 'service2',
                    'name': 'Service 2',
                    'icon': '',
                    'actions': [
                      {'id': 'action2', 'name': 'Action 2', 'description': ''},
                    ],
                    'reactions': [
                      {'id': 'reaction2', 'name': 'Reaction 2', 'description': ''},
                    ],
                  },
                ],
              },
            }),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.text('Action 1'), findsOneWidget);
      expect(find.text('Action 2'), findsOneWidget);
      expect(find.text('Reaction 1'), findsOneWidget);
      expect(find.text('Reaction 2'), findsOneWidget);
    });

    testWidgets('closes dialog when cancel button is pressed', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({
              'server': {
                'services': [
                  {
                    'id': 'service1',
                    'name': 'Test Service',
                    'icon': '',
                    'actions': [
                      {'id': 'action1', 'name': 'Test Action', 'description': ''},
                    ],
                    'reactions': [],
                  },
                ],
              },
            }),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      await tester.tap(find.text('Test Action'));
      await tester.pumpAndSettle();

      expect(find.byType(AlertDialog), findsOneWidget);

      final context = tester.element(find.byType(AlertDialog));
      final localizations = AppLocalizations.of(context)!;

      await tester.tap(find.text(localizations.cancel));
      await tester.pumpAndSettle();

      expect(find.byType(AlertDialog), findsNothing);
    });
  });
}
