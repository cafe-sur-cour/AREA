import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:area/widgets/common/app_bar/custom_app_bar.dart';
import 'package:area/core/constants/app_colors.dart';

void main() {
  group('CustomAppBar', () {
    testWidgets('renders with title', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            appBar: CustomAppBar(title: 'Test Title'),
            body: Container(),
          ),
        ),
      );

      expect(find.text('Test Title'), findsOneWidget);
      expect(find.byType(AppBar), findsOneWidget);
    });

    testWidgets('applies correct title styling', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            appBar: CustomAppBar(title: 'Test Title'),
            body: Container(),
          ),
        ),
      );

      final text = tester.widget<Text>(find.text('Test Title'));
      expect(text.style!.fontFamily, 'Montserrat');
      expect(text.style!.fontWeight, FontWeight.bold);
    });

    testWidgets('centers title when centerTitle is true', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            appBar: CustomAppBar(title: 'Test Title', centerTitle: true),
            body: Container(),
          ),
        ),
      );

      final appBar = tester.widget<AppBar>(find.byType(AppBar));
      expect(appBar.centerTitle, true);
    });

    testWidgets('does not center title when centerTitle is false', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            appBar: CustomAppBar(title: 'Test Title', centerTitle: false),
            body: Container(),
          ),
        ),
      );

      final appBar = tester.widget<AppBar>(find.byType(AppBar));
      expect(appBar.centerTitle, false);
    });

    testWidgets('applies default background color', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            appBar: CustomAppBar(title: 'Test Title'),
            body: Container(),
          ),
        ),
      );

      final appBar = tester.widget<AppBar>(find.byType(AppBar));
      expect(appBar.backgroundColor, AppColors.areaBlue3);
    });

    testWidgets('applies custom background color', (WidgetTester tester) async {
      const customColor = Colors.red;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            appBar: CustomAppBar(title: 'Test Title', bgColor: customColor),
            body: Container(),
          ),
        ),
      );

      final appBar = tester.widget<AppBar>(find.byType(AppBar));
      expect(appBar.backgroundColor, customColor);
    });

    testWidgets('applies default foreground color', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            appBar: CustomAppBar(title: 'Test Title'),
            body: Container(),
          ),
        ),
      );

      final appBar = tester.widget<AppBar>(find.byType(AppBar));
      expect(appBar.foregroundColor, AppColors.areaLightGray);
    });

    testWidgets('applies custom foreground color', (WidgetTester tester) async {
      const customColor = Colors.blue;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            appBar: CustomAppBar(title: 'Test Title', fgColor: customColor),
            body: Container(),
          ),
        ),
      );

      final appBar = tester.widget<AppBar>(find.byType(AppBar));
      expect(appBar.foregroundColor, customColor);
    });

    testWidgets('includes actions when provided', (WidgetTester tester) async {
      final actions = [
        IconButton(onPressed: () {}, icon: const Icon(Icons.search)),
        IconButton(onPressed: () {}, icon: const Icon(Icons.more_vert)),
      ];

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            appBar: CustomAppBar(title: 'Test Title', actions: actions),
            body: Container(),
          ),
        ),
      );

      final appBar = tester.widget<AppBar>(find.byType(AppBar));
      expect(appBar.actions, actions);
      expect(find.byIcon(Icons.search), findsOneWidget);
      expect(find.byIcon(Icons.more_vert), findsOneWidget);
    });

    testWidgets('has correct preferred size', (WidgetTester tester) async {
      final appBar = CustomAppBar(title: 'Test Title');
      expect(appBar.preferredSize, const Size.fromHeight(kToolbarHeight));
    });

    testWidgets('implements PreferredSizeWidget', (WidgetTester tester) async {
      final appBar = CustomAppBar(title: 'Test Title');
      expect(appBar, isA<PreferredSizeWidget>());
    });
  });
}
