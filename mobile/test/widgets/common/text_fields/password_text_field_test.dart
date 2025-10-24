import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:area/widgets/common/text_fields/password_text_field.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:area/l10n/app_localizations.dart';

void main() {
  group('AppPasswordTextField', () {
    late TextEditingController controller;

    setUp(() {
      controller = TextEditingController();
    });

    tearDown(() {
      controller.dispose();
    });

    testWidgets('renders with password label', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: const [Locale('en', ''), Locale('fr', '')],
          home: Scaffold(body: AppPasswordTextField(controller: controller)),
        ),
      );

      expect(find.byType(TextFormField), findsOneWidget);
    });

    testWidgets('starts with obscured text', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: const [Locale('en', ''), Locale('fr', '')],
          home: Scaffold(body: AppPasswordTextField(controller: controller)),
        ),
      );

      final textField = tester.widget<TextField>(
        find.descendant(of: find.byType(TextFormField), matching: find.byType(TextField)),
      );
      expect(textField.obscureText, true);
    });

    testWidgets('has visibility toggle icon', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: const [Locale('en', ''), Locale('fr', '')],
          home: Scaffold(body: AppPasswordTextField(controller: controller)),
        ),
      );

      expect(find.byIcon(Icons.visibility), findsOneWidget);
    });

    testWidgets('toggles visibility when icon is tapped', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: const [Locale('en', ''), Locale('fr', '')],
          home: Scaffold(body: AppPasswordTextField(controller: controller)),
        ),
      );

      expect(find.byIcon(Icons.visibility), findsOneWidget);

      await tester.tap(find.byIcon(Icons.visibility));
      await tester.pump();

      expect(find.byIcon(Icons.visibility_off), findsOneWidget);
      expect(find.byIcon(Icons.visibility), findsNothing);

      final textField = tester.widget<TextField>(
        find.descendant(of: find.byType(TextFormField), matching: find.byType(TextField)),
      );
      expect(textField.obscureText, false);
    });

    testWidgets('validates empty password', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: const [Locale('en', ''), Locale('fr', '')],
          home: Scaffold(body: AppPasswordTextField(controller: controller)),
        ),
      );

      final textField = tester.widget<TextFormField>(find.byType(TextFormField));
      final validator = textField.validator!;
      expect(validator(''), isNotNull);
      expect(validator(null), isNotNull);
    });

    testWidgets('validates short password', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: const [Locale('en', ''), Locale('fr', '')],
          home: Scaffold(body: AppPasswordTextField(controller: controller)),
        ),
      );

      final textField = tester.widget<TextFormField>(find.byType(TextFormField));
      final validator = textField.validator!;
      expect(validator('12345'), isNotNull);
      expect(validator('abc'), isNotNull);
    });

    testWidgets('accepts valid password', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: const [Locale('en', ''), Locale('fr', '')],
          home: Scaffold(body: AppPasswordTextField(controller: controller)),
        ),
      );

      final textField = tester.widget<TextFormField>(find.byType(TextFormField));
      final validator = textField.validator!;
      expect(validator('password123'), isNull);
      expect(validator('123456'), isNull);
    });

    testWidgets('uses custom validator when provided', (WidgetTester tester) async {
      String? customValidator(String? value) {
        return value == 'valid' ? null : 'Custom error';
      }

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
            body: AppPasswordTextField(
              controller: controller,
              customValidator: customValidator,
            ),
          ),
        ),
      );

      final textField = tester.widget<TextFormField>(find.byType(TextFormField));
      expect(textField.validator, customValidator);
    });

    testWidgets('uses custom label when provided', (WidgetTester tester) async {
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
            body: AppPasswordTextField(controller: controller, labelText: 'Custom Password'),
          ),
        ),
      );

      expect(find.text('Custom Password'), findsOneWidget);
    });

    testWidgets('has outline border', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: const [Locale('en', ''), Locale('fr', '')],
          home: Scaffold(body: AppPasswordTextField(controller: controller)),
        ),
      );

      final textField = tester.widget<TextField>(
        find.descendant(of: find.byType(TextFormField), matching: find.byType(TextField)),
      );
      final decoration = textField.decoration!;
      expect(decoration.border, isA<OutlineInputBorder>());
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
            body: AppPasswordTextField(controller: controller, onTapOutside: () {}),
          ),
        ),
      );

      final textField = tester.widget<TextField>(
        find.descendant(of: find.byType(TextFormField), matching: find.byType(TextField)),
      );
      expect(textField.onTapOutside, isNotNull);
    });
  });
}
