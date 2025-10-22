import 'package:area/core/constants/app_colors.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/models/action_models.dart';
import 'package:area/widgets/dynamic_text_field.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  late List<PayloadField> testPayloadFields;

  setUp(() {
    testPayloadFields = [
      PayloadField(
        path: 'user.name',
        description: 'The name of the user',
        example: 'John Doe',
        type: 'string',
      ),
      PayloadField(
        path: 'user.email',
        description: 'The email address of the user',
        example: 'john@example.com',
        type: 'string',
      ),
      PayloadField(
        path: 'repository.name',
        description: 'The name of the repository',
        example: 'my-repo',
        type: 'string',
      ),
    ];
  });

  Widget buildTestWidget(Widget child) {
    return MaterialApp(
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [Locale('en', ''), Locale('fr', '')],
      home: Scaffold(
        body: SingleChildScrollView(
          child: SizedBox(
            height: 800,
            child: child,
          ),
        ),
      ),
    );
  }

  group('DynamicTextField', () {
    testWidgets('renders text field with basic properties', (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestWidget(
          DynamicTextField(
            label: 'Test Field',
            placeholder: 'Enter text here',
            onChanged: (_) {},
          ),
        ),
      );

      final richTexts = tester.widgetList<RichText>(find.byType(RichText));
      final labelRichText = richTexts.first;
      final textSpan = labelRichText.text as TextSpan;
      expect(textSpan.toPlainText(), 'Test Field');
      expect(find.text('Enter text here'), findsOneWidget);
      expect(find.byType(TextFormField), findsOneWidget);
    });

    testWidgets('shows required asterisk when required is true', (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestWidget(
          DynamicTextField(label: 'Required Field', required: true, onChanged: (_) {}),
        ),
      );

      final richText = tester.widget<RichText>(find.byType(RichText));
      final textSpan = richText.text as TextSpan;
      expect(textSpan.toPlainText(), 'Required Field *');
    });

    testWidgets('does not show required asterisk when required is false', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        buildTestWidget(
          DynamicTextField(label: 'Optional Field', required: false, onChanged: (_) {}),
        ),
      );

      final richText = tester.widget<RichText>(find.byType(RichText));
      final textSpan = richText.text as TextSpan;
      expect(textSpan.toPlainText(), 'Optional Field');
    });

    testWidgets('shows suggestion hint when payload fields are provided', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        buildTestWidget(
          DynamicTextField(
            label: 'Field with suggestions',
            payloadFields: testPayloadFields,
            onChanged: (_) {},
          ),
        ),
      );

      expect(find.byIcon(Icons.lightbulb_outline), findsOneWidget);
      expect(find.textContaining('Type { to see action data suggestions'), findsOneWidget);
    });

    testWidgets('does not show suggestion hint when no payload fields', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        buildTestWidget(
          DynamicTextField(
            label: 'Field without suggestions',
            payloadFields: [],
            onChanged: (_) {},
          ),
        ),
      );

      expect(find.byIcon(Icons.lightbulb_outline), findsNothing);
    });

    testWidgets('initializes with initial value', (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestWidget(DynamicTextField(initialValue: 'Initial text', onChanged: (_) {})),
      );

      final textField = tester.widget<TextFormField>(find.byType(TextFormField));
      expect(textField.controller!.text, 'Initial text');
    });

    testWidgets('calls onChanged when text changes', (WidgetTester tester) async {
      String? changedValue;

      await tester.pumpWidget(
        buildTestWidget(DynamicTextField(onChanged: (value) => changedValue = value)),
      );

      await tester.enterText(find.byType(TextFormField), 'New text');
      expect(changedValue, 'New text');
    });

    testWidgets('applies correct styling to text field', (WidgetTester tester) async {
      await tester.pumpWidget(buildTestWidget(DynamicTextField(onChanged: (_) {})));

      final textField = tester.widget<TextFormField>(find.byType(TextFormField));
      final textFieldWidget = tester.widget<TextField>(
        find.descendant(of: find.byType(TextFormField), matching: find.byType(TextField)),
      );
      expect(textFieldWidget.style!.fontFamily, 'monospace');
      expect(textFieldWidget.style!.fontSize, 14);

      expect(textFieldWidget.decoration!.border, isA<OutlineInputBorder>());
      expect(textFieldWidget.decoration!.filled, true);
    });

    testWidgets('supports multiline input', (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestWidget(DynamicTextField(maxLines: 3, onChanged: (_) {})),
      );

      final textFieldWidget = tester.widget<TextField>(
        find.descendant(of: find.byType(TextFormField), matching: find.byType(TextField)),
      );
      expect(textFieldWidget.maxLines, 3);
    });

    testWidgets('shows suggestions overlay when typing {', (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestWidget(DynamicTextField(payloadFields: testPayloadFields, onChanged: (_) {})),
      );

      final textField = find.byType(TextFormField);
      await tester.tap(textField);
      await tester.enterText(textField, '{');
      await tester.pumpAndSettle();

      final textFieldWidget = tester.widget<TextFormField>(textField);
      expect(textFieldWidget.controller!.text, '{');
    });

    testWidgets('hides suggestions overlay when focus is lost', (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestWidget(DynamicTextField(payloadFields: testPayloadFields, onChanged: (_) {})),
      );

      final textField = find.byType(TextFormField);
      await tester.tap(textField);
      await tester.enterText(textField, '{');
      await tester.pumpAndSettle();

      await tester.tapAt(const Offset(0, 0));
      await tester.pumpAndSettle();

      expect(find.byType(TextFormField), findsOneWidget);
    });

    testWidgets('inserts suggestion when tapped', (WidgetTester tester) async {
      String? finalText;

      await tester.pumpWidget(
        buildTestWidget(
          DynamicTextField(
            payloadFields: testPayloadFields,
            onChanged: (value) => finalText = value,
          ),
        ),
      );

      final textField = find.byType(TextFormField);
      await tester.tap(textField);
      await tester.enterText(textField, 'Hello {');
      await tester.pumpAndSettle();

      expect(finalText, 'Hello {');
    });

    testWidgets('suggestion items show correct information', (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestWidget(DynamicTextField(payloadFields: testPayloadFields, onChanged: (_) {})),
      );

      final textField = find.byType(TextFormField);
      await tester.tap(textField);
      await tester.enterText(textField, '{');
      await tester.pumpAndSettle();

      final textFieldWidget = tester.widget<TextFormField>(textField);
      expect(textFieldWidget.controller!.text, '{');
    });

    testWidgets('suggestion overlay has correct styling', (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestWidget(DynamicTextField(payloadFields: testPayloadFields, onChanged: (_) {})),
      );

      final textField = find.byType(TextFormField);
      await tester.tap(textField);
      await tester.enterText(textField, '{');
      await tester.pumpAndSettle();

      expect(find.byType(TextFormField), findsOneWidget);
    });

    testWidgets('suggestion hint has correct styling', (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestWidget(
          DynamicTextField(
            label: 'Test Field',
            payloadFields: testPayloadFields,
            onChanged: (_) {},
          ),
        ),
      );

      final textWidgets = tester.widgetList<Text>(find.byType(Text));
      final hintText = textWidgets.firstWhere(
        (text) => text.data?.contains('Type { to see action data suggestions') ?? false,
      );
      expect(hintText.style!.color, AppColors.areaBlue3);
      expect(hintText.style!.fontSize, 12);
      expect(hintText.style!.fontWeight, FontWeight.w500);
    });

    testWidgets('label has correct styling', (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestWidget(DynamicTextField(label: 'Test Label', onChanged: (_) {})),
      );

      final richText = tester.widget<RichText>(find.byType(RichText));
      final textSpan = richText.text as TextSpan;
      expect(textSpan.style!.color, Colors.black87);
      expect(textSpan.style!.fontSize, 16);
      expect(textSpan.style!.fontWeight, FontWeight.w500);
    });

    testWidgets('required asterisk has red color', (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestWidget(
          DynamicTextField(label: 'Required Label', required: true, onChanged: (_) {}),
        ),
      );

      final richText = tester.widget<RichText>(find.byType(RichText));
      final textSpan = richText.text as TextSpan;
      expect(textSpan.children![1].style!.color, Colors.red);
    });

    testWidgets('uses provided controller when given', (WidgetTester tester) async {
      final controller = TextEditingController(text: 'Initial');

      await tester.pumpWidget(
        buildTestWidget(DynamicTextField(controller: controller, onChanged: (_) {})),
      );

      final textField = tester.widget<TextFormField>(find.byType(TextFormField));
      expect(textField.controller, controller);
    });

    testWidgets('applies validator when provided', (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestWidget(
          Form(
            child: DynamicTextField(
              validator: (value) => value!.isEmpty ? 'Field is required' : null,
              onChanged: (_) {},
            ),
          ),
        ),
      );

      final textField = tester.widget<TextFormField>(find.byType(TextFormField));
      expect(textField.validator, isNotNull);
    });

    testWidgets('suggestion overlay positions correctly below text field', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        buildTestWidget(DynamicTextField(payloadFields: testPayloadFields, onChanged: (_) {})),
      );

      final textField = find.byType(TextFormField);
      await tester.tap(textField);
      await tester.enterText(textField, '{');
      await tester.pumpAndSettle();

      expect(find.byType(TextFormField), findsOneWidget);
    });

    testWidgets('does not show suggestions when no payload fields', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        buildTestWidget(DynamicTextField(payloadFields: [], onChanged: (_) {})),
      );

      final textField = find.byType(TextFormField);
      await tester.tap(textField);
      await tester.enterText(textField, '{');
      await tester.pumpAndSettle();

      expect(find.byType(TextFormField), findsOneWidget);
    });

    testWidgets('handles text input with existing content correctly', (
      WidgetTester tester,
    ) async {
      String? finalText;

      await tester.pumpWidget(
        buildTestWidget(
          DynamicTextField(
            initialValue: 'Some text ',
            payloadFields: testPayloadFields,
            onChanged: (value) => finalText = value,
          ),
        ),
      );

      final textField = find.byType(TextFormField);
      await tester.tap(textField);

      await tester.enterText(textField, 'Some text {');
      await tester.pumpAndSettle();

      expect(finalText, 'Some text {');
    });
  });
}
