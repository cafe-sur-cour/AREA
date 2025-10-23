import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart' as mocktail;
import 'package:provider/provider.dart';
import 'package:area/screens/action_services_screen.dart';
import 'package:area/models/service_models.dart';
import 'package:area/core/notifiers/backend_address_notifier.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/widgets/service_card.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:area/services/secure_storage.dart';
import 'package:area/services/secure_http_client.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class MockBackendAddressNotifier extends mocktail.Mock implements BackendAddressNotifier {}

class MockFlutterSecureStorage extends mocktail.Mock implements FlutterSecureStorage {}

void main() {
  group('ActionServicesScreen', () {
    late MockBackendAddressNotifier mockBackendNotifier;
    late MockFlutterSecureStorage mockSecureStorage;
    late List<ServiceModel> testServices;

    setUp(() {
      mockBackendNotifier = MockBackendAddressNotifier();
      mockSecureStorage = MockFlutterSecureStorage();
      setSecureStorage(mockSecureStorage);
      testServices = [
        ServiceModel(
          id: 'service1',
          name: 'Service One',
          description: 'First test service',
          color: '#FF5733',
          icon: 'https://example.com/icon1.png',
        ),
        ServiceModel(
          id: 'service2',
          name: 'Service Two',
          description: 'Second test service',
          color: '#33FF57',
          icon: 'https://example.com/icon2.png',
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
          home: const ActionServicesScreen(),
        ),
      );
    }

    testWidgets('shows loading state initially', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com');

      await tester.pumpWidget(createTestWidget());

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('loads and displays services successfully', (WidgetTester tester) async {
      mocktail
          .when(() => mockBackendNotifier.backendAddress)
          .thenReturn('http://localhost:8080/');

      final mockClient = MockClient((request) async {
        if (request.url.toString().contains('api/services/actions')) {
          return http.Response(
            jsonEncode({'services': testServices.map((s) => s.toJson()).toList()}),
            200,
          );
        }
        return http.Response(jsonEncode({'error': 'Not Found'}), 404);
      });

      SecureHttpClient.setClient(mockClient);

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byType(ServiceCard), findsNWidgets(2));
      expect(find.text('Service One'), findsOneWidget);
      expect(find.text('Service Two'), findsOneWidget);
    });

    testWidgets('shows error state when backend address is null', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn(null);

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ActionServicesScreen));
      final localizations = AppLocalizations.of(context)!;
      expect(find.text(localizations.error_loading_services), findsOneWidget);
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

      final context = tester.element(find.byType(ActionServicesScreen));
      final localizations = AppLocalizations.of(context)!;
      expect(find.text(localizations.error_loading_services), findsOneWidget);
    });

    testWidgets('shows empty state when no services available', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response('{"services": []}', 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ActionServicesScreen));
      final localizations = AppLocalizations.of(context)!;
      expect(find.text(localizations.no_services_available), findsOneWidget);
    });

    testWidgets('displays services in grid layout', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            '{"services": [{"id": "service1", "name": "Service One", "description": "First test service", "color": "#FF5733", "icon": "https://example.com/icon1.png"}, {"id": "service2", "name": "Service Two", "description": "Second test service", "color": "#33FF57", "icon": "https://example.com/icon2.png"}]}',
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byType(GridView), findsOneWidget);
      expect(find.byType(ServiceCard), findsNWidgets(2));
    });

    testWidgets('navigates to ServiceActionsScreen when service is tapped', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            '{"services": [{"id": "service1", "name": "Service One", "description": "First test service", "color": "#FF5733", "icon": "https://example.com/icon1.png"}, {"id": "service2", "name": "Service Two", "description": "Second test service", "color": "#33FF57", "icon": "https://example.com/icon2.png"}]}',
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      await tester.tap(find.byType(ServiceCard).first);
      await tester.pumpAndSettle();
    });

    testWidgets('refreshes services when pull to refresh', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            '{"services": [{"id": "service1", "name": "Service One", "description": "First test service", "color": "#FF5733", "icon": "https://example.com/icon1.png"}, {"id": "service2", "name": "Service Two", "description": "Second test service", "color": "#33FF57", "icon": "https://example.com/icon2.png"}]}',
            200,
          );
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      await tester.fling(find.byType(GridView), const Offset(0, 300), 1000);
      await tester.pumpAndSettle();
    });

    testWidgets('uses correct cross axis count for different screen widths', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(
            '{"services": [{"id": "service1", "name": "Service One", "description": "First test service", "color": "#FF5733", "icon": "https://example.com/icon1.png"}, {"id": "service2", "name": "Service Two", "description": "Second test service", "color": "#33FF57", "icon": "https://example.com/icon2.png"}]}',
            200,
          );
        }),
      );

      tester.view.physicalSize = const Size(400, 800);
      tester.view.devicePixelRatio = 1.0;

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final gridView = tester.widget<GridView>(find.byType(GridView));
      final delegate = gridView.gridDelegate as SliverGridDelegateWithFixedCrossAxisCount;
      expect(delegate.crossAxisCount, 2);

      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    testWidgets('renders app bar with correct title', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      await tester.pumpWidget(createTestWidget());

      final context = tester.element(find.byType(ActionServicesScreen));
      final localizations = AppLocalizations.of(context)!;
      expect(find.text(localizations.action_services), findsOneWidget);
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

      final context = tester.element(find.byType(ActionServicesScreen));
      final localizations = AppLocalizations.of(context)!;
      await tester.tap(find.text(localizations.retry));
      await tester.pumpAndSettle();
    });
  });
}
