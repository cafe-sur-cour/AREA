import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:area/widgets/common/state/loading_state.dart';
import 'package:area/core/constants/app_colors.dart';

void main() {
  group('LoadingState', () {
    testWidgets('renders CircularProgressIndicator', (WidgetTester tester) async {
      await tester.pumpWidget(MaterialApp(home: Scaffold(body: LoadingState())));

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('renders with message when provided', (WidgetTester tester) async {
      const testMessage = 'Loading data...';

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: LoadingState(message: testMessage)),
        ),
      );

      expect(find.text(testMessage), findsOneWidget);
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('does not render message when not provided', (WidgetTester tester) async {
      await tester.pumpWidget(MaterialApp(home: Scaffold(body: LoadingState())));

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      expect(find.byType(Text), findsNothing);
    });

    testWidgets('centers content', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: LoadingState(message: 'Loading...')),
        ),
      );

      final center = tester.widget<Center>(find.byType(Center));
      expect(center, isNotNull);
    });

    testWidgets('applies correct text styling', (WidgetTester tester) async {
      const testMessage = 'Loading data...';

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: LoadingState(message: testMessage)),
        ),
      );

      final textWidget = tester.widget<Text>(find.text(testMessage));
      expect(textWidget.style!.fontSize, 16);
      expect(textWidget.style!.color, AppColors.areaDarkGray);
    });

    testWidgets('has proper layout with message', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: LoadingState(message: 'Loading...')),
        ),
      );

      final column = tester.widget<Column>(find.byType(Column));
      expect(column.mainAxisAlignment, MainAxisAlignment.center);
      expect(column.children.length, 3);
    });
  });
}
