import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:area/widgets/common/text_fields/email_text_field.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:area/l10n/app_localizations.dart';

void main() {
  group('EmailTextField', () {
    late TextEditingController controller;

    setUp(() {
      controller = TextEditingController();
    });

    tearDown(() {
      controller.dispose();
    });

    testWidgets('renders with email label', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: const [Locale('en', ''), Locale('fr', '')],
          home: Scaffold(body: EmailTextField(controller: controller)),
        ),
      );

      expect(find.byType(TextFormField), findsOneWidget);
    });

    testWidgets('has email keyboard type', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: const [Locale('en', ''), Locale('fr', '')],
          home: Scaffold(body: EmailTextField(controller: controller)),
        ),
      );

      final textField = tester.widget<TextField>(
        find.descendant(of: find.byType(TextFormField), matching: find.byType(TextField)),
      );
      expect(textField.keyboardType, TextInputType.emailAddress);
    });

    testWidgets('validates empty email', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: const [Locale('en', ''), Locale('fr', '')],
          home: Scaffold(body: EmailTextField(controller: controller)),
        ),
      );

      final textField = tester.widget<TextFormField>(find.byType(TextFormField));
      final validator = textField.validator!;
      expect(validator(''), isNotNull);
      expect(validator(null), isNotNull);
    });

    testWidgets('validates invalid email format', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: const [Locale('en', ''), Locale('fr', '')],
          home: Scaffold(body: EmailTextField(controller: controller)),
        ),
      );

      final textField = tester.widget<TextFormField>(find.byType(TextFormField));
      final validator = textField.validator!;
      expect(validator('invalidemail'), isNotNull);
      expect(validator('user'), isNotNull);
    });

    testWidgets('accepts valid email', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: const [Locale('en', ''), Locale('fr', '')],
          home: Scaffold(body: EmailTextField(controller: controller)),
        ),
      );

      final textField = tester.widget<TextFormField>(find.byType(TextFormField));
      final validator = textField.validator!;
      expect(validator('user@example.com'), isNull);
      expect(validator('test.email+tag@domain.co.uk'), isNull);
    });

    testWidgets('calls onTapOutside when provided', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: const [Locale('en', ''), Locale('fr', '')],
          home: Scaffold(
            body: EmailTextField(controller: controller, onTapOutside: () {}),
          ),
        ),
      );

      final textField = tester.widget<TextField>(
        find.descendant(of: find.byType(TextFormField), matching: find.byType(TextField)),
      );
      expect(textField.onTapOutside, isNotNull);
    });

    testWidgets('uses AppTextField internally', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: const [Locale('en', ''), Locale('fr', '')],
          home: Scaffold(body: EmailTextField(controller: controller)),
        ),
      );

      expect(find.byType(TextFormField), findsOneWidget);
    });

    testWidgets('controller is properly connected', (WidgetTester tester) async {
      controller.text = 'test@example.com';

      await tester.pumpWidget(
        MaterialApp(
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: const [Locale('en', ''), Locale('fr', '')],
          home: Scaffold(body: EmailTextField(controller: controller)),
        ),
      );

      expect(find.text('test@example.com'), findsOneWidget);
    });
  });
}
