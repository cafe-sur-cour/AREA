import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:area/widgets/automation/automation_buttons.dart';
import 'package:area/models/service_models.dart';
import 'package:area/core/constants/app_colors.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:area/l10n/app_localizations.dart';

void main() {
  group('AutomationButtons', () {
    late ServiceModel testService;

    setUp(() {
      testService = ServiceModel(
        id: 'test-service',
        name: 'Test Service',
        description: 'A test service',
        color: '#FF5733',
      );
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
        home: Scaffold(body: child),
      );
    }

    testWidgets('renders action and reaction buttons', (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestWidget(
          AutomationButtons(
            selectedService: testService,
            hasAction: false,
            hasReactions: false,
            reactionsCount: 0,
            onAddAction: () {},
            onAddReaction: () {},
            onClearAllReactions: () {},
            onCreateAutomation: () {},
          ),
        ),
      );

      expect(find.byType(ElevatedButton), findsNWidgets(2));
    });

    testWidgets('action button shows add icon when no action', (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestWidget(
          AutomationButtons(
            selectedService: testService,
            hasAction: false,
            hasReactions: false,
            reactionsCount: 0,
            onAddAction: () {},
            onAddReaction: () {},
            onClearAllReactions: () {},
            onCreateAutomation: () {},
          ),
        ),
      );

      expect(find.byIcon(Icons.add), findsOneWidget);
    });

    testWidgets('action button shows edit icon when has action', (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestWidget(
          AutomationButtons(
            selectedService: testService,
            hasAction: true,
            hasReactions: false,
            reactionsCount: 0,
            onAddAction: () {},
            onAddReaction: () {},
            onClearAllReactions: () {},
            onCreateAutomation: () {},
          ),
        ),
      );

      expect(find.byIcon(Icons.edit), findsOneWidget);
    });

    testWidgets('reaction button is disabled when no action', (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestWidget(
          AutomationButtons(
            selectedService: testService,
            hasAction: false,
            hasReactions: false,
            reactionsCount: 0,
            onAddAction: () {},
            onAddReaction: () {},
            onClearAllReactions: () {},
            onCreateAutomation: () {},
          ),
        ),
      );

      final reactionButton = tester.widget<ElevatedButton>(find.byType(ElevatedButton).at(1));
      expect(reactionButton.onPressed, null);
    });

    testWidgets('reaction button shows lock icon when no action', (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestWidget(
          AutomationButtons(
            selectedService: testService,
            hasAction: false,
            hasReactions: false,
            reactionsCount: 0,
            onAddAction: () {},
            onAddReaction: () {},
            onClearAllReactions: () {},
            onCreateAutomation: () {},
          ),
        ),
      );

      expect(find.byIcon(Icons.lock), findsOneWidget);
    });

    testWidgets('reaction button is enabled when has action', (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestWidget(
          AutomationButtons(
            selectedService: testService,
            hasAction: true,
            hasReactions: false,
            reactionsCount: 0,
            onAddAction: () {},
            onAddReaction: () {},
            onClearAllReactions: () {},
            onCreateAutomation: () {},
          ),
        ),
      );

      final reactionButton = tester.widget<ElevatedButton>(find.byType(ElevatedButton).at(1));
      expect(reactionButton.onPressed, isNotNull);
    });

    testWidgets('shows clear reactions button when has reactions', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        buildTestWidget(
          AutomationButtons(
            selectedService: testService,
            hasAction: true,
            hasReactions: true,
            reactionsCount: 2,
            onAddAction: () {},
            onAddReaction: () {},
            onClearAllReactions: () {},
            onCreateAutomation: () {},
          ),
        ),
      );

      expect(find.byIcon(Icons.clear_all_rounded), findsOneWidget);
      expect(find.byType(ElevatedButton), findsNWidgets(4));
    });

    testWidgets('shows create automation button when has action and reactions', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        buildTestWidget(
          AutomationButtons(
            selectedService: testService,
            hasAction: true,
            hasReactions: true,
            reactionsCount: 1,
            onAddAction: () {},
            onAddReaction: () {},
            onClearAllReactions: () {},
            onCreateAutomation: () {},
          ),
        ),
      );

      expect(find.byIcon(Icons.rocket_launch_rounded), findsOneWidget);
      expect(find.byType(ElevatedButton), findsNWidgets(4));
    });

    testWidgets('calls onAddAction when action button is tapped', (WidgetTester tester) async {
      bool actionAdded = false;

      await tester.pumpWidget(
        buildTestWidget(
          AutomationButtons(
            selectedService: testService,
            hasAction: false,
            hasReactions: false,
            reactionsCount: 0,
            onAddAction: () => actionAdded = true,
            onAddReaction: () {},
            onClearAllReactions: () {},
            onCreateAutomation: () {},
          ),
        ),
      );

      await tester.tap(find.byType(ElevatedButton).first);
      expect(actionAdded, true);
    });

    testWidgets('calls onAddReaction when reaction button is tapped and enabled', (
      WidgetTester tester,
    ) async {
      bool reactionAdded = false;

      await tester.pumpWidget(
        buildTestWidget(
          AutomationButtons(
            selectedService: testService,
            hasAction: true,
            hasReactions: false,
            reactionsCount: 0,
            onAddAction: () {},
            onAddReaction: () => reactionAdded = true,
            onClearAllReactions: () {},
            onCreateAutomation: () {},
          ),
        ),
      );

      await tester.tap(find.byType(ElevatedButton).at(1));
      expect(reactionAdded, true);
    });

    testWidgets('calls onClearAllReactions when clear button is tapped', (
      WidgetTester tester,
    ) async {
      bool cleared = false;

      await tester.pumpWidget(
        buildTestWidget(
          AutomationButtons(
            selectedService: testService,
            hasAction: true,
            hasReactions: true,
            reactionsCount: 1,
            onAddAction: () {},
            onAddReaction: () {},
            onClearAllReactions: () => cleared = true,
            onCreateAutomation: () {},
          ),
        ),
      );

      await tester.tap(find.byIcon(Icons.clear_all_rounded));
      expect(cleared, true);
    });

    testWidgets('calls onCreateAutomation when create button is tapped', (
      WidgetTester tester,
    ) async {
      bool created = false;

      await tester.pumpWidget(
        buildTestWidget(
          AutomationButtons(
            selectedService: testService,
            hasAction: true,
            hasReactions: true,
            reactionsCount: 1,
            onAddAction: () {},
            onAddReaction: () {},
            onClearAllReactions: () {},
            onCreateAutomation: () => created = true,
          ),
        ),
      );

      await tester.tap(find.byIcon(Icons.rocket_launch_rounded));
      expect(created, true);
    });

    testWidgets('applies correct styling to action button', (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestWidget(
          AutomationButtons(
            selectedService: testService,
            hasAction: true,
            hasReactions: false,
            reactionsCount: 0,
            onAddAction: () {},
            onAddReaction: () {},
            onClearAllReactions: () {},
            onCreateAutomation: () {},
          ),
        ),
      );

      final actionButton = tester.widget<ElevatedButton>(find.byType(ElevatedButton).first);
      final buttonStyle = actionButton.style!;
      expect(buttonStyle.backgroundColor!.resolve({}), AppColors.areaBlue3);
    });

    testWidgets('applies disabled styling to reaction button when no action', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        buildTestWidget(
          AutomationButtons(
            selectedService: testService,
            hasAction: false,
            hasReactions: false,
            reactionsCount: 0,
            onAddAction: () {},
            onAddReaction: () {},
            onClearAllReactions: () {},
            onCreateAutomation: () {},
          ),
        ),
      );

      final reactionButton = tester.widget<ElevatedButton>(find.byType(ElevatedButton).at(1));
      final buttonStyle = reactionButton.style!;
      expect(buttonStyle.backgroundColor!.resolve({}), AppColors.areaDarkGray);
    });
  });
}
