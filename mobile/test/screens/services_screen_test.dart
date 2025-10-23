import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart' as mocktail;
import 'package:provider/provider.dart';
import 'package:area/screens/services_screen.dart';
import 'package:area/services/service_subscription_service.dart';
import 'package:area/core/notifiers/backend_address_notifier.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/widgets/common/state/empty_state.dart';
import 'package:area/widgets/common/state/error_state.dart';
import 'package:area/widgets/common/state/loading_state.dart';
import 'package:area/widgets/common/cards/status_badge.dart';
import 'package:area/widgets/common/buttons/primary_button.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:area/services/secure_http_client.dart';
import 'package:area/services/secure_storage.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class MockBackendAddressNotifier extends mocktail.Mock implements BackendAddressNotifier {}

class MockFlutterSecureStorage extends mocktail.Mock implements FlutterSecureStorage {}

void main() {
  group('ServicesScreen', () {
    late MockBackendAddressNotifier mockBackendNotifier;
    late MockFlutterSecureStorage mockSecureStorage;
    late List<ServiceInfo> testServices;

    setUp(() {
      mockBackendNotifier = MockBackendAddressNotifier();
      mockSecureStorage = MockFlutterSecureStorage();
      setSecureStorage(mockSecureStorage);

      mocktail
          .when(() => mockSecureStorage.read(key: 'jwt'))
          .thenAnswer((_) async => 'test-jwt-token');

      testServices = [
        ServiceInfo(
          id: 'service1',
          name: 'GitHub',
          description: 'GitHub service integration',
          version: '1.0.0',
          icon: '<svg><circle r="10"/></svg>',
          isSubscribed: true,
          oauthConnected: true,
          canCreateWebhooks: true,
          authEndpoint: '/github/auth',
          statusEndpoint: '/github/status',
          loginStatusEndpoint: '/github/login-status',
          subscribeEndpoint: '/github/subscribe',
          unsubscribeEndpoint: '/github/unsubscribe',
        ),
        ServiceInfo(
          id: 'service2',
          name: 'Discord',
          description: 'Discord service integration',
          version: '1.0.0',
          icon: '<svg><rect width="10" height="10"/></svg>',
          isSubscribed: false,
          oauthConnected: true,
          canCreateWebhooks: false,
          authEndpoint: '/discord/auth',
          statusEndpoint: '/discord/status',
          loginStatusEndpoint: '/discord/login-status',
          subscribeEndpoint: '/discord/subscribe',
          unsubscribeEndpoint: '/discord/unsubscribe',
        ),
        ServiceInfo(
          id: 'service3',
          name: 'Gmail',
          description: 'Gmail service integration',
          version: '1.0.0',
          icon: '',
          isSubscribed: false,
          oauthConnected: false,
          canCreateWebhooks: false,
          authEndpoint: '/gmail/auth',
          statusEndpoint: '/gmail/status',
          loginStatusEndpoint: '/gmail/login-status',
          subscribeEndpoint: '/gmail/subscribe',
          unsubscribeEndpoint: '/gmail/unsubscribe',
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
          home: const ServicesScreen(),
        ),
      );
    }

    Map<String, dynamic> serviceToJson(ServiceInfo service) {
      return {
        'id': service.id,
        'name': service.name,
        'description': service.description,
        'version': service.version,
        'icon': service.icon,
        'isSubscribed': service.isSubscribed,
        'oauthConnected': service.oauthConnected,
        'canCreateWebhooks': service.canCreateWebhooks,
        'endpoints': {
          'auth': service.authEndpoint,
          'status': service.statusEndpoint,
          'loginStatus': service.loginStatusEndpoint,
          'subscribe': service.subscribeEndpoint,
          'unsubscribe': service.unsubscribeEndpoint,
        },
      };
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
          return http.Response(jsonEncode({'services': []}), 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pump();

      expect(find.byType(LoadingState), findsOneWidget);

      await tester.pumpAndSettle();

      expect(find.byType(LoadingState), findsNothing);
    });

    testWidgets('loads and displays services successfully', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          if (request.url.toString().contains('api/services') && request.method == 'GET') {
            return http.Response(
              jsonEncode({'services': testServices.map((s) => serviceToJson(s)).toList()}),
              200,
            );
          }
          return http.Response(jsonEncode({'error': 'Not Found'}), 404);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.text('GitHub'), findsOneWidget);
      expect(find.text('Discord'), findsOneWidget);
      expect(find.text('Gmail'), findsOneWidget);
    });

    testWidgets('shows error state when backend address is null', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(jsonEncode({'error': 'Backend not configured'}), 500);
        }),
      );

      await tester.pumpWidget(createTestWidget());
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

      expect(find.byType(ErrorState), findsOneWidget);
    });

    testWidgets('shows empty state when no services available', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(jsonEncode({'services': []}), 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pump();
      await tester.pumpAndSettle();

      expect(find.byType(EmptyState), findsOneWidget);
      final context = tester.element(find.byType(ServicesScreen));
      final localizations = AppLocalizations.of(context)!;
      expect(find.text(localizations.no_services_found), findsOneWidget);
    });

    testWidgets('displays service cards with correct information', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({'services': testServices.map((s) => serviceToJson(s)).toList()}),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byType(Card), findsNWidgets(3));
      expect(find.text('GitHub'), findsOneWidget);
      expect(find.text('GitHub service integration'), findsOneWidget);
      expect(find.text('Discord'), findsOneWidget);
      expect(find.text('Discord service integration'), findsOneWidget);
    });

    testWidgets('shows correct status badges', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({'services': testServices.map((s) => serviceToJson(s)).toList()}),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ServicesScreen));
      final localizations = AppLocalizations.of(context)!;

      expect(find.byType(StatusBadge), findsNWidgets(3));
      expect(find.text(localizations.connected), findsOneWidget);
      expect(find.text(localizations.not_subscribed), findsOneWidget);
      expect(find.text(localizations.not_connected), findsOneWidget);
    });

    testWidgets('shows correct button text for subscribed service', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({'services': testServices.map((s) => serviceToJson(s)).toList()}),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ServicesScreen));
      final localizations = AppLocalizations.of(context)!;

      expect(find.text(localizations.unsubscribe), findsOneWidget);
    });

    testWidgets('shows correct button text for oauth connected but not subscribed', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({'services': testServices.map((s) => serviceToJson(s)).toList()}),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ServicesScreen));
      final localizations = AppLocalizations.of(context)!;

      expect(find.text(localizations.subscribe), findsOneWidget);
    });

    testWidgets('shows correct button text for not connected service', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({'services': testServices.map((s) => serviceToJson(s)).toList()}),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ServicesScreen));
      final localizations = AppLocalizations.of(context)!;

      expect(find.text(localizations.connect_and_subscribe), findsOneWidget);
    });

    testWidgets('refreshes services on pull to refresh', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      int callCount = 0;

      SecureHttpClient.setClient(
        MockClient((request) async {
          callCount++;
          return http.Response(
            jsonEncode({'services': testServices.map((s) => serviceToJson(s)).toList()}),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(callCount, equals(1));

      await tester.drag(find.text('GitHub'), const Offset(0, 300));
      await tester.pump();
      await tester.pumpAndSettle();

      expect(callCount, equals(2));
    });

    testWidgets('displays service icon when available', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({
              'services': [serviceToJson(testServices[0])],
            }),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byType(Card), findsOneWidget);
    });

    testWidgets('displays default icon when service icon is empty', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({
              'services': [serviceToJson(testServices[2])],
            }),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.api), findsOneWidget);
    });

    testWidgets('handles unsubscribe with confirmation dialog', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          if (request.method == 'GET') {
            return http.Response(
              jsonEncode({
                'services': [serviceToJson(testServices[0])],
              }),
              200,
            );
          }
          return http.Response('', 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ServicesScreen));
      final localizations = AppLocalizations.of(context)!;

      final unsubscribeButton = find.text(localizations.unsubscribe);
      expect(unsubscribeButton, findsOneWidget);

      await tester.tap(unsubscribeButton);
      await tester.pumpAndSettle();

      expect(find.byType(AlertDialog), findsOneWidget);
      expect(find.text(localizations.unsubscribe_from('GitHub')), findsOneWidget);
    });

    testWidgets('cancels unsubscribe when cancel is pressed', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      bool unsubscribeCalled = false;

      SecureHttpClient.setClient(
        MockClient((request) async {
          if (request.method == 'GET') {
            return http.Response(
              jsonEncode({
                'services': [serviceToJson(testServices[0])],
              }),
              200,
            );
          }
          if (request.method == 'POST' && request.url.toString().contains('unsubscribe')) {
            unsubscribeCalled = true;
            return http.Response('', 200);
          }
          return http.Response('', 404);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ServicesScreen));
      final localizations = AppLocalizations.of(context)!;

      await tester.tap(find.text(localizations.unsubscribe));
      await tester.pumpAndSettle();

      await tester.tap(find.text(localizations.cancel));
      await tester.pumpAndSettle();

      expect(unsubscribeCalled, isFalse);
      expect(find.byType(AlertDialog), findsNothing);
    });

    testWidgets('successfully unsubscribes from service', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      bool unsubscribeCalled = false;
      bool statusRefreshed = false;

      SecureHttpClient.setClient(
        MockClient((request) async {
          if (request.method == 'GET' && request.url.path.contains('services')) {
            return http.Response(
              jsonEncode({
                'services': [serviceToJson(testServices[0])],
              }),
              200,
            );
          }
          if (request.method == 'POST' && request.url.toString().contains('unsubscribe')) {
            unsubscribeCalled = true;
            return http.Response('', 200);
          }
          if (request.method == 'GET' && request.url.toString().contains('status')) {
            statusRefreshed = true;
            return http.Response(
              jsonEncode({
                'subscribed': false,
                'oauth_connected': true,
                'can_create_webhooks': false,
              }),
              200,
            );
          }
          if (request.method == 'GET' && request.url.toString().contains('login-status')) {
            return http.Response(jsonEncode({'connected': true}), 200);
          }
          return http.Response('', 404);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ServicesScreen));
      final localizations = AppLocalizations.of(context)!;

      await tester.tap(find.text(localizations.unsubscribe));
      await tester.pumpAndSettle();

      await tester.tap(find.text(localizations.confirm));
      await tester.pumpAndSettle();

      expect(unsubscribeCalled, isTrue);
      expect(statusRefreshed, isTrue);
    });

    testWidgets('shows error snackbar when unsubscribe fails', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          if (request.method == 'GET') {
            return http.Response(
              jsonEncode({
                'services': [serviceToJson(testServices[0])],
              }),
              200,
            );
          }
          if (request.method == 'POST' && request.url.toString().contains('unsubscribe')) {
            return http.Response(jsonEncode({'error': 'Unsubscribe failed'}), 500);
          }
          return http.Response('', 404);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ServicesScreen));
      final localizations = AppLocalizations.of(context)!;

      await tester.tap(find.text(localizations.unsubscribe));
      await tester.pumpAndSettle();

      await tester.tap(find.text(localizations.confirm));
      await tester.pumpAndSettle();

      expect(find.byType(SnackBar), findsOneWidget);
    });

    testWidgets('displays correct service descriptions', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({'services': testServices.map((s) => serviceToJson(s)).toList()}),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.text('GitHub service integration'), findsOneWidget);
      expect(find.text('Discord service integration'), findsOneWidget);
      expect(find.text('Gmail service integration'), findsOneWidget);
    });

    testWidgets('retries loading services when retry button is pressed', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      int callCount = 0;
      SecureHttpClient.setClient(
        MockClient((request) async {
          callCount++;
          if (callCount == 1) {
            return http.Response(jsonEncode({'error': 'API Error'}), 500);
          }
          return http.Response(
            jsonEncode({'services': testServices.map((s) => serviceToJson(s)).toList()}),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byType(ErrorState), findsOneWidget);

      final context = tester.element(find.byType(ServicesScreen));
      final localizations = AppLocalizations.of(context)!;

      await tester.tap(find.text(localizations.retry));
      await tester.pumpAndSettle();

      expect(find.byType(ErrorState), findsNothing);
      expect(find.text('GitHub'), findsOneWidget);
      expect(callCount, equals(2));
    });

    testWidgets('shows services title in app bar', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(jsonEncode({'services': []}), 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ServicesScreen));
      final localizations = AppLocalizations.of(context)!;

      expect(find.text(localizations.services), findsOneWidget);
    });

    testWidgets('handles multiple services correctly', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({'services': testServices.map((s) => serviceToJson(s)).toList()}),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byType(Card), findsNWidgets(3));
      expect(find.byType(PrimaryButton), findsNWidgets(3));
      expect(find.byType(StatusBadge), findsNWidgets(3));
    });

    testWidgets('shows loading dialog when processing subscription', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      bool unsubscribeCalled = false;

      SecureHttpClient.setClient(
        MockClient((request) async {
          if (request.method == 'GET' && request.url.path.contains('services')) {
            return http.Response(
              jsonEncode({
                'services': [serviceToJson(testServices[0])],
              }),
              200,
            );
          }
          if (request.method == 'POST' && request.url.toString().contains('unsubscribe')) {
            unsubscribeCalled = true;
            return http.Response('', 200);
          }
          if (request.method == 'GET' && request.url.toString().contains('status')) {
            return http.Response(
              jsonEncode({
                'subscribed': false,
                'oauth_connected': true,
                'can_create_webhooks': false,
              }),
              200,
            );
          }
          if (request.method == 'GET' && request.url.toString().contains('login-status')) {
            return http.Response(jsonEncode({'connected': true}), 200);
          }
          return http.Response('', 404);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ServicesScreen));
      final localizations = AppLocalizations.of(context)!;

      await tester.tap(find.text(localizations.unsubscribe));
      await tester.pumpAndSettle();

      await tester.tap(find.text(localizations.confirm));
      await tester.pump();

      expect(find.byType(AlertDialog), findsAtLeastNWidgets(1));

      await tester.pumpAndSettle();
      expect(unsubscribeCalled, isTrue);
    });

    testWidgets('displays services in list view', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({'services': testServices.map((s) => serviceToJson(s)).toList()}),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byType(ListView), findsOneWidget);
    });

    testWidgets('shows correct check circle icon for connected service', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({
              'services': [serviceToJson(testServices[0])],
            }),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.check_circle), findsOneWidget);
    });

    testWidgets('shows correct link icon for oauth connected service', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({
              'services': [serviceToJson(testServices[1])],
            }),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.link), findsOneWidget);
    });

    testWidgets('shows correct link_off icon for not connected service', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({
              'services': [serviceToJson(testServices[2])],
            }),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.link_off), findsOneWidget);
    });

    testWidgets('shows empty state with correct icon', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(jsonEncode({'services': []}), 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.api), findsOneWidget);
      expect(find.byType(EmptyState), findsOneWidget);
    });

    testWidgets('handles service with null or empty endpoints gracefully', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      final serviceWithEmptyEndpoints = ServiceInfo(
        id: 'service_empty',
        name: 'Empty Service',
        description: 'Service with empty endpoints',
        version: '1.0.0',
        icon: '',
        isSubscribed: false,
        oauthConnected: false,
        canCreateWebhooks: false,
        authEndpoint: '',
        statusEndpoint: '',
        loginStatusEndpoint: '',
        subscribeEndpoint: '',
        unsubscribeEndpoint: '',
      );

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            jsonEncode({
              'services': [serviceToJson(serviceWithEmptyEndpoints)],
            }),
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.text('Empty Service'), findsOneWidget);
      expect(find.text('Service with empty endpoints'), findsOneWidget);
    });
  });
}
