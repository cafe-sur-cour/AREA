import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:area/widgets/common/dialogs/confirm_dialog.dart';

void main() {
  group('showConfirmDialog', () {
    testWidgets('shows dialog with correct title and message', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              return ElevatedButton(
                onPressed: () async {
                  await showConfirmDialog(
                    context: context,
                    title: 'Confirm Action',
                    message: 'Are you sure?',
                    confirmText: 'Yes',
                    cancelText: 'No',
                  );
                },
                child: const Text('Show Dialog'),
              );
            },
          ),
        ),
      );

      await tester.tap(find.byType(ElevatedButton));
      await tester.pumpAndSettle();

      expect(find.text('Confirm Action'), findsOneWidget);
      expect(find.text('Are you sure?'), findsOneWidget);
      expect(find.text('Yes'), findsOneWidget);
      expect(find.text('No'), findsOneWidget);
    });

    testWidgets('returns true when confirm button is tapped', (WidgetTester tester) async {
      bool? result;

      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              return ElevatedButton(
                onPressed: () async {
                  result = await showConfirmDialog(
                    context: context,
                    title: 'Confirm Action',
                    message: 'Are you sure?',
                    confirmText: 'Yes',
                    cancelText: 'No',
                  );
                },
                child: const Text('Show Dialog'),
              );
            },
          ),
        ),
      );

      await tester.tap(find.byType(ElevatedButton));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Yes'));
      await tester.pumpAndSettle();

      expect(result, true);
    });

    testWidgets('returns false when cancel button is tapped', (WidgetTester tester) async {
      bool? result;

      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              return ElevatedButton(
                onPressed: () async {
                  result = await showConfirmDialog(
                    context: context,
                    title: 'Confirm Action',
                    message: 'Are you sure?',
                    confirmText: 'Yes',
                    cancelText: 'No',
                  );
                },
                child: const Text('Show Dialog'),
              );
            },
          ),
        ),
      );

      await tester.tap(find.byType(ElevatedButton));
      await tester.pumpAndSettle();

      await tester.tap(find.text('No'));
      await tester.pumpAndSettle();

      expect(result, false);
    });

    testWidgets('returns false when dialog is dismissed', (WidgetTester tester) async {
      bool? result;

      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              return ElevatedButton(
                onPressed: () async {
                  result = await showConfirmDialog(
                    context: context,
                    title: 'Confirm Action',
                    message: 'Are you sure?',
                    confirmText: 'Yes',
                    cancelText: 'No',
                  );
                },
                child: const Text('Show Dialog'),
              );
            },
          ),
        ),
      );

      await tester.tap(find.byType(ElevatedButton));
      await tester.pumpAndSettle();

      await tester.tapAt(const Offset(10, 10));
      await tester.pumpAndSettle();

      expect(result, false);
    });

    testWidgets('renders AlertDialog with correct shape', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              return ElevatedButton(
                onPressed: () async {
                  await showConfirmDialog(
                    context: context,
                    title: 'Confirm Action',
                    message: 'Are you sure?',
                    confirmText: 'Yes',
                    cancelText: 'No',
                  );
                },
                child: const Text('Show Dialog'),
              );
            },
          ),
        ),
      );

      await tester.tap(find.byType(ElevatedButton));
      await tester.pumpAndSettle();

      expect(find.byType(AlertDialog), findsOneWidget);
    });

    testWidgets('has two TextButton actions', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              return ElevatedButton(
                onPressed: () async {
                  await showConfirmDialog(
                    context: context,
                    title: 'Confirm Action',
                    message: 'Are you sure?',
                    confirmText: 'Yes',
                    cancelText: 'No',
                  );
                },
                child: const Text('Show Dialog'),
              );
            },
          ),
        ),
      );

      await tester.tap(find.byType(ElevatedButton));
      await tester.pumpAndSettle();

      expect(find.byType(TextButton), findsNWidgets(2));
    });
  });
}
