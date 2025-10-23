import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart' as mocktail;
import 'package:provider/provider.dart';
import 'package:area/screens/profile_screen.dart';
import 'package:area/core/notifiers/backend_address_notifier.dart';
import 'package:area/core/notifiers/locale_notifier.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/widgets/common/text_fields/app_text_field.dart';
import 'package:area/widgets/common/buttons/primary_button.dart';
import 'package:area/widgets/common/state/loading_state.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:area/services/secure_http_client.dart';
import 'package:area/services/secure_storage.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class MockBackendAddressNotifier extends mocktail.Mock implements BackendAddressNotifier {}

class MockLocaleNotifier extends mocktail.Mock implements LocaleNotifier {}

class MockFlutterSecureStorage extends mocktail.Mock implements FlutterSecureStorage {}

class MockNavigatorObserver extends mocktail.Mock implements NavigatorObserver {}

void main() {
  setUpAll(() {
    mocktail.registerFallbackValue(const Locale('en'));
  });

  group('ProfileScreen', () {
    late MockBackendAddressNotifier mockBackendNotifier;
    late MockLocaleNotifier mockLocaleNotifier;
    late MockFlutterSecureStorage mockSecureStorage;
    late MockNavigatorObserver mockNavigatorObserver;

    setUp(() {
      mockBackendNotifier = MockBackendAddressNotifier();
      mockLocaleNotifier = MockLocaleNotifier();
      mockSecureStorage = MockFlutterSecureStorage();
      mockNavigatorObserver = MockNavigatorObserver();
      setSecureStorage(mockSecureStorage);

      mocktail.when(() => mockLocaleNotifier.locale).thenReturn(const Locale('en'));
      mocktail.when(() => mockLocaleNotifier.setLocale(mocktail.any())).thenAnswer((_) {});
      mocktail
          .when(() => mockBackendNotifier.setBackendAddress(mocktail.any()))
          .thenAnswer((_) {});
      mocktail.when(() => mockSecureStorage.read(key: 'jwt')).thenAnswer((_) async => null);
      mocktail.when(() => mockSecureStorage.delete(key: 'jwt')).thenAnswer((_) async => {});
    });

    tearDown(() {
      SecureHttpClient.reset();
    });

    Widget createTestWidget() {
      return MultiProvider(
        providers: [
          ChangeNotifierProvider<BackendAddressNotifier>.value(value: mockBackendNotifier),
          ChangeNotifierProvider<LocaleNotifier>.value(value: mockLocaleNotifier),
        ],
        child: MaterialApp(
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: Scaffold(body: const ProfileScreen()),
          navigatorObservers: [mockNavigatorObserver],
          routes: {
            '/login': (context) => const Scaffold(body: Text('Login Screen')),
            '/register': (context) => const Scaffold(body: Text('Register Screen')),
          },
        ),
      );
    }

    testWidgets('renders profile screen correctly when not connected', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ProfileScreen));
      final localizations = AppLocalizations.of(context)!;

      expect(find.text(localizations.not_connected), findsOneWidget);
      expect(find.text(localizations.login), findsOneWidget);
      expect(find.text(localizations.register), findsOneWidget);
      expect(find.byType(AppTextField), findsOneWidget);
    });

    testWidgets('displays loading state initially when jwt exists', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');
      mocktail
          .when(() => mockSecureStorage.read(key: 'jwt'))
          .thenAnswer((_) async => 'test-jwt-token');

      SecureHttpClient.setClient(
        MockClient((request) async {
          await Future.delayed(const Duration(milliseconds: 100));
          return http.Response(jsonEncode({'name': 'Test User'}), 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pump();

      expect(find.byType(LoadingState), findsOneWidget);

      await tester.pumpAndSettle();
    });

    testWidgets('displays user profile when connected', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');
      mocktail
          .when(() => mockSecureStorage.read(key: 'jwt'))
          .thenAnswer((_) async => 'test-jwt-token');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(jsonEncode({'name': 'Test User'}), 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.text('Test User'), findsOneWidget);
      expect(find.byIcon(Icons.account_circle), findsOneWidget);
    });

    testWidgets('displays logout button when connected', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');
      mocktail
          .when(() => mockSecureStorage.read(key: 'jwt'))
          .thenAnswer((_) async => 'test-jwt-token');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(jsonEncode({'name': 'Test User'}), 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ProfileScreen));
      final localizations = AppLocalizations.of(context)!;

      expect(find.text(localizations.logout), findsOneWidget);
    });

    testWidgets('displays services button when connected', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');
      mocktail
          .when(() => mockSecureStorage.read(key: 'jwt'))
          .thenAnswer((_) async => 'test-jwt-token');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(jsonEncode({'name': 'Test User'}), 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byType(PrimaryButton), findsOneWidget);
      expect(find.byIcon(Icons.api), findsOneWidget);
    });

    testWidgets('successfully logs out', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');
      mocktail
          .when(() => mockSecureStorage.read(key: 'jwt'))
          .thenAnswer((_) async => 'test-jwt-token');

      SecureHttpClient.setClient(
        MockClient((request) async {
          if (request.url.path.contains('me')) {
            return http.Response(jsonEncode({'name': 'Test User'}), 200);
          }
          return http.Response(jsonEncode({'message': 'Logged out'}), 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ProfileScreen));
      final localizations = AppLocalizations.of(context)!;

      await tester.tap(find.text(localizations.logout));
      await tester.pumpAndSettle();

      mocktail.verify(() => mockSecureStorage.delete(key: 'jwt')).called(1);
      expect(find.text(localizations.not_connected), findsOneWidget);
    });

    testWidgets('shows error when logout fails', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');
      mocktail
          .when(() => mockSecureStorage.read(key: 'jwt'))
          .thenAnswer((_) async => 'test-jwt-token');

      SecureHttpClient.setClient(
        MockClient((request) async {
          if (request.url.path.contains('me')) {
            return http.Response(jsonEncode({'name': 'Test User'}), 200);
          }
          return http.Response(jsonEncode({'error': 'Logout failed'}), 500);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ProfileScreen));
      final localizations = AppLocalizations.of(context)!;

      await tester.tap(find.text(localizations.logout));
      await tester.pumpAndSettle();

      expect(find.byType(SnackBar), findsOneWidget);
      expect(find.text('Logout failed'), findsOneWidget);
    });

    testWidgets('displays language selector', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.text('EN'), findsOneWidget);
      expect(find.byType(PopupMenuButton<Locale>), findsOneWidget);
    });

    testWidgets('changes language when selected', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      await tester.tap(find.text('EN'));
      await tester.pumpAndSettle();

      expect(find.text('FR'), findsOneWidget);

      await tester.tap(find.text('FR').last);
      await tester.pumpAndSettle();

      mocktail.verify(() => mockLocaleNotifier.setLocale(const Locale('fr'))).called(1);
    });

    testWidgets('displays backend server address field', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ProfileScreen));
      final localizations = AppLocalizations.of(context)!;

      expect(find.text(localizations.backend_server_address), findsOneWidget);
      expect(find.byType(AppTextField), findsOneWidget);
    });

    testWidgets('initializes backend address correctly', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final textField = tester.widget<AppTextField>(find.byType(AppTextField));
      expect(textField.controller.text, equals('http://test.com/'));
    });

    testWidgets('tests API address when field is submitted', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          if (request.url.path.contains('health')) {
            return http.Response(jsonEncode({'status': 'OK'}), 200);
          }
          return http.Response('Not found', 404);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final textField = find.byType(TextField);
      await tester.enterText(textField, 'http://newserver.com');
      await tester.testTextInput.receiveAction(TextInputAction.done);
      await tester.pumpAndSettle();

      expect(find.byType(SnackBar), findsOneWidget);
    });

    testWidgets('shows success snackbar on valid backend address', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(jsonEncode({'status': 'OK'}), 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ProfileScreen));
      final localizations = AppLocalizations.of(context)!;

      final textField = find.byType(TextField);
      await tester.enterText(textField, 'http://validserver.com');
      await tester.testTextInput.receiveAction(TextInputAction.done);
      await tester.pumpAndSettle();

      expect(find.byType(SnackBar), findsOneWidget);
      expect(find.text(localizations.valid_backend_server_address), findsOneWidget);
    });

    testWidgets('shows error snackbar on invalid backend address', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(jsonEncode({'status': 'ERROR'}), 500);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ProfileScreen));
      final localizations = AppLocalizations.of(context)!;

      final textField = find.byType(TextField);
      await tester.enterText(textField, 'http://invalidserver.com');
      await tester.testTextInput.receiveAction(TextInputAction.done);
      await tester.pumpAndSettle();

      expect(find.byType(SnackBar), findsOneWidget);
      expect(find.text(localizations.invalid_backend_server_address), findsOneWidget);
    });

    testWidgets('navigates to login screen when login is tapped', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ProfileScreen));
      final localizations = AppLocalizations.of(context)!;

      await tester.tap(find.text(localizations.login));
      await tester.pumpAndSettle();

      expect(find.text('Login Screen'), findsOneWidget);
    });

    testWidgets('navigates to register screen when register is tapped', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ProfileScreen));
      final localizations = AppLocalizations.of(context)!;

      await tester.tap(find.text(localizations.register));
      await tester.pumpAndSettle();

      expect(find.text('Register Screen'), findsOneWidget);
    });

    testWidgets('navigates to login screen when login button is tapped', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ProfileScreen));
      final localizations = AppLocalizations.of(context)!;

      expect(find.text(localizations.login), findsOneWidget);

      await tester.tap(find.text(localizations.login));
      await tester.pumpAndSettle();

      expect(find.text('Login Screen'), findsOneWidget);
    });

    testWidgets('handles 401 error by clearing jwt and showing not connected', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');
      mocktail
          .when(() => mockSecureStorage.read(key: 'jwt'))
          .thenAnswer((_) async => 'invalid-jwt-token');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(jsonEncode({'error': 'Unauthorized'}), 401);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ProfileScreen));
      final localizations = AppLocalizations.of(context)!;

      mocktail.verify(() => mockSecureStorage.delete(key: 'jwt')).called(1);
      expect(find.text(localizations.not_connected), findsOneWidget);
    });

    testWidgets('handles 404 error by clearing jwt and showing not connected', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');
      mocktail
          .when(() => mockSecureStorage.read(key: 'jwt'))
          .thenAnswer((_) async => 'invalid-jwt-token');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(jsonEncode({'error': 'Not found'}), 404);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ProfileScreen));
      final localizations = AppLocalizations.of(context)!;

      mocktail.verify(() => mockSecureStorage.delete(key: 'jwt')).called(1);
      expect(find.text(localizations.not_connected), findsOneWidget);
    });

    testWidgets('shows error when trying to logout without jwt', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');
      mocktail
          .when(() => mockSecureStorage.read(key: 'jwt'))
          .thenAnswer((_) async => 'test-jwt-token');

      bool firstCall = true;
      SecureHttpClient.setClient(
        MockClient((request) async {
          if (firstCall && request.url.path.contains('me')) {
            firstCall = false;
            return http.Response(jsonEncode({'name': 'Test User'}), 200);
          }
          return http.Response(jsonEncode({'message': 'Logged out'}), 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ProfileScreen));
      final localizations = AppLocalizations.of(context)!;

      mocktail.when(() => mockSecureStorage.read(key: 'jwt')).thenAnswer((_) async => null);

      await tester.tap(find.text(localizations.logout));
      await tester.pumpAndSettle();

      expect(find.byType(SnackBar), findsOneWidget);
      expect(find.text(localizations.not_connected), findsOneWidget);
    });

    testWidgets('shows error when backend address is null during logout', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');
      mocktail
          .when(() => mockSecureStorage.read(key: 'jwt'))
          .thenAnswer((_) async => 'test-jwt-token');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(jsonEncode({'name': 'Test User'}), 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ProfileScreen));
      final localizations = AppLocalizations.of(context)!;

      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn(null);

      await tester.tap(find.text(localizations.logout));
      await tester.pumpAndSettle();

      expect(find.byType(SnackBar), findsOneWidget);
      expect(find.text(localizations.empty_backend_server_address), findsOneWidget);
    });

    testWidgets('shows error when backend address is null during profile update', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn(null);
      mocktail
          .when(() => mockSecureStorage.read(key: 'jwt'))
          .thenAnswer((_) async => 'test-jwt-token');

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ProfileScreen));
      final localizations = AppLocalizations.of(context)!;

      expect(find.byType(SnackBar), findsOneWidget);
      expect(find.text(localizations.empty_backend_server_address), findsOneWidget);
    });

    testWidgets('adds trailing slash to backend address if missing', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com');

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      mocktail
          .verify(() => mockBackendNotifier.setBackendAddress('http://test.com/'))
          .called(1);
    });

    testWidgets('backend address field validator works correctly', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final textField = find.byType(TextField);
      await tester.enterText(textField, '');

      final appTextField = tester.widget<AppTextField>(find.byType(AppTextField));
      final validationResult = appTextField.validator!('');

      final context = tester.element(find.byType(ProfileScreen));
      final localizations = AppLocalizations.of(context)!;

      expect(validationResult, equals(localizations.empty_backend_server_address));
    });

    testWidgets('disposes controllers properly', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      await tester.pumpWidget(Container());

      expect(tester.takeException(), isNull);
    });
  });
}
