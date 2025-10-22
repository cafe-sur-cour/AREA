import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:area/widgets/common/state/error_state.dart';
import 'package:area/core/constants/app_colors.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:area/l10n/app_localizations.dart';

void main() {
  group('ErrorState', () {
    testWidgets('renders with title and message', (WidgetTester tester) async {
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
            body: ErrorState(title: 'Error Occurred', message: 'Something went wrong'),
          ),
        ),
      );

      expect(find.text('Error Occurred'), findsOneWidget);
      expect(find.text('Something went wrong'), findsOneWidget);
    });

    testWidgets('renders default error icon when not provided', (WidgetTester tester) async {
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
            body: ErrorState(title: 'Error', message: 'Something went wrong'),
          ),
        ),
      );

      expect(find.byIcon(Icons.error_outline), findsOneWidget);
    });

    testWidgets('renders custom icon when provided', (WidgetTester tester) async {
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
            body: ErrorState(
              title: 'Error',
              message: 'Something went wrong',
              icon: Icons.warning,
            ),
          ),
        ),
      );

      expect(find.byIcon(Icons.warning), findsOneWidget);
      expect(find.byIcon(Icons.error_outline), findsNothing);
    });

    testWidgets('applies default icon color when not provided', (WidgetTester tester) async {
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
            body: ErrorState(title: 'Error', message: 'Something went wrong'),
          ),
        ),
      );

      final icon = tester.widget<Icon>(find.byIcon(Icons.error_outline));
      expect(icon.color, AppColors.error);
      expect(icon.size, 64);
    });

    testWidgets('applies custom icon color when provided', (WidgetTester tester) async {
      const customColor = Colors.blue;

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
            body: ErrorState(
              title: 'Error',
              message: 'Something went wrong',
              iconColor: customColor,
            ),
          ),
        ),
      );

      final icon = tester.widget<Icon>(find.byIcon(Icons.error_outline));
      expect(icon.color, customColor);
    });

    testWidgets('renders retry button when onRetry is provided', (WidgetTester tester) async {
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
            body: ErrorState(
              title: 'Error',
              message: 'Something went wrong',
              onRetry: () {},
              retryButtonText: 'Retry',
            ),
          ),
        ),
      );

      expect(find.byType(ElevatedButton), findsOneWidget);
    });

    testWidgets('does not render retry button when onRetry is null', (
      WidgetTester tester,
    ) async {
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
            body: ErrorState(title: 'Error', message: 'Something went wrong'),
          ),
        ),
      );

      expect(find.byType(ElevatedButton), findsNothing);
    });

    testWidgets('retry button calls onRetry when tapped', (WidgetTester tester) async {
      bool retried = false;

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
            body: ErrorState(
              title: 'Error',
              message: 'Something went wrong',
              onRetry: () => retried = true,
              retryButtonText: 'Retry',
            ),
          ),
        ),
      );

      await tester.tap(find.byType(ElevatedButton));
      expect(retried, true);
    });

    testWidgets('applies correct title styling', (WidgetTester tester) async {
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
            body: ErrorState(title: 'Error Occurred', message: 'Something went wrong'),
          ),
        ),
      );

      final titleText = tester.widget<Text>(find.text('Error Occurred'));
      expect(titleText.style!.fontSize, 20);
      expect(titleText.style!.fontWeight, FontWeight.bold);
      expect(titleText.style!.color, Colors.red);
      expect(titleText.textAlign, TextAlign.center);
    });

    testWidgets('applies correct message styling', (WidgetTester tester) async {
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
            body: ErrorState(title: 'Error', message: 'Something went wrong'),
          ),
        ),
      );

      final messageText = tester.widget<Text>(find.text('Something went wrong'));
      expect(messageText.style!.fontSize, 16);
      expect(messageText.textAlign, TextAlign.center);
    });

    testWidgets('centers content with padding', (WidgetTester tester) async {
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
            body: ErrorState(title: 'Error', message: 'Something went wrong'),
          ),
        ),
      );

      expect(find.byType(Center), isNot(findsNothing));

      final padding = tester.widget<Padding>(
        find.descendant(of: find.byType(ErrorState), matching: find.byType(Padding)),
      );
      expect(padding.padding, const EdgeInsets.all(32.0));
    });

    testWidgets('has correct column layout', (WidgetTester tester) async {
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
            body: ErrorState(
              title: 'Error',
              message: 'Something went wrong',
              onRetry: () {},
              retryButtonText: 'Retry',
            ),
          ),
        ),
      );

      final column = tester.widget<Column>(find.byType(Column));
      expect(column.mainAxisAlignment, MainAxisAlignment.center);
      expect(
        column.children.length,
        7,
      );
    });
  });
}
