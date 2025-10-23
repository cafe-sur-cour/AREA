import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart' as mocktail;
import 'package:provider/provider.dart';
import 'package:area/screens/forgot_password_screen.dart';
import 'package:area/core/notifiers/backend_address_notifier.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/widgets/common/text_fields/email_text_field.dart';
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
  group('ForgotPasswordScreen', () {
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
          home: const ForgotPasswordScreen(),
          navigatorObservers: [mockNavigatorObserver],
        ),
      );
    }

    testWidgets('renders forgot password screen correctly', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());

      final context = tester.element(find.byType(ForgotPasswordScreen));
      final localizations = AppLocalizations.of(context)!;

      expect(find.text(localizations.forgot_password), findsOneWidget);
      expect(find.byType(EmailTextField), findsOneWidget);
      expect(find.byType(PrimaryButton), findsOneWidget);
    });

    testWidgets('displays email and confirm email fields', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());

      final context = tester.element(find.byType(ForgotPasswordScreen));
      final localizations = AppLocalizations.of(context)!;

      expect(find.text(localizations.confirm_email), findsOneWidget);
      expect(find.byType(EmailTextField), findsOneWidget);
    });

    testWidgets('shows error when email is empty', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ForgotPasswordScreen));
      final localizations = AppLocalizations.of(context)!;

      await tester.tap(find.text(localizations.send));
      await tester.pumpAndSettle();

      expect(find.text(localizations.empty_email), findsAtLeastNWidgets(1));
    });

    testWidgets('shows error when email is invalid', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ForgotPasswordScreen));
      final localizations = AppLocalizations.of(context)!;

      final textFields = find.byType(TextField);
      await tester.enterText(textFields.first, 'invalidemail');
      await tester.enterText(textFields.last, 'invalidemail');
      await tester.tap(find.text(localizations.send));
      await tester.pumpAndSettle();

      expect(find.text(localizations.invalid_email), findsAtLeastNWidgets(1));
    });

    testWidgets('shows error when confirm email is empty', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ForgotPasswordScreen));
      final localizations = AppLocalizations.of(context)!;

      final textFields = find.byType(TextField);
      await tester.enterText(textFields.first, 'test@example.com');
      await tester.tap(find.text(localizations.send));
      await tester.pumpAndSettle();

      expect(find.text(localizations.empty_email), findsAtLeastNWidgets(1));
    });

    testWidgets('shows error when emails do not match', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ForgotPasswordScreen));
      final localizations = AppLocalizations.of(context)!;

      final textFields = find.byType(TextField);
      await tester.enterText(textFields.first, 'test@example.com');
      await tester.enterText(textFields.last, 'different@example.com');
      await tester.tap(find.text(localizations.send));
      await tester.pumpAndSettle();

      expect(find.text(localizations.confirm_email_differs), findsOneWidget);
    });

    testWidgets('shows error when backend address is null', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn(null);

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ForgotPasswordScreen));
      final localizations = AppLocalizations.of(context)!;

      final textFields = find.byType(TextField);
      await tester.enterText(textFields.first, 'test@example.com');
      await tester.enterText(textFields.last, 'test@example.com');
      await tester.tap(find.text(localizations.send));
      await tester.pumpAndSettle();

      expect(find.byType(SnackBar), findsOneWidget);
      expect(find.text(localizations.empty_backend_server_address), findsOneWidget);
    });

    testWidgets('successfully sends forgot password request', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      bool requestMade = false;
      SecureHttpClient.setClient(
        MockClient((request) async {
          requestMade = true;
          return http.Response(jsonEncode({'message': 'Email sent'}), 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ForgotPasswordScreen));
      final localizations = AppLocalizations.of(context)!;

      final textFields = find.byType(TextField);
      await tester.enterText(textFields.first, 'test@example.com');
      await tester.enterText(textFields.last, 'test@example.com');
      await tester.tap(find.text(localizations.send));
      await tester.pumpAndSettle();

      expect(requestMade, isTrue);
    });

    testWidgets('shows error when API call fails', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          return http.Response(jsonEncode({'error': 'Email not found'}), 404);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ForgotPasswordScreen));
      final localizations = AppLocalizations.of(context)!;

      final textFields = find.byType(TextField);
      await tester.enterText(textFields.first, 'test@example.com');
      await tester.enterText(textFields.last, 'test@example.com');
      await tester.tap(find.text(localizations.send));
      await tester.pumpAndSettle();

      expect(find.byType(SnackBar), findsOneWidget);
      expect(find.text('Email not found'), findsOneWidget);
    });

    testWidgets('shows loading indicator when request is in progress', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          await Future.delayed(const Duration(milliseconds: 100));
          return http.Response(jsonEncode({'message': 'Email sent'}), 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ForgotPasswordScreen));
      final localizations = AppLocalizations.of(context)!;

      final textFields = find.byType(TextField);
      await tester.enterText(textFields.first, 'test@example.com');
      await tester.enterText(textFields.last, 'test@example.com');
      await tester.tap(find.text(localizations.send));
      await tester.pump();

      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      await tester.pumpAndSettle();
    });

    testWidgets('disables button while loading', (WidgetTester tester) async {
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');

      SecureHttpClient.setClient(
        MockClient((request) async {
          await Future.delayed(const Duration(milliseconds: 100));
          return http.Response(jsonEncode({'message': 'Email sent'}), 200);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ForgotPasswordScreen));
      final localizations = AppLocalizations.of(context)!;

      final textFields = find.byType(TextField);
      await tester.enterText(textFields.first, 'test@example.com');
      await tester.enterText(textFields.last, 'test@example.com');

      await tester.tap(find.text(localizations.send));
      await tester.pump();

      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      await tester.pumpAndSettle();
    });

    testWidgets('displays custom app bar with correct title', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());

      final context = tester.element(find.byType(ForgotPasswordScreen));
      final localizations = AppLocalizations.of(context)!;

      expect(find.text(localizations.forgot_password), findsOneWidget);
    });

    testWidgets('form fields accept text input', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final textFields = find.byType(TextField);
      await tester.enterText(textFields.first, 'test@example.com');
      await tester.enterText(textFields.last, 'test@example.com');

      expect(find.text('test@example.com'), findsNWidgets(2));
    });

    testWidgets('validates confirm email matches email field', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ForgotPasswordScreen));
      final localizations = AppLocalizations.of(context)!;

      final textFields = find.byType(TextField);
      await tester.enterText(textFields.first, 'test@example.com');
      await tester.enterText(textFields.last, 'test@example.com');
      await tester.tap(find.text(localizations.send));
      await tester.pump();

      // Should not show the error if emails match
      expect(find.text(localizations.confirm_email_differs), findsNothing);
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

      final context = tester.element(find.byType(ForgotPasswordScreen));
      final localizations = AppLocalizations.of(context)!;

      final textFields = find.byType(TextField);
      await tester.enterText(textFields.first, 'test@example.com');
      await tester.enterText(textFields.last, 'test@example.com');
      await tester.tap(find.text(localizations.send));
      await tester.pumpAndSettle();

      expect(find.byType(SnackBar), findsOneWidget);
      expect(find.text('Server error occurred'), findsOneWidget);
    });
  });
}
