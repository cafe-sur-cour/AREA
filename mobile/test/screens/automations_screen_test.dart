import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart' as mocktail;
import 'package:provider/provider.dart';
import 'package:area/screens/automations_screen.dart';
import 'package:area/models/automation_models.dart';
import 'package:area/core/notifiers/backend_address_notifier.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/widgets/common/state/empty_state.dart';
import 'package:area/widgets/common/state/error_state.dart';
import 'package:area/widgets/common/cards/status_badge.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:area/services/secure_http_client.dart';
import 'package:area/services/secure_storage.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:area/widgets/common/state/loading_state.dart';

class MockBackendAddressNotifier extends mocktail.Mock implements BackendAddressNotifier {}

class MockFlutterSecureStorage extends mocktail.Mock implements FlutterSecureStorage {}

void main() {
  group('AutomationsScreen', () {
    late MockBackendAddressNotifier mockBackendNotifier;
    late MockFlutterSecureStorage mockSecureStorage;
    late List<AutomationModel> testAutomations;

    setUp(() {
      mockBackendNotifier = MockBackendAddressNotifier();
      mockSecureStorage = MockFlutterSecureStorage();
      setSecureStorage(mockSecureStorage);

      mocktail
          .when(() => mockSecureStorage.read(key: 'jwt'))
          .thenAnswer((_) async => 'test-jwt-token');

      testAutomations = [
        AutomationModel(
          id: 1,
          name: 'Test Automation 1',
          description: 'First test automation',
          action: AutomationAction(type: 'test.action1', config: {}),
          reactions: [AutomationReaction(type: 'test.reaction1', config: {}, delay: 0)],
          isActive: true,
          createdBy: 1,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        ),
        AutomationModel(
          id: 2,
          name: 'Test Automation 2',
          description: 'Second test automation',
          action: AutomationAction(type: 'test.action2', config: {}),
          reactions: [
            AutomationReaction(type: 'test.reaction2', config: {}, delay: 60),
            AutomationReaction(type: 'test.reaction3', config: {}, delay: 0),
          ],
          isActive: false,
          createdBy: 1,
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
        ),
      ];
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
          home: Scaffold(body: const AutomationsScreen()),
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
          return http.Response(jsonEncode({'mappings': []}), 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());

      await tester.pump();

      expect(find.byType(LoadingState), findsOneWidget);

      await tester.pumpAndSettle();

      expect(find.byType(LoadingState), findsNothing);
    });

    testWidgets('loads and displays automations successfully', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');
      mocktail
          .when(() => mockSecureStorage.read(key: 'jwt'))
          .thenAnswer((_) async => 'test-jwt-token');

      SecureHttpClient.setClient(
        MockClient((request) async {
          if (request.url.toString().contains('api/mappings') && request.method == 'GET') {
            return http.Response(
              jsonEncode({
                'mappings': testAutomations
                    .map(
                      (a) => {
                        'id': a.id,
                        'name': a.name,
                        'description': a.description,
                        'action': {'type': a.action.type, 'config': a.action.config},
                        'reactions': a.reactions
                            .map((r) => {'type': r.type, 'config': r.config, 'delay': r.delay})
                            .toList(),
                        'is_active': a.isActive,
                        'created_by': a.createdBy,
                        'created_at': a.createdAt,
                        'updated_at': a.updatedAt,
                      },
                    )
                    .toList(),
              }),
              200,
            );
          }
          return http.Response(jsonEncode({'error': 'Not Found'}), 404);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.text('Test Automation 1'), findsOneWidget);
      expect(find.text('Test Automation 2'), findsOneWidget);
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

      final context = tester.element(find.byType(AutomationsScreen));
      final localizations = AppLocalizations.of(context)!;
      expect(find.text(localizations.error_loading_automations), findsOneWidget);
    });

    testWidgets('shows not connected state when JWT is missing', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');
      mocktail.when(() => mockSecureStorage.read(key: 'jwt')).thenAnswer((_) async => null);

      await tester.pumpWidget(createTestWidget());
      await tester.pump();
      await tester.pumpAndSettle();

      expect(find.byType(EmptyState), findsOneWidget);
      final context = tester.element(find.byType(AutomationsScreen));
      final localizations = AppLocalizations.of(context)!;
      expect(find.text(localizations.connect_to_create), findsOneWidget);
    });

    testWidgets('shows empty state when no automations', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(jsonEncode({'mappings': []}), 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pump();
      await tester.pumpAndSettle();

      expect(find.byType(EmptyState), findsOneWidget);
    });

    testWidgets('displays automation cards with correct information', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({
              'mappings': testAutomations
                  .map(
                    (a) => {
                      'id': a.id,
                      'name': a.name,
                      'description': a.description,
                      'action': {'type': a.action.type, 'config': a.action.config},
                      'reactions': a.reactions
                          .map((r) => {'type': r.type, 'config': r.config, 'delay': r.delay})
                          .toList(),
                      'is_active': a.isActive,
                      'created_by': a.createdBy,
                      'created_at': a.createdAt,
                      'updated_at': a.updatedAt,
                    },
                  )
                  .toList(),
            }),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pump();
      await tester.pumpAndSettle();

      expect(find.byType(Card), findsNWidgets(2));
      expect(find.text('Test Automation 1'), findsOneWidget);
      expect(find.text('First test automation'), findsOneWidget);
      expect(find.text('test.action1'), findsOneWidget);
      expect(find.text('test.reaction1'), findsOneWidget);
    });

    testWidgets('shows active/inactive status badges', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({
              'mappings': testAutomations
                  .map(
                    (a) => {
                      'id': a.id,
                      'name': a.name,
                      'description': a.description,
                      'action': {'type': a.action.type, 'config': a.action.config},
                      'reactions': a.reactions
                          .map((r) => {'type': r.type, 'config': r.config, 'delay': r.delay})
                          .toList(),
                      'is_active': a.isActive,
                      'created_by': a.createdBy,
                      'created_at': a.createdAt,
                      'updated_at': a.updatedAt,
                    },
                  )
                  .toList(),
            }),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pump();
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(AutomationsScreen));
      final localizations = AppLocalizations.of(context)!;
      expect(find.byType(StatusBadge), findsNWidgets(2));
      expect(find.text(localizations.active), findsOneWidget);
      expect(find.text(localizations.inactive), findsOneWidget);
    });

    testWidgets('shows correct reaction count text', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({
              'mappings': testAutomations
                  .map(
                    (a) => {
                      'id': a.id,
                      'name': a.name,
                      'description': a.description,
                      'action': {'type': a.action.type, 'config': a.action.config},
                      'reactions': a.reactions
                          .map((r) => {'type': r.type, 'config': r.config, 'delay': r.delay})
                          .toList(),
                      'is_active': a.isActive,
                      'created_by': a.createdBy,
                      'created_at': a.createdAt,
                      'updated_at': a.updatedAt,
                    },
                  )
                  .toList(),
            }),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pump();
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(AutomationsScreen));
      final localizations = AppLocalizations.of(context)!;
      expect(find.text(localizations.reaction), findsOneWidget);
      expect(find.text(localizations.reactions), findsOneWidget);
    });

    testWidgets('toggles automation status when play/pause button is pressed', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      bool isDeactivateCalled = false;

      SecureHttpClient.setClient(
        MockClient((request) async {
          if (request.url.toString().contains('api/mappings') && request.method == 'GET') {
            return http.Response(
              jsonEncode({
                'mappings': testAutomations
                    .map(
                      (a) => {
                        'id': a.id,
                        'name': a.name,
                        'description': a.description,
                        'action': {'type': a.action.type, 'config': a.action.config},
                        'reactions': a.reactions
                            .map((r) => {'type': r.type, 'config': r.config, 'delay': r.delay})
                            .toList(),
                        'is_active': a.isActive,
                        'created_by': a.createdBy,
                        'created_at': a.createdAt,
                        'updated_at': a.updatedAt,
                      },
                    )
                    .toList(),
              }),
              200,
            );
          }
          if (request.url.toString().contains('deactivate') && request.method == 'PUT') {
            isDeactivateCalled = true;
            return http.Response(
              jsonEncode({
                'mapping': {'updated_at': '2024-01-01T00:00:00Z'},
              }),
              200,
            );
          }
          return http.Response(jsonEncode({'error': 'Not Found'}), 404);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final pauseButton = find.byIcon(Icons.pause);
      expect(pauseButton, findsOneWidget);

      await tester.tap(pauseButton);
      await tester.pumpAndSettle();

      expect(isDeactivateCalled, isTrue);
    });

    testWidgets('shows delete confirmation dialog', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({
              'mappings': testAutomations
                  .map(
                    (a) => {
                      'id': a.id,
                      'name': a.name,
                      'description': a.description,
                      'action': {'type': a.action.type, 'config': a.action.config},
                      'reactions': a.reactions
                          .map((r) => {'type': r.type, 'config': r.config, 'delay': r.delay})
                          .toList(),
                      'is_active': a.isActive,
                      'created_by': a.createdBy,
                      'created_at': a.createdAt,
                      'updated_at': a.updatedAt,
                    },
                  )
                  .toList(),
            }),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pump();
      await tester.pumpAndSettle();

      await tester.tap(find.byIcon(Icons.delete_outline).first);
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(AutomationsScreen));
      final localizations = AppLocalizations.of(context)!;
      expect(find.byType(AlertDialog), findsOneWidget);
      expect(find.text(localizations.delete_automation), findsOneWidget);
    });

    testWidgets('deletes automation when confirmed', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      bool isDeleteCalled = false;

      SecureHttpClient.setClient(
        MockClient((request) async {
          if (request.url.toString().contains('api/mappings') && request.method == 'GET') {
            return http.Response(
              jsonEncode({
                'mappings': testAutomations
                    .map(
                      (a) => {
                        'id': a.id,
                        'name': a.name,
                        'description': a.description,
                        'action': {'type': a.action.type, 'config': a.action.config},
                        'reactions': a.reactions
                            .map((r) => {'type': r.type, 'config': r.config, 'delay': r.delay})
                            .toList(),
                        'is_active': a.isActive,
                        'created_by': a.createdBy,
                        'created_at': a.createdAt,
                        'updated_at': a.updatedAt,
                      },
                    )
                    .toList(),
              }),
              200,
            );
          }
          if (request.method == 'DELETE') {
            isDeleteCalled = true;
            return http.Response('', 204);
          }
          return http.Response(jsonEncode({'error': 'Not Found'}), 404);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(AutomationsScreen));
      final localizations = AppLocalizations.of(context)!;

      final deleteButton = find.byIcon(Icons.delete_outline).first;
      await tester.tap(deleteButton);
      await tester.pumpAndSettle();

      await tester.tap(find.text(localizations.delete));
      await tester.pumpAndSettle();

      expect(isDeleteCalled, isTrue);
      expect(find.text('Test Automation 1'), findsNothing);
    });

    testWidgets('refreshes automations on pull to refresh', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      int callCount = 0;

      SecureHttpClient.setClient(
        MockClient((request) async {
          callCount++;
          return http.Response(
            jsonEncode({
              'mappings': testAutomations
                  .map(
                    (a) => {
                      'id': a.id,
                      'name': a.name,
                      'description': a.description,
                      'action': {'type': a.action.type, 'config': a.action.config},
                      'reactions': a.reactions
                          .map((r) => {'type': r.type, 'config': r.config, 'delay': r.delay})
                          .toList(),
                      'is_active': a.isActive,
                      'created_by': a.createdBy,
                      'created_at': a.createdAt,
                      'updated_at': a.updatedAt,
                    },
                  )
                  .toList(),
            }),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pump();
      await tester.pumpAndSettle();

      expect(callCount, equals(1));

      await tester.drag(find.text('Test Automation 1'), const Offset(0, 300));
      await tester.pump();
      await tester.pumpAndSettle();

      expect(callCount, equals(2));
    });

    testWidgets('displays my areas title', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({
              'mappings': testAutomations
                  .map(
                    (a) => {
                      'id': a.id,
                      'name': a.name,
                      'description': a.description,
                      'action': {'type': a.action.type, 'config': a.action.config},
                      'reactions': a.reactions
                          .map((r) => {'type': r.type, 'config': r.config, 'delay': r.delay})
                          .toList(),
                      'is_active': a.isActive,
                      'created_by': a.createdBy,
                      'created_at': a.createdAt,
                      'updated_at': a.updatedAt,
                    },
                  )
                  .toList(),
            }),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pump();
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(AutomationsScreen));
      final localizations = AppLocalizations.of(context)!;
      expect(find.text(localizations.my_areas), findsOneWidget);
    });

    testWidgets('handles automation with multiple reactions', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({
              'mappings': testAutomations
                  .map(
                    (a) => {
                      'id': a.id,
                      'name': a.name,
                      'description': a.description,
                      'action': {'type': a.action.type, 'config': a.action.config},
                      'reactions': a.reactions
                          .map((r) => {'type': r.type, 'config': r.config, 'delay': r.delay})
                          .toList(),
                      'is_active': a.isActive,
                      'created_by': a.createdBy,
                      'created_at': a.createdAt,
                      'updated_at': a.updatedAt,
                    },
                  )
                  .toList(),
            }),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pump();
      await tester.pumpAndSettle();

      expect(find.text('test.reaction2'), findsOneWidget);
      expect(find.text('test.reaction3'), findsOneWidget);
    });

    testWidgets('shows error snackbar when status toggle fails', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          if (request.url.toString().contains('api/mappings') && request.method == 'GET') {
            return http.Response(
              jsonEncode({
                'mappings': testAutomations
                    .map(
                      (a) => {
                        'id': a.id,
                        'name': a.name,
                        'description': a.description,
                        'action': {'type': a.action.type, 'config': a.action.config},
                        'reactions': a.reactions
                            .map((r) => {'type': r.type, 'config': r.config, 'delay': r.delay})
                            .toList(),
                        'is_active': a.isActive,
                        'created_by': a.createdBy,
                        'created_at': a.createdAt,
                        'updated_at': a.updatedAt,
                      },
                    )
                    .toList(),
              }),
              200,
            );
          }
          if (request.url.toString().contains('deactivate') && request.method == 'PUT') {
            return http.Response(jsonEncode({'error': 'Toggle failed'}), 500);
          }
          return http.Response(jsonEncode({'error': 'Not Found'}), 404);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final pauseButton = find.byIcon(Icons.pause);
      expect(pauseButton, findsOneWidget);

      await tester.tap(pauseButton);
      await tester.pumpAndSettle();

      expect(find.byType(SnackBar), findsOneWidget);
    });

    testWidgets('shows error snackbar when deletion fails', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          if (request.url.toString().contains('api/mappings') && request.method == 'GET') {
            return http.Response(
              jsonEncode({
                'mappings': testAutomations
                    .map(
                      (a) => {
                        'id': a.id,
                        'name': a.name,
                        'description': a.description,
                        'action': {'type': a.action.type, 'config': a.action.config},
                        'reactions': a.reactions
                            .map((r) => {'type': r.type, 'config': r.config, 'delay': r.delay})
                            .toList(),
                        'is_active': a.isActive,
                        'created_by': a.createdBy,
                        'created_at': a.createdAt,
                        'updated_at': a.updatedAt,
                      },
                    )
                    .toList(),
              }),
              200,
            );
          }
          if (request.method == 'DELETE') {
            return http.Response(jsonEncode({'error': 'Delete failed'}), 500);
          }
          return http.Response(jsonEncode({'error': 'Not Found'}), 404);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(AutomationsScreen));
      final localizations = AppLocalizations.of(context)!;

      final deleteButton = find.byIcon(Icons.delete_outline).first;
      await tester.tap(deleteButton);
      await tester.pumpAndSettle();

      await tester.tap(find.text(localizations.delete));
      await tester.pumpAndSettle();

      expect(find.byType(SnackBar), findsOneWidget);
    });
  });
}
