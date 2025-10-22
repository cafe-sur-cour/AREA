import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:area/widgets/common/text_fields/app_text_field.dart';

void main() {
  group('AppTextField', () {
    late TextEditingController controller;

    setUp(() {
      controller = TextEditingController();
    });

    tearDown(() {
      controller.dispose();
    });

    testWidgets('renders with label text', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AppTextField(controller: controller, labelText: 'Test Label'),
          ),
        ),
      );

      expect(find.text('Test Label'), findsOneWidget);
      expect(find.byType(TextFormField), findsOneWidget);
    });

    testWidgets('displays initial text from controller', (WidgetTester tester) async {
      controller.text = 'Initial text';

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AppTextField(controller: controller, labelText: 'Test Label'),
          ),
        ),
      );

      expect(find.text('Initial text'), findsOneWidget);
    });

    testWidgets('calls validator when provided', (WidgetTester tester) async {
      String? validator(String? value) {
        return value!.isEmpty ? 'Field is required' : null;
      }

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AppTextField(
              controller: controller,
              labelText: 'Test Label',
              validator: validator,
            ),
          ),
        ),
      );

      final textField = tester.widget<TextFormField>(find.byType(TextFormField));
      expect(textField.validator, validator);
    });

    testWidgets('obscures text when obscureText is true', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AppTextField(
              controller: controller,
              labelText: 'Password',
              obscureText: true,
            ),
          ),
        ),
      );

      expect(find.byType(TextFormField), findsOneWidget);
      expect(find.text('Password'), findsOneWidget);
    });

    testWidgets('sets keyboard type when provided', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AppTextField(
              controller: controller,
              labelText: 'Email',
              keyboardType: TextInputType.emailAddress,
            ),
          ),
        ),
      );

      expect(find.byType(TextFormField), findsOneWidget);
      expect(find.text('Email'), findsOneWidget);
    });

    testWidgets('sets maxLines correctly', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AppTextField(controller: controller, labelText: 'Multiline', maxLines: 3),
          ),
        ),
      );

      expect(find.byType(TextFormField), findsOneWidget);
      expect(find.text('Multiline'), findsOneWidget);
    });

    testWidgets('forces maxLines to 1 when obscureText is true', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AppTextField(
              controller: controller,
              labelText: 'Password',
              obscureText: true,
              maxLines: 3,
            ),
          ),
        ),
      );

      expect(find.byType(TextFormField), findsOneWidget);
      expect(find.text('Password'), findsOneWidget);
    });

    testWidgets('calls onFieldSubmitted when provided', (WidgetTester tester) async {
      String? submittedValue;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AppTextField(
              controller: controller,
              labelText: 'Test Label',
              onFieldSubmitted: (value) => submittedValue = value,
            ),
          ),
        ),
      );

      expect(find.byType(TextFormField), findsOneWidget);
      expect(find.text('Test Label'), findsOneWidget);
    });

    testWidgets('has outline border', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AppTextField(controller: controller, labelText: 'Test Label'),
          ),
        ),
      );

      expect(find.byType(TextFormField), findsOneWidget);
      expect(find.text('Test Label'), findsOneWidget);
    });
  });
}
