import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:area/widgets/common/cards/status_badge.dart';

void main() {
  group('StatusBadge', () {
    testWidgets('renders with text', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StatusBadge(text: 'Active', color: Colors.green),
          ),
        ),
      );

      expect(find.text('Active'), findsOneWidget);
    });

    testWidgets('renders with icon when provided', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StatusBadge(text: 'Active', color: Colors.green, icon: Icons.check),
          ),
        ),
      );

      expect(find.text('Active'), findsOneWidget);
      expect(find.byIcon(Icons.check), findsOneWidget);
    });

    testWidgets('does not render icon when not provided', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StatusBadge(text: 'Active', color: Colors.green),
          ),
        ),
      );

      expect(find.text('Active'), findsOneWidget);
      expect(find.byIcon(Icons.check), findsNothing);
    });

    testWidgets('applies correct background color with alpha', (WidgetTester tester) async {
      const badgeColor = Colors.green;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StatusBadge(text: 'Active', color: badgeColor),
          ),
        ),
      );

      final container = tester.widget<Container>(find.byType(Container));
      final decoration = container.decoration as BoxDecoration;
      expect(decoration.color, badgeColor.withValues(alpha: 0.2));
    });

    testWidgets('applies correct border color', (WidgetTester tester) async {
      const badgeColor = Colors.green;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StatusBadge(text: 'Active', color: badgeColor),
          ),
        ),
      );

      final container = tester.widget<Container>(find.byType(Container));
      final decoration = container.decoration as BoxDecoration;
      expect((decoration.border! as Border).top.color, badgeColor);
    });

    testWidgets('applies correct text styling', (WidgetTester tester) async {
      const badgeColor = Colors.green;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StatusBadge(text: 'Active', color: badgeColor),
          ),
        ),
      );

      final textWidget = tester.widget<Text>(find.text('Active'));
      expect(textWidget.style!.color, badgeColor);
      expect(textWidget.style!.fontSize, 12);
      expect(textWidget.style!.fontWeight, FontWeight.w600);
    });

    testWidgets('applies correct icon styling', (WidgetTester tester) async {
      const badgeColor = Colors.green;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StatusBadge(text: 'Active', color: badgeColor, icon: Icons.check),
          ),
        ),
      );

      final iconWidget = tester.widget<Icon>(find.byIcon(Icons.check));
      expect(iconWidget.color, badgeColor);
      expect(iconWidget.size, 16);
    });

    testWidgets('has correct border radius', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StatusBadge(text: 'Active', color: Colors.green),
          ),
        ),
      );

      final container = tester.widget<Container>(find.byType(Container));
      final decoration = container.decoration as BoxDecoration;
      expect(decoration.borderRadius, BorderRadius.circular(12));
    });

    testWidgets('has correct padding', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StatusBadge(text: 'Active', color: Colors.green),
          ),
        ),
      );

      final container = tester.widget<Container>(find.byType(Container));
      expect(container.padding, const EdgeInsets.symmetric(horizontal: 8, vertical: 4));
    });

    testWidgets('has correct row layout', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StatusBadge(text: 'Active', color: Colors.green, icon: Icons.check),
          ),
        ),
      );

      final row = tester.widget<Row>(find.byType(Row));
      expect(row.mainAxisSize, MainAxisSize.min);
      expect(row.children.length, 3);
    });
  });
}
