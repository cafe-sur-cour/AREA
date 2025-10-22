import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:area/widgets/common/state/empty_state.dart';
import 'package:area/core/constants/app_colors.dart';

void main() {
  group('EmptyState', () {
    testWidgets('renders with title, message and icon', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: EmptyState(
              title: 'No Data',
              message: 'There is no data to display',
              icon: Icons.inbox,
            ),
          ),
        ),
      );

      expect(find.text('No Data'), findsOneWidget);
      expect(find.text('There is no data to display'), findsOneWidget);
      expect(find.byIcon(Icons.inbox), findsOneWidget);
    });

    testWidgets('centers content', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: EmptyState(
              title: 'No Data',
              message: 'There is no data to display',
              icon: Icons.inbox,
            ),
          ),
        ),
      );

      expect(find.byType(Center), isNot(findsNothing));
    });

    testWidgets('applies default icon color when not provided', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: EmptyState(
              title: 'No Data',
              message: 'There is no data to display',
              icon: Icons.inbox,
            ),
          ),
        ),
      );

      final icon = tester.widget<Icon>(find.byIcon(Icons.inbox));
      expect(icon.color, AppColors.areaDarkGray);
      expect(icon.size, 64);
    });

    testWidgets('applies custom icon color when provided', (WidgetTester tester) async {
      const customColor = Colors.blue;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: EmptyState(
              title: 'No Data',
              message: 'There is no data to display',
              icon: Icons.inbox,
              iconColor: customColor,
            ),
          ),
        ),
      );

      final icon = tester.widget<Icon>(find.byIcon(Icons.inbox));
      expect(icon.color, customColor);
      expect(icon.size, 64);
    });

    testWidgets('applies correct title styling', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: EmptyState(
              title: 'No Data',
              message: 'There is no data to display',
              icon: Icons.inbox,
            ),
          ),
        ),
      );

      final titleText = tester.widget<Text>(find.text('No Data'));
      expect(titleText.textAlign, TextAlign.center);
    });

    testWidgets('applies correct message styling', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: EmptyState(
              title: 'No Data',
              message: 'There is no data to display',
              icon: Icons.inbox,
            ),
          ),
        ),
      );

      final messageText = tester.widget<Text>(find.text('There is no data to display'));
      expect(messageText.textAlign, TextAlign.center);
    });

    testWidgets('has correct layout with Column', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: EmptyState(
              title: 'No Data',
              message: 'There is no data to display',
              icon: Icons.inbox,
            ),
          ),
        ),
      );

      final column = tester.widget<Column>(find.byType(Column));
      expect(column.mainAxisAlignment, MainAxisAlignment.center);
      expect(column.children.length, 5);
    });

    testWidgets('message has horizontal padding', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: EmptyState(
              title: 'No Data',
              message: 'There is no data to display',
              icon: Icons.inbox,
            ),
          ),
        ),
      );

      final padding = tester.widget<Padding>(find.byType(Padding));
      expect(padding.padding, const EdgeInsets.symmetric(horizontal: 32));
    });
  });
}
