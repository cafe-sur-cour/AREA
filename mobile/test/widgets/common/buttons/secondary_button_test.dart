import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:area/widgets/common/buttons/secondary_button.dart';

void main() {
  group('SecondaryButton', () {
    testWidgets('renders with text', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SecondaryButton(text: 'Test Button', onPressed: () {}),
          ),
        ),
      );

      expect(find.text('Test Button'), findsOneWidget);
    });

    testWidgets('calls onPressed when tapped', (WidgetTester tester) async {
      bool pressed = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SecondaryButton(text: 'Test Button', onPressed: () => pressed = true),
          ),
        ),
      );

      await tester.tap(find.byType(ElevatedButton));
      expect(pressed, true);
    });

    testWidgets('renders with icon when provided', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SecondaryButton(text: 'Test Button', onPressed: () {}, icon: Icons.add),
          ),
        ),
      );

      expect(find.byIcon(Icons.add), findsOneWidget);
      expect(find.text('Test Button'), findsOneWidget);
    });

    testWidgets('applies custom color', (WidgetTester tester) async {
      const customColor = Colors.blue;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SecondaryButton(text: 'Test Button', onPressed: () {}, color: customColor),
          ),
        ),
      );

      final elevatedButton = tester.widget<ElevatedButton>(find.byType(ElevatedButton));
      final buttonStyle = elevatedButton.style!;
      expect(buttonStyle.foregroundColor!.resolve({}), customColor);
    });

    testWidgets('applies custom border radius', (WidgetTester tester) async {
      const borderRadius = 16.0;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SecondaryButton(
              text: 'Test Button',
              onPressed: () {},
              borderRadius: borderRadius,
            ),
          ),
        ),
      );

      final elevatedButton = tester.widget<ElevatedButton>(find.byType(ElevatedButton));
      final buttonStyle = elevatedButton.style!;
      final shape = buttonStyle.shape!.resolve({}) as RoundedRectangleBorder;
      expect(shape.borderRadius, BorderRadius.circular(borderRadius));
    });

    testWidgets('is disabled when onPressed is null', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: SecondaryButton(text: 'Test Button', onPressed: null)),
        ),
      );

      final elevatedButton = tester.widget<ElevatedButton>(find.byType(ElevatedButton));
      expect(elevatedButton.onPressed, null);
    });
  });
}
