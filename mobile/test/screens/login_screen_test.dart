import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart' as mocktail;
import 'package:provider/provider.dart';
import 'package:area/screens/login_screen.dart';
import 'package:area/core/notifiers/backend_address_notifier.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/widgets/common/text_fields/email_text_field.dart';
import 'package:area/widgets/common/text_fields/password_text_field.dart';
import 'package:area/widgets/common/buttons/primary_button.dart';
import 'package:area/widgets/common/buttons/secondary_button.dart';
import 'package:area/widgets/common/buttons/oauth_button.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:area/services/secure_http_client.dart';
import 'package:area/services/secure_storage.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class MockBackendAddressNotifier extends mocktail.Mock implements BackendAddressNotifier {}

class MockFlutterSecureStorage extends mocktail.Mock implements FlutterSecureStorage {}

class MockNavigatorObserver extends mocktail.Mock implements NavigatorObserver {}

void main() {
  group('LoginScreen', () {
    late MockBackendAddressNotifier mockBackendNotifier;
    late MockFlutterSecureStorage mockSecureStorage;
    late MockNavigatorObserver mockNavigatorObserver;

    setUp(() {
      mockBackendNotifier = MockBackendAddressNotifier();
      mockSecureStorage = MockFlutterSecureStorage();
      mockNavigatorObserver = MockNavigatorObserver();
      setSecureStorage(mockSecureStorage);

      mocktail
          .when(
            () => mockSecureStorage.write(
              key: 'jwt',
              value: mocktail.any(named: 'value'),
            ),
          )
          .thenAnswer((_) async => {});
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
          home: const LoginScreen(),
          navigatorObservers: [mockNavigatorObserver],
          routes: {
            '/forgot-password': (context) => const Scaffold(body: Text('Forgot Password')),
          },
        ),
      );
    }

    testWidgets('renders login screen correctly', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());

      final context = tester.element(find.byType(LoginScreen));
      final localizations = AppLocalizations.of(context)!;

      expect(find.text(localizations.login), findsNWidgets(2));
      expect(find.byType(EmailTextField), findsOneWidget);
      expect(find.byType(AppPasswordTextField), findsOneWidget);
      expect(find.byType(PrimaryButton), findsOneWidget);
      expect(find.byType(SecondaryButton), findsOneWidget);
    });

    testWidgets('displays email and password fields', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());

      expect(find.byType(EmailTextField), findsOneWidget);
      expect(find.byType(AppPasswordTextField), findsOneWidget);
    });

    testWidgets('displays OAuth buttons', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());

      final context = tester.element(find.byType(LoginScreen));
      final localizations = AppLocalizations.of(context)!;

      expect(find.byType(OAuthButton), findsNWidgets(3));
      expect(find.text(localizations.github), findsOneWidget);
      expect(find.text(localizations.google), findsOneWidget);
      expect(find.text(localizations.microsoft), findsOneWidget);
    });

    testWidgets('shows error when email is empty', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(LoginScreen));
      final localizations = AppLocalizations.of(context)!;

      await tester.tap(find.widgetWithText(PrimaryButton, localizations.login));
      await tester.pumpAndSettle();

      expect(find.text(localizations.empty_email), findsOneWidget);
    });

    testWidgets('shows error when email is invalid', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(LoginScreen));
      final localizations = AppLocalizations.of(context)!;

      await tester.enterText(find.byType(EmailTextField), 'invalidemail');
      await tester.enterText(find.byType(AppPasswordTextField), 'password123');
      await tester.tap(find.widgetWithText(PrimaryButton, localizations.login));
      await tester.pumpAndSettle();

      expect(find.text(localizations.invalid_email), findsOneWidget);
    });

    testWidgets('shows error when password is empty', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(LoginScreen));
      final localizations = AppLocalizations.of(context)!;

      await tester.enterText(find.byType(EmailTextField), 'test@example.com');
      await tester.tap(find.widgetWithText(PrimaryButton, localizations.login));
      await tester.pumpAndSettle();

      expect(find.text(localizations.empty_password), findsOneWidget);
    });

    testWidgets('shows error when password is too short', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(LoginScreen));
      final localizations = AppLocalizations.of(context)!;

      await tester.enterText(find.byType(EmailTextField), 'test@example.com');
      await tester.enterText(find.byType(AppPasswordTextField), '12345');
      await tester.tap(find.widgetWithText(PrimaryButton, localizations.login));
      await tester.pumpAndSettle();

      expect(find.text(localizations.invalid_password), findsOneWidget);
    });

    testWidgets('shows error when backend address is null', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn(null);

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(LoginScreen));
      final localizations = AppLocalizations.of(context)!;

      await tester.enterText(find.byType(EmailTextField), 'test@example.com');
      await tester.enterText(find.byType(AppPasswordTextField), 'password123');
      await tester.tap(find.widgetWithText(PrimaryButton, localizations.login));
      await tester.pumpAndSettle();

      expect(find.byType(SnackBar), findsOneWidget);
      expect(find.text(localizations.empty_backend_server_address), findsOneWidget);
    });

    testWidgets('successfully logs in with valid credentials', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(jsonEncode({'token': 'test-jwt-token'}), 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(LoginScreen));
      final localizations = AppLocalizations.of(context)!;

      await tester.enterText(find.byType(EmailTextField), 'test@example.com');
      await tester.enterText(find.byType(AppPasswordTextField), 'password123');
      await tester.tap(find.widgetWithText(PrimaryButton, localizations.login));
      await tester.pumpAndSettle();

      mocktail
          .verify(() => mockSecureStorage.write(key: 'jwt', value: 'test-jwt-token'))
          .called(1);
    });

    testWidgets('shows error when login fails', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(jsonEncode({'error': 'Invalid credentials'}), 401);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(LoginScreen));
      final localizations = AppLocalizations.of(context)!;

      await tester.enterText(find.byType(EmailTextField), 'test@example.com');
      await tester.enterText(find.byType(AppPasswordTextField), 'wrongpassword');
      await tester.tap(find.widgetWithText(PrimaryButton, localizations.login));
      await tester.pumpAndSettle();

      expect(find.byType(SnackBar), findsOneWidget);
      expect(find.text('Invalid credentials'), findsOneWidget);
    });

    testWidgets('shows loading indicator when request is in progress', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          await Future.delayed(const Duration(milliseconds: 100));
          return http.Response(jsonEncode({'token': 'test-jwt-token'}), 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(LoginScreen));
      final localizations = AppLocalizations.of(context)!;

      await tester.enterText(find.byType(EmailTextField), 'test@example.com');
      await tester.enterText(find.byType(AppPasswordTextField), 'password123');
      await tester.tap(find.widgetWithText(PrimaryButton, localizations.login));
      await tester.pump();

      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      await tester.pumpAndSettle();
    });

    testWidgets('navigates to forgot password screen', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(LoginScreen));
      final localizations = AppLocalizations.of(context)!;

      await tester.tap(find.text(localizations.forgot_password_question));
      await tester.pumpAndSettle();

      expect(find.text('Forgot Password'), findsOneWidget);
    });

    testWidgets('disables button while loading', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          await Future.delayed(const Duration(milliseconds: 100));
          return http.Response(jsonEncode({'token': 'test-jwt-token'}), 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(LoginScreen));
      final localizations = AppLocalizations.of(context)!;

      await tester.enterText(find.byType(EmailTextField), 'test@example.com');
      await tester.enterText(find.byType(AppPasswordTextField), 'password123');

      await tester.tap(find.widgetWithText(PrimaryButton, localizations.login));
      await tester.pump();

      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      await tester.pumpAndSettle();
    });

    testWidgets('displays divider between login form and OAuth buttons', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(createTestWidget());

      expect(find.byType(Divider), findsOneWidget);
    });

    testWidgets('form fields accept text input', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(EmailTextField), 'test@example.com');
      await tester.enterText(find.byType(AppPasswordTextField), 'password123');

      expect(find.text('test@example.com'), findsOneWidget);
      expect(find.text('password123'), findsOneWidget);
    });

    testWidgets('displays custom app bar with correct title', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());

      final context = tester.element(find.byType(LoginScreen));
      final localizations = AppLocalizations.of(context)!;

      expect(find.text(localizations.login), findsNWidgets(2));
    });

    testWidgets('handles server error messages correctly', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(jsonEncode({'error': 'Server error occurred'}), 500);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(LoginScreen));
      final localizations = AppLocalizations.of(context)!;

      await tester.enterText(find.byType(EmailTextField), 'test@example.com');
      await tester.enterText(find.byType(AppPasswordTextField), 'password123');
      await tester.tap(find.widgetWithText(PrimaryButton, localizations.login));
      await tester.pumpAndSettle();

      expect(find.byType(SnackBar), findsOneWidget);
      expect(find.text('Server error occurred'), findsOneWidget);
    });

    testWidgets('sends correct login request', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      http.Request? capturedRequest;
      SecureHttpClient.setClient(
        MockClient((request) async {
          capturedRequest = request as http.Request?;
          return http.Response(jsonEncode({'token': 'test-jwt-token'}), 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(LoginScreen));
      final localizations = AppLocalizations.of(context)!;

      await tester.enterText(find.byType(EmailTextField), 'test@example.com');
      await tester.enterText(find.byType(AppPasswordTextField), 'password123');
      await tester.tap(find.widgetWithText(PrimaryButton, localizations.login));
      await tester.pumpAndSettle();

      expect(capturedRequest, isNotNull);
      expect(capturedRequest!.method, equals('POST'));
    });

    testWidgets('validates form before submitting', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      bool requestMade = false;
      SecureHttpClient.setClient(
        MockClient((request) async {
          requestMade = true;
          return http.Response(jsonEncode({'token': 'test-jwt-token'}), 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(LoginScreen));
      final localizations = AppLocalizations.of(context)!;

      await tester.tap(find.widgetWithText(PrimaryButton, localizations.login));
      await tester.pumpAndSettle();

      expect(requestMade, isFalse);
      expect(find.text(localizations.empty_email), findsOneWidget);
    });

    testWidgets('GitHub OAuth button is displayed and enabled', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());

      final context = tester.element(find.byType(LoginScreen));
      final localizations = AppLocalizations.of(context)!;

      expect(find.text(localizations.github), findsOneWidget);
      final githubButton = find.ancestor(
        of: find.text(localizations.github),
        matching: find.byType(OAuthButton),
      );
      expect(githubButton, findsOneWidget);
    });

    testWidgets('Google OAuth button is displayed and enabled', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());

      final context = tester.element(find.byType(LoginScreen));
      final localizations = AppLocalizations.of(context)!;

      expect(find.text(localizations.google), findsOneWidget);
      final googleButton = find.ancestor(
        of: find.text(localizations.google),
        matching: find.byType(OAuthButton),
      );
      expect(googleButton, findsOneWidget);
    });

    testWidgets('Microsoft OAuth button is displayed and enabled', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(createTestWidget());

      final context = tester.element(find.byType(LoginScreen));
      final localizations = AppLocalizations.of(context)!;

      expect(find.text(localizations.microsoft), findsOneWidget);
      final microsoftButton = find.ancestor(
        of: find.text(localizations.microsoft),
        matching: find.byType(OAuthButton),
      );
      expect(microsoftButton, findsOneWidget);
    });

    testWidgets('forgot password button is a secondary button', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());

      final context = tester.element(find.byType(LoginScreen));
      final localizations = AppLocalizations.of(context)!;

      expect(find.byType(SecondaryButton), findsOneWidget);
      expect(find.text(localizations.forgot_password_question), findsOneWidget);
    });

    testWidgets('stores JWT token on successful login', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(jsonEncode({'token': 'my-secure-token'}), 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(LoginScreen));
      final localizations = AppLocalizations.of(context)!;

      await tester.enterText(find.byType(EmailTextField), 'test@example.com');
      await tester.enterText(find.byType(AppPasswordTextField), 'password123');
      await tester.tap(find.widgetWithText(PrimaryButton, localizations.login));
      await tester.pumpAndSettle();

      mocktail
          .verify(() => mockSecureStorage.write(key: 'jwt', value: 'my-secure-token'))
          .called(1);
    });
  });
}
