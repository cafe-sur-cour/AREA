import 'package:area/core/constants/app_colors.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/models/reaction_models.dart';
import 'package:area/models/reaction_with_delay_model.dart';
import 'package:area/models/service_models.dart';
import 'package:area/widgets/automation/automation_reaction_card.dart';
import 'package:area/widgets/automation/reactions_section.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  late ServiceModel testService;
  late ReactionModel testReaction1;
  late ReactionModel testReaction2;
  late ReactionWithDelayModel testReactionWithDelay1;
  late ReactionWithDelayModel testReactionWithDelay2;

  setUp(() {
    testService = ServiceModel(
      id: '1',
      name: 'Test Service',
      description: 'A test service',
      color: '#FF6B6B',
      icon: 'test_icon.png',
    );

    testReaction1 = ReactionModel(
      id: '1',
      name: 'Test Reaction 1',
      description: 'First test reaction',
    );

    testReaction2 = ReactionModel(
      id: '2',
      name: 'Test Reaction 2',
      description: 'Second test reaction',
    );

    testReactionWithDelay1 = ReactionWithDelayModel(
      service: testService,
      reaction: testReaction1,
      delayInSeconds: 0,
    );

    testReactionWithDelay2 = ReactionWithDelayModel(
      service: testService,
      reaction: testReaction2,
      delayInSeconds: 900,
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

  group('ReactionsSection', () {
    testWidgets('renders empty container when no reactions', (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestWidget(
          ReactionsSection(reactions: [], onClearReaction: (_) {}, onDelayEdit: (_) {}),
        ),
      );

      expect(find.byType(Container), findsOneWidget);
      expect(find.byType(AutomationReactionCard), findsNothing);
    });

    testWidgets('renders single reaction without connectors', (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestWidget(
          ReactionsSection(
            reactions: [testReactionWithDelay1],
            onClearReaction: (_) {},
            onDelayEdit: (_) {},
          ),
        ),
      );

      expect(find.byType(AutomationReactionCard), findsOneWidget);
      expect(find.text('AND'), findsNothing);
    });

    testWidgets('renders multiple reactions with connectors', (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestWidget(
          ReactionsSection(
            reactions: [testReactionWithDelay1, testReactionWithDelay2],
            onClearReaction: (_) {},
            onDelayEdit: (_) {},
          ),
        ),
      );

      expect(find.byType(AutomationReactionCard), findsNWidgets(2));
      expect(find.text('AND'), findsOneWidget);
    });

    testWidgets('renders three reactions with two connectors', (WidgetTester tester) async {
      final testReaction3 = ReactionModel(
        id: '3',
        name: 'Test Reaction 3',
        description: 'Third test reaction',
      );

      final testReactionWithDelay3 = ReactionWithDelayModel(
        service: testService,
        reaction: testReaction3,
        delayInSeconds: 3600,
      );

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
            body: SingleChildScrollView(
              child: ReactionsSection(
                reactions: [
                  testReactionWithDelay1,
                  testReactionWithDelay2,
                  testReactionWithDelay3,
                ],
                onClearReaction: (_) {},
                onDelayEdit: (_) {},
              ),
            ),
          ),
        ),
      );

      expect(find.byType(AutomationReactionCard), findsNWidgets(3));
      expect(find.text('AND'), findsNWidgets(2));
    });

    testWidgets('passes correct index to reaction cards', (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestWidget(
          ReactionsSection(
            reactions: [testReactionWithDelay1, testReactionWithDelay2],
            onClearReaction: (_) {},
            onDelayEdit: (_) {},
          ),
        ),
      );

      expect(find.text('REACTION 1'), findsOneWidget);
      expect(find.text('REACTION 2'), findsOneWidget);
    });

    testWidgets('calls onClearReaction with correct index when reaction is cleared', (
      WidgetTester tester,
    ) async {
      int? clearedIndex;

      await tester.pumpWidget(
        buildTestWidget(
          ReactionsSection(
            reactions: [testReactionWithDelay1, testReactionWithDelay2],
            onClearReaction: (index) => clearedIndex = index,
            onDelayEdit: (_) {},
          ),
        ),
      );

      await tester.tap(find.byIcon(Icons.close_rounded).first);
      expect(clearedIndex, 0);

      await tester.tap(find.byIcon(Icons.close_rounded).last);
      expect(clearedIndex, 1);
    });

    testWidgets('calls onDelayEdit with correct index when delay is edited', (
      WidgetTester tester,
    ) async {
      int? editedIndex;

      await tester.pumpWidget(
        buildTestWidget(
          ReactionsSection(
            reactions: [testReactionWithDelay1, testReactionWithDelay2],
            onClearReaction: (_) {},
            onDelayEdit: (index) => editedIndex = index,
          ),
        ),
      );

      await tester.tap(find.text('Set').first);
      expect(editedIndex, 0);

      await tester.tap(find.text('Edit').last);
      expect(editedIndex, 1);
    });

    testWidgets('connector has correct styling', (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestWidget(
          ReactionsSection(
            reactions: [testReactionWithDelay1, testReactionWithDelay2],
            onClearReaction: (_) {},
            onDelayEdit: (_) {},
          ),
        ),
      );

      final connectorContainers = tester.widgetList<Container>(find.byType(Container));

      final andText = tester.widget<Text>(find.text('AND'));
      expect(andText.style!.fontFamily, 'Montserrat');
      expect(andText.style!.fontSize, 10);
      expect(andText.style!.fontWeight, FontWeight.w800);
      expect(andText.style!.color, AppColors.areaBlue3);
      expect(andText.style!.letterSpacing, 1.5);
    });

    testWidgets('connector lines have correct dimensions and color', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        buildTestWidget(
          ReactionsSection(
            reactions: [testReactionWithDelay1, testReactionWithDelay2],
            onClearReaction: (_) {},
            onDelayEdit: (_) {},
          ),
        ),
      );

      final containers = tester.widgetList<Container>(find.byType(Container));
      bool foundConnectorLine = false;
      for (final container in containers) {
        if (container.decoration is BoxDecoration) {
          final decoration = container.decoration as BoxDecoration;
          if (decoration.color != null &&
              decoration.color!.alpha < 255 &&
              container.constraints?.maxWidth == 2 &&
              container.constraints?.maxHeight == 20) {
            foundConnectorLine = true;
            break;
          }
        }
      }
      expect(foundConnectorLine, true);
    });

    testWidgets('connector container has correct margins', (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestWidget(
          ReactionsSection(
            reactions: [testReactionWithDelay1, testReactionWithDelay2],
            onClearReaction: (_) {},
            onDelayEdit: (_) {},
          ),
        ),
      );

      final containers = tester.widgetList<Container>(find.byType(Container));
      bool foundConnectorContainer = false;
      for (final container in containers) {
        if (container.margin == const EdgeInsets.symmetric(horizontal: 60)) {
          foundConnectorContainer = true;
          break;
        }
      }
      expect(foundConnectorContainer, true);
    });

    testWidgets('connector text container has correct styling', (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestWidget(
          ReactionsSection(
            reactions: [testReactionWithDelay1, testReactionWithDelay2],
            onClearReaction: (_) {},
            onDelayEdit: (_) {},
          ),
        ),
      );

      final andContainer = tester.widget<Container>(
        find.ancestor(of: find.text('AND'), matching: find.byType(Container)).first,
      );

      final decoration = andContainer.decoration as BoxDecoration;
      expect(decoration.borderRadius, BorderRadius.circular(12));
    });

    testWidgets('maintains correct order of reactions and connectors', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        buildTestWidget(
          ReactionsSection(
            reactions: [testReactionWithDelay1, testReactionWithDelay2],
            onClearReaction: (_) {},
            onDelayEdit: (_) {},
          ),
        ),
      );

      final reactionCards = find.byType(AutomationReactionCard);
      expect(reactionCards, findsNWidgets(2));

      final columnChildren = tester.widget<Column>(find.byType(Column).first).children;
      expect(columnChildren.length, 3);
    });
  });
}
