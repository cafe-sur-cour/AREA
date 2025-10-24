import 'package:area/core/constants/app_colors.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/models/reaction_models.dart';
import 'package:area/models/reaction_with_delay_model.dart';
import 'package:area/models/service_models.dart';
import 'package:area/widgets/automation/automation_connector.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  late ServiceModel testActionService;
  late ServiceModel testReactionService;
  late ReactionModel testReaction;

  setUp(() {
    testActionService = ServiceModel(
      id: '1',
      name: 'Test Action Service',
      description: 'A test service for actions',
      color: '#FF0000',
      icon: 'test_icon.png',
    );

    testReactionService = ServiceModel(
      id: '2',
      name: 'Test Reaction Service',
      description: 'A test service for reactions',
      color: '#00FF00',
      icon: 'reaction_icon.png',
    );

    testReaction = ReactionModel(
      id: '1',
      name: 'Test Reaction',
      description: 'A test reaction',
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

  group('AutomationConnector', () {
    testWidgets('renders with action service and reactions', (WidgetTester tester) async {
      final reactionWithDelay = ReactionWithDelayModel(
        service: testReactionService,
        reaction: testReaction,
        delayInSeconds: 0,
      );

      await tester.pumpWidget(
        buildTestWidget(
          AutomationConnector(
            actionService: testActionService,
            reactions: [reactionWithDelay],
          ),
        ),
      );

      expect(find.byType(Container), findsNWidgets(4));
      expect(find.text('THEN'), findsOneWidget);
      expect(find.byIcon(Icons.arrow_downward_rounded), findsNWidgets(2));
    });

    testWidgets('renders without action service', (WidgetTester tester) async {
      final reactionWithDelay = ReactionWithDelayModel(
        service: testReactionService,
        reaction: testReaction,
        delayInSeconds: 0,
      );

      await tester.pumpWidget(
        buildTestWidget(
          AutomationConnector(actionService: null, reactions: [reactionWithDelay]),
        ),
      );

      expect(find.byType(Container), findsNWidgets(4));
      expect(find.text('THEN'), findsOneWidget);
    });

    testWidgets('renders without reactions', (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestWidget(AutomationConnector(actionService: testActionService, reactions: [])),
      );

      expect(find.byType(Container), findsNWidgets(4));
      expect(find.text('THEN'), findsOneWidget);
    });

    testWidgets('renders without action service and reactions', (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestWidget(AutomationConnector(actionService: null, reactions: [])),
      );

      expect(find.byType(Container), findsNWidgets(4));
      expect(find.text('THEN'), findsOneWidget);
    });

    testWidgets('displays "then" text with correct styling', (WidgetTester tester) async {
      final reactionWithDelay = ReactionWithDelayModel(
        service: testReactionService,
        reaction: testReaction,
        delayInSeconds: 0,
      );

      await tester.pumpWidget(
        buildTestWidget(
          AutomationConnector(
            actionService: testActionService,
            reactions: [reactionWithDelay],
          ),
        ),
      );

      final textWidget = tester.widget<Text>(find.text('THEN'));
      expect(textWidget.style!.fontFamily, 'Montserrat');
      expect(textWidget.style!.fontSize, 12);
      expect(textWidget.style!.fontWeight, FontWeight.w800);
      expect(textWidget.style!.color, AppColors.areaBlue3);
      expect(textWidget.style!.letterSpacing, 1.5);
    });

    testWidgets('has correct layout structure', (WidgetTester tester) async {
      final reactionWithDelay = ReactionWithDelayModel(
        service: testReactionService,
        reaction: testReaction,
        delayInSeconds: 0,
      );

      await tester.pumpWidget(
        buildTestWidget(
          AutomationConnector(
            actionService: testActionService,
            reactions: [reactionWithDelay],
          ),
        ),
      );

      final mainContainer = tester.widget<Container>(find.byType(Container).first);
      expect(mainContainer.margin, const EdgeInsets.symmetric(horizontal: 48));

      expect(find.byType(Column), findsOneWidget);
    });

    testWidgets('center container has correct styling', (WidgetTester tester) async {
      final reactionWithDelay = ReactionWithDelayModel(
        service: testReactionService,
        reaction: testReaction,
        delayInSeconds: 0,
      );

      await tester.pumpWidget(
        buildTestWidget(
          AutomationConnector(
            actionService: testActionService,
            reactions: [reactionWithDelay],
          ),
        ),
      );

      final containers = tester.widgetList<Container>(find.byType(Container));
      final centerContainer = containers.elementAt(2);

      final decoration = centerContainer.decoration as BoxDecoration;
      expect(decoration.borderRadius, BorderRadius.circular(20));
      expect(decoration.border, isNotNull);
    });

    testWidgets('icons have correct properties', (WidgetTester tester) async {
      final reactionWithDelay = ReactionWithDelayModel(
        service: testReactionService,
        reaction: testReaction,
        delayInSeconds: 0,
      );

      await tester.pumpWidget(
        buildTestWidget(
          AutomationConnector(
            actionService: testActionService,
            reactions: [reactionWithDelay],
          ),
        ),
      );

      final icons = tester.widgetList<Icon>(find.byIcon(Icons.arrow_downward_rounded));
      for (final icon in icons) {
        expect(icon.size, 20);
        expect((icon.color!.a * 255.0).round() & 0xff, lessThan(255));
      }
    });
  });
}
