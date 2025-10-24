import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:area/widgets/common/buttons/oauth_button.dart';
import 'package:area/core/constants/app_colors.dart';

void main() {
  group('OAuthButton', () {
    testWidgets('renders with provider name and icon', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: OAuthButton(
              providerName: 'Google',
              icon: Icons.g_mobiledata,
              onPressed: () {},
              backgroundColor: Colors.blue,
            ),
          ),
        ),
      );

      expect(find.text('Google'), findsOneWidget);
      expect(find.byIcon(Icons.g_mobiledata), findsOneWidget);
      expect(find.byType(ElevatedButton), findsOneWidget);
    });

    testWidgets('calls onPressed when tapped', (WidgetTester tester) async {
      bool pressed = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: OAuthButton(
              providerName: 'Google',
              icon: Icons.g_mobiledata,
              onPressed: () => pressed = true,
              backgroundColor: Colors.blue,
            ),
          ),
        ),
      );

      await tester.tap(find.byType(ElevatedButton));
      expect(pressed, true);
    });

    testWidgets('applies custom background color', (WidgetTester tester) async {
      const customColor = Colors.red;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: OAuthButton(
              providerName: 'Google',
              icon: Icons.g_mobiledata,
              onPressed: () {},
              backgroundColor: customColor,
            ),
          ),
        ),
      );

      final elevatedButton = tester.widget<ElevatedButton>(find.byType(ElevatedButton));
      final buttonStyle = elevatedButton.style!;
      expect(buttonStyle.backgroundColor!.resolve({}), customColor);
    });

    testWidgets('renders as expanded when isExpanded is true', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Row(
              children: [
                OAuthButton(
                  providerName: 'Google',
                  icon: Icons.g_mobiledata,
                  onPressed: () {},
                  backgroundColor: Colors.blue,
                  isExpanded: true,
                ),
              ],
            ),
          ),
        ),
      );

      expect(find.byType(Expanded), findsOneWidget);
    });

    testWidgets('does not render as expanded when isExpanded is false', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: OAuthButton(
              providerName: 'Google',
              icon: Icons.g_mobiledata,
              onPressed: () {},
              backgroundColor: Colors.blue,
              isExpanded: false,
            ),
          ),
        ),
      );

      expect(find.byType(Expanded), findsNothing);
    });

    testWidgets('has correct text and icon colors', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: OAuthButton(
              providerName: 'Google',
              icon: Icons.g_mobiledata,
              onPressed: () {},
              backgroundColor: Colors.blue,
            ),
          ),
        ),
      );

      final textWidget = tester.widget<Text>(find.text('Google'));
      expect(textWidget.style!.color, AppColors.areaLightGray);

      final iconWidget = tester.widget<Icon>(find.byIcon(Icons.g_mobiledata));
      expect(iconWidget.color, AppColors.areaLightGray);
    });

    testWidgets('has correct layout with Row and spacing', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: OAuthButton(
              providerName: 'Google',
              icon: Icons.g_mobiledata,
              onPressed: () {},
              backgroundColor: Colors.blue,
            ),
          ),
        ),
      );

      final row = tester.widget<Row>(find.byType(Row));
      expect(row.mainAxisAlignment, MainAxisAlignment.center);
      expect(row.children.length, 3);
    });
  });
}
