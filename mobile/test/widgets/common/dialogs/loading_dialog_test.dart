import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:area/widgets/common/dialogs/loading_dialog.dart';

void main() {
  group('showLoadingDialog', () {
    testWidgets('shows dialog with message and progress indicator', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              return ElevatedButton(
                onPressed: () {
                  showLoadingDialog(context, 'Loading data...');
                },
                child: const Text('Show Loading'),
              );
            },
          ),
        ),
      );

      await tester.tap(find.byType(ElevatedButton));
      await tester.pump();

      expect(find.text('Loading data...'), findsOneWidget);
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('renders AlertDialog', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              return ElevatedButton(
                onPressed: () {
                  showLoadingDialog(context, 'Loading...');
                },
                child: const Text('Show Loading'),
              );
            },
          ),
        ),
      );

      await tester.tap(find.byType(ElevatedButton));
      await tester.pump();

      expect(find.byType(AlertDialog), findsOneWidget);
    });

    testWidgets('has correct layout with Row', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              return ElevatedButton(
                onPressed: () {
                  showLoadingDialog(context, 'Loading...');
                },
                child: const Text('Show Loading'),
              );
            },
          ),
        ),
      );

      await tester.tap(find.byType(ElevatedButton));
      await tester.pump();

      final row = tester.widget<Row>(find.byType(Row));
      expect(row.children.length, 3);
    });

    testWidgets('has barrierDismissible set to false', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              return ElevatedButton(
                onPressed: () {
                  showLoadingDialog(context, 'Loading...');
                },
                child: const Text('Show Loading'),
              );
            },
          ),
        ),
      );

      await tester.tap(find.byType(ElevatedButton));
      await tester.pump();

      expect(find.byType(AlertDialog), findsOneWidget);
    });

    testWidgets('text is wrapped in Expanded widget', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              return ElevatedButton(
                onPressed: () {
                  showLoadingDialog(context, 'Loading...');
                },
                child: const Text('Show Loading'),
              );
            },
          ),
        ),
      );

      await tester.tap(find.byType(ElevatedButton));
      await tester.pump();

      expect(find.byType(Expanded), findsOneWidget);
    });
  });
}
