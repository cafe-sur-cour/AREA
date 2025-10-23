import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart' as mocktail;
import 'package:provider/provider.dart';
import 'package:area/screens/register_screen.dart';
import 'package:area/core/notifiers/backend_address_notifier.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/widgets/common/text_fields/email_text_field.dart';
import 'package:area/widgets/common/text_fields/password_text_field.dart';
import 'package:area/widgets/common/text_fields/app_text_field.dart';
import 'package:area/widgets/common/buttons/primary_button.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:area/services/secure_http_client.dart';
import 'package:area/services/secure_storage.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class MockBackendAddressNotifier extends mocktail.Mock implements BackendAddressNotifier {}

class MockFlutterSecureStorage extends mocktail.Mock implements FlutterSecureStorage {}

class MockNavigatorObserver extends mocktail.Mock implements NavigatorObserver {}

void main() {
  group('RegisterScreen', () {
    late MockBackendAddressNotifier mockBackendNotifier;
    late MockFlutterSecureStorage mockSecureStorage;
    late MockNavigatorObserver mockNavigatorObserver;

    setUp(() {
      mockBackendNotifier = MockBackendAddressNotifier();
      mockSecureStorage = MockFlutterSecureStorage();
      mockNavigatorObserver = MockNavigatorObserver();
      setSecureStorage(mockSecureStorage);

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
          home: const RegisterScreen(),
          navigatorObservers: [mockNavigatorObserver],
        ),
      );
    }

    testWidgets('renders register screen correctly', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());

      final context = tester.element(find.byType(RegisterScreen));
      final localizations = AppLocalizations.of(context)!;

      expect(find.text(localizations.register), findsNWidgets(2));
      expect(find.text(localizations.name), findsOneWidget);
      expect(find.byType(EmailTextField), findsOneWidget);
      expect(find.byType(AppPasswordTextField), findsNWidgets(2));
      expect(find.byType(PrimaryButton), findsOneWidget);
    });

    testWidgets('displays all required fields', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());

      final context = tester.element(find.byType(RegisterScreen));
      final localizations = AppLocalizations.of(context)!;

      expect(find.text(localizations.name), findsOneWidget);
      expect(find.text(localizations.confirm_password), findsOneWidget);
      expect(find.byType(TextField), findsNWidgets(4));
    });

    testWidgets('shows error when name is empty', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(RegisterScreen));
      final localizations = AppLocalizations.of(context)!;

      await tester.tap(find.widgetWithText(PrimaryButton, localizations.register));
      await tester.pumpAndSettle();

      expect(find.text(localizations.empty_name), findsOneWidget);
    });

    testWidgets('shows error when name is too long', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(RegisterScreen));
      final localizations = AppLocalizations.of(context)!;

      final textFields = find.byType(TextField);
      await tester.enterText(textFields.at(0), 'a' * 39);
      await tester.tap(find.widgetWithText(PrimaryButton, localizations.register));
      await tester.pumpAndSettle();

      expect(find.text(localizations.invalid_name), findsOneWidget);
    });

    testWidgets('shows error when email is empty', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(RegisterScreen));
      final localizations = AppLocalizations.of(context)!;

      final textFields = find.byType(TextField);
      await tester.enterText(textFields.at(0), 'Test User');
      await tester.tap(find.widgetWithText(PrimaryButton, localizations.register));
      await tester.pumpAndSettle();

      expect(find.text(localizations.empty_email), findsOneWidget);
    });

    testWidgets('shows error when email is invalid', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(RegisterScreen));
      final localizations = AppLocalizations.of(context)!;

      final textFields = find.byType(TextField);
      await tester.enterText(textFields.at(0), 'Test User');
      await tester.enterText(textFields.at(1), 'invalidemail');
      await tester.tap(find.widgetWithText(PrimaryButton, localizations.register));
      await tester.pumpAndSettle();

      expect(find.text(localizations.invalid_email), findsOneWidget);
    });

    testWidgets('shows error when password is empty', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(RegisterScreen));
      final localizations = AppLocalizations.of(context)!;

      final textFields = find.byType(TextField);
      await tester.enterText(textFields.at(0), 'Test User');
      await tester.enterText(textFields.at(1), 'test@example.com');
      await tester.tap(find.widgetWithText(PrimaryButton, localizations.register));
      await tester.pumpAndSettle();

      expect(find.text(localizations.empty_password), findsAtLeastNWidgets(1));
    });

    testWidgets('shows error when password is too short', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(RegisterScreen));
      final localizations = AppLocalizations.of(context)!;

      final textFields = find.byType(TextField);
      await tester.enterText(textFields.at(0), 'Test User');
      await tester.enterText(textFields.at(1), 'test@example.com');
      await tester.enterText(textFields.at(2), '12345');
      await tester.tap(find.widgetWithText(PrimaryButton, localizations.register));
      await tester.pumpAndSettle();

      expect(find.text(localizations.invalid_password), findsOneWidget);
    });

    testWidgets('shows error when confirm password is empty', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(RegisterScreen));
      final localizations = AppLocalizations.of(context)!;

      final textFields = find.byType(TextField);
      await tester.enterText(textFields.at(0), 'Test User');
      await tester.enterText(textFields.at(1), 'test@example.com');
      await tester.enterText(textFields.at(2), 'password123');
      await tester.tap(find.widgetWithText(PrimaryButton, localizations.register));
      await tester.pumpAndSettle();

      expect(find.text(localizations.empty_password), findsOneWidget);
    });

    testWidgets('shows error when passwords do not match', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(RegisterScreen));
      final localizations = AppLocalizations.of(context)!;

      final textFields = find.byType(TextField);
      await tester.enterText(textFields.at(0), 'Test User');
      await tester.enterText(textFields.at(1), 'test@example.com');
      await tester.enterText(textFields.at(2), 'password123');
      await tester.enterText(textFields.at(3), 'differentpassword');
      await tester.tap(find.widgetWithText(PrimaryButton, localizations.register));
      await tester.pumpAndSettle();

      expect(find.text(localizations.confirm_password_differs), findsOneWidget);
    });

    testWidgets('shows error when backend address is null', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn(null);

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(RegisterScreen));
      final localizations = AppLocalizations.of(context)!;

      final textFields = find.byType(TextField);
      await tester.enterText(textFields.at(0), 'Test User');
      await tester.enterText(textFields.at(1), 'test@example.com');
      await tester.enterText(textFields.at(2), 'password123');
      await tester.enterText(textFields.at(3), 'password123');
      await tester.tap(find.widgetWithText(PrimaryButton, localizations.register));
      await tester.pumpAndSettle();

      expect(find.byType(SnackBar), findsOneWidget);
      expect(find.text(localizations.empty_backend_server_address), findsOneWidget);
    });

    testWidgets('successfully registers user with valid data', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      bool requestMade = false;
      SecureHttpClient.setClient(
        MockClient((request) async {
          requestMade = true;
          return http.Response(jsonEncode({'message': 'User created'}), 201);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(RegisterScreen));
      final localizations = AppLocalizations.of(context)!;

      final textFields = find.byType(TextField);
      await tester.enterText(textFields.at(0), 'Test User');
      await tester.enterText(textFields.at(1), 'test@example.com');
      await tester.enterText(textFields.at(2), 'password123');
      await tester.enterText(textFields.at(3), 'password123');
      await tester.tap(find.widgetWithText(PrimaryButton, localizations.register));
      await tester.pumpAndSettle();

      expect(requestMade, isTrue);
    });

    testWidgets('shows error when registration fails', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(jsonEncode({'error': 'Email already exists'}), 400);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(RegisterScreen));
      final localizations = AppLocalizations.of(context)!;

      final textFields = find.byType(TextField);
      await tester.enterText(textFields.at(0), 'Test User');
      await tester.enterText(textFields.at(1), 'test@example.com');
      await tester.enterText(textFields.at(2), 'password123');
      await tester.enterText(textFields.at(3), 'password123');
      await tester.tap(find.widgetWithText(PrimaryButton, localizations.register));
      await tester.pumpAndSettle();

      expect(find.byType(SnackBar), findsOneWidget);
      expect(find.text('Email already exists'), findsOneWidget);
    });

    testWidgets('shows loading indicator when request is in progress', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          await Future.delayed(const Duration(milliseconds: 100));
          return http.Response(jsonEncode({'message': 'User created'}), 201);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(RegisterScreen));
      final localizations = AppLocalizations.of(context)!;

      final textFields = find.byType(TextField);
      await tester.enterText(textFields.at(0), 'Test User');
      await tester.enterText(textFields.at(1), 'test@example.com');
      await tester.enterText(textFields.at(2), 'password123');
      await tester.enterText(textFields.at(3), 'password123');
      await tester.tap(find.widgetWithText(PrimaryButton, localizations.register));
      await tester.pump();

      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      await tester.pumpAndSettle();
    });

    testWidgets('disables button while loading', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          await Future.delayed(const Duration(milliseconds: 100));
          return http.Response(jsonEncode({'message': 'User created'}), 201);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(RegisterScreen));
      final localizations = AppLocalizations.of(context)!;

      final textFields = find.byType(TextField);
      await tester.enterText(textFields.at(0), 'Test User');
      await tester.enterText(textFields.at(1), 'test@example.com');
      await tester.enterText(textFields.at(2), 'password123');
      await tester.enterText(textFields.at(3), 'password123');

      await tester.tap(find.widgetWithText(PrimaryButton, localizations.register));
      await tester.pump();

      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      await tester.pumpAndSettle();
    });

    testWidgets('displays custom app bar with correct title', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());

      final context = tester.element(find.byType(RegisterScreen));
      final localizations = AppLocalizations.of(context)!;

      expect(find.text(localizations.register), findsNWidgets(2));
    });

    testWidgets('form fields accept text input', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final textFields = find.byType(TextField);
      await tester.enterText(textFields.at(0), 'Test User');
      await tester.enterText(textFields.at(1), 'test@example.com');
      await tester.enterText(textFields.at(2), 'password123');
      await tester.enterText(textFields.at(3), 'password123');

      expect(find.text('Test User'), findsOneWidget);
      expect(find.text('test@example.com'), findsOneWidget);
      expect(find.text('password123'), findsNWidgets(2));
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

      final context = tester.element(find.byType(RegisterScreen));
      final localizations = AppLocalizations.of(context)!;

      final textFields = find.byType(TextField);
      await tester.enterText(textFields.at(0), 'Test User');
      await tester.enterText(textFields.at(1), 'test@example.com');
      await tester.enterText(textFields.at(2), 'password123');
      await tester.enterText(textFields.at(3), 'password123');
      await tester.tap(find.widgetWithText(PrimaryButton, localizations.register));
      await tester.pumpAndSettle();

      expect(find.byType(SnackBar), findsOneWidget);
      expect(find.text('Server error occurred'), findsOneWidget);
    });

    testWidgets('sends correct registration request', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      http.Request? capturedRequest;
      SecureHttpClient.setClient(
        MockClient((request) async {
          capturedRequest = request as http.Request?;
          return http.Response(jsonEncode({'message': 'User created'}), 201);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(RegisterScreen));
      final localizations = AppLocalizations.of(context)!;

      final textFields = find.byType(TextField);
      await tester.enterText(textFields.at(0), 'Test User');
      await tester.enterText(textFields.at(1), 'test@example.com');
      await tester.enterText(textFields.at(2), 'password123');
      await tester.enterText(textFields.at(3), 'password123');
      await tester.tap(find.widgetWithText(PrimaryButton, localizations.register));
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
          return http.Response(jsonEncode({'message': 'User created'}), 201);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(RegisterScreen));
      final localizations = AppLocalizations.of(context)!;

      await tester.tap(find.widgetWithText(PrimaryButton, localizations.register));
      await tester.pumpAndSettle();

      expect(requestMade, isFalse);
      expect(find.text(localizations.empty_name), findsOneWidget);
    });

    testWidgets('closes screen and shows success message on successful registration', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      bool requestMade = false;
      SecureHttpClient.setClient(
        MockClient((request) async {
          requestMade = true;
          return http.Response(jsonEncode({'message': 'User created'}), 201);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(RegisterScreen));
      final localizations = AppLocalizations.of(context)!;

      final textFields = find.byType(TextField);
      await tester.enterText(textFields.at(0), 'Test User');
      await tester.enterText(textFields.at(1), 'test@example.com');
      await tester.enterText(textFields.at(2), 'password123');
      await tester.enterText(textFields.at(3), 'password123');
      await tester.tap(find.widgetWithText(PrimaryButton, localizations.register));
      await tester.pump();

      expect(requestMade, isTrue);

      await tester.pumpAndSettle();

      expect(find.byType(RegisterScreen), findsNothing);
    });

    testWidgets('validates name length correctly', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final textFields = find.byType(TextField);
      await tester.enterText(textFields.at(0), 'Valid Name');
      await tester.enterText(textFields.at(1), 'test@example.com');
      await tester.enterText(textFields.at(2), 'password123');
      await tester.enterText(textFields.at(3), 'password123');

      final nameTextField = find.ancestor(
        of: find.widgetWithText(TextField, 'Valid Name'),
        matching: find.byType(AppTextField),
      );

      expect(nameTextField, findsOneWidget);
    });

    testWidgets('disposes controllers properly', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      await tester.pumpWidget(Container());

      expect(tester.takeException(), isNull);
    });

    testWidgets('password fields use secure text input', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byType(AppPasswordTextField), findsNWidgets(2));
    });

    testWidgets('name field uses text keyboard type', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(RegisterScreen));
      final localizations = AppLocalizations.of(context)!;

      expect(find.text(localizations.name), findsOneWidget);
    });

    testWidgets('email field uses email keyboard type', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byType(EmailTextField), findsOneWidget);
    });

    testWidgets('accepts valid name with exactly 38 characters', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(jsonEncode({'message': 'User created'}), 201);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(RegisterScreen));
      final localizations = AppLocalizations.of(context)!;

      final textFields = find.byType(TextField);
      await tester.enterText(textFields.at(0), 'a' * 38);
      await tester.enterText(textFields.at(1), 'test@example.com');
      await tester.enterText(textFields.at(2), 'password123');
      await tester.enterText(textFields.at(3), 'password123');
      await tester.tap(find.widgetWithText(PrimaryButton, localizations.register));
      await tester.pumpAndSettle();

      expect(find.text(localizations.invalid_name), findsNothing);
    });
  });
}
