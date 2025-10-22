import 'package:area/core/constants/app_colors.dart';
import 'package:area/core/utils/color_utils.dart';
import 'package:area/models/reaction_models.dart';
import 'package:area/models/reaction_with_delay_model.dart';
import 'package:area/models/service_models.dart';
import 'package:area/widgets/automation/automation_reaction_card.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  late ServiceModel testService;
  late ReactionModel testReaction;
  late ReactionWithDelayModel testReactionWithDelay;
  late ReactionWithDelayModel testReactionWithDelayAndTime;

  setUp(() {
    testService = ServiceModel(
      id: '1',
      name: 'Test Service',
      description: 'A test service',
      color: '#FF6B6B',
      icon: 'test_icon.png',
    );

    testReaction = ReactionModel(
      id: '1',
      name: 'Test Reaction',
      description: 'A test reaction',
    );

    testReactionWithDelay = ReactionWithDelayModel(
      service: testService,
      reaction: testReaction,
      delayInSeconds: 0,
    );

    testReactionWithDelayAndTime = ReactionWithDelayModel(
      service: testService,
      reaction: testReaction,
      delayInSeconds: 1800,
    );
  });

  group('AutomationReactionCard', () {
    testWidgets('renders reaction card with basic information', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AutomationReactionCard(
              reactionWithDelay: testReactionWithDelay,
              index: 0,
              onClear: () {},
              onDelayEdit: () {},
            ),
          ),
        ),
      );

      expect(find.text('REACTION 1'), findsOneWidget);
      expect(find.text('Test Reaction'), findsOneWidget);
      expect(find.text('Test Service'), findsOneWidget);
      expect(find.byIcon(Icons.play_arrow), findsOneWidget);
      expect(find.byIcon(Icons.close_rounded), findsOneWidget);
      expect(find.byIcon(Icons.schedule_rounded), findsOneWidget);
    });

    testWidgets('displays correct index number', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AutomationReactionCard(
              reactionWithDelay: testReactionWithDelay,
              index: 2,
              onClear: () {},
              onDelayEdit: () {},
            ),
          ),
        ),
      );

      expect(find.text('REACTION 3'), findsOneWidget);
      expect(find.text('3'), findsOneWidget);
    });

    testWidgets('shows service icon when available', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AutomationReactionCard(
              reactionWithDelay: testReactionWithDelay,
              index: 0,
              onClear: () {},
              onDelayEdit: () {},
            ),
          ),
        ),
      );

      expect(find.byType(Image), findsOneWidget);
    });

    testWidgets('shows fallback icon when service icon is null', (WidgetTester tester) async {
      final serviceWithoutIcon = ServiceModel(
        id: '1',
        name: 'Test Service',
        description: 'A test service',
        color: '#FF6B6B',
        icon: null,
      );

      final reactionWithDelay = ReactionWithDelayModel(
        service: serviceWithoutIcon,
        reaction: testReaction,
        delayInSeconds: 0,
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AutomationReactionCard(
              reactionWithDelay: reactionWithDelay,
              index: 0,
              onClear: () {},
              onDelayEdit: () {},
            ),
          ),
        ),
      );

      expect(find.byIcon(Icons.web), findsOneWidget);
    });

    testWidgets('displays no delay information when delay is null', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AutomationReactionCard(
              reactionWithDelay: testReactionWithDelay,
              index: 0,
              onClear: () {},
              onDelayEdit: () {},
            ),
          ),
        ),
      );

      expect(find.text('Execution Delay'), findsOneWidget);
      expect(find.text('No delay'), findsOneWidget);
      expect(find.text('Set'), findsOneWidget);
      expect(find.byIcon(Icons.add), findsOneWidget);
    });

    testWidgets('displays delay information when delay is set', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AutomationReactionCard(
              reactionWithDelay: testReactionWithDelayAndTime,
              index: 0,
              onClear: () {},
              onDelayEdit: () {},
            ),
          ),
        ),
      );

      expect(find.text('Execution Delay'), findsOneWidget);
      expect(find.text('30m'), findsOneWidget);
      expect(find.text('Edit'), findsOneWidget);
      expect(find.byIcon(Icons.edit), findsOneWidget);
    });

    testWidgets('calls onClear when close button is tapped', (WidgetTester tester) async {
      bool cleared = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AutomationReactionCard(
              reactionWithDelay: testReactionWithDelay,
              index: 0,
              onClear: () => cleared = true,
              onDelayEdit: () {},
            ),
          ),
        ),
      );

      await tester.tap(find.byIcon(Icons.close_rounded));
      expect(cleared, true);
    });

    testWidgets('calls onDelayEdit when delay button is tapped', (WidgetTester tester) async {
      bool delayEdited = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AutomationReactionCard(
              reactionWithDelay: testReactionWithDelay,
              index: 0,
              onClear: () {},
              onDelayEdit: () => delayEdited = true,
            ),
          ),
        ),
      );

      await tester.tap(find.text('Set'));
      expect(delayEdited, true);
    });

    testWidgets('applies service color to various elements', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AutomationReactionCard(
              reactionWithDelay: testReactionWithDelay,
              index: 0,
              onClear: () {},
              onDelayEdit: () {},
            ),
          ),
        ),
      );

      final serviceColor = ColorUtils.getServiceColor(testService);
      expect(serviceColor, isNotNull);

      final containers = find.byType(Container);
      expect(containers, findsWidgets);
    });

    testWidgets('has correct card styling', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AutomationReactionCard(
              reactionWithDelay: testReactionWithDelay,
              index: 0,
              onClear: () {},
              onDelayEdit: () {},
            ),
          ),
        ),
      );

      final materials = tester.widgetList<Material>(find.byType(Material));
      final mainMaterial = materials.elementAt(1);
      expect(mainMaterial.elevation, 6);
      expect(mainMaterial.borderRadius, BorderRadius.circular(20));

      final containers = tester.widgetList<Container>(find.byType(Container));
      final innerContainer = containers.elementAt(1);
      final decoration = innerContainer.decoration as BoxDecoration;
      expect(decoration.borderRadius, BorderRadius.circular(20));
      expect(decoration.border, isNotNull);
    });

    testWidgets('delay section has different styling based on delay presence', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AutomationReactionCard(
              reactionWithDelay: testReactionWithDelay,
              index: 0,
              onClear: () {},
              onDelayEdit: () {},
            ),
          ),
        ),
      );

      var delayContainers = tester.widgetList<Container>(find.byType(Container));

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AutomationReactionCard(
              reactionWithDelay: testReactionWithDelayAndTime,
              index: 0,
              onClear: () {},
              onDelayEdit: () {},
            ),
          ),
        ),
      );

      delayContainers = tester.widgetList<Container>(find.byType(Container));
    });

    testWidgets('has correct margins and padding', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AutomationReactionCard(
              reactionWithDelay: testReactionWithDelay,
              index: 0,
              onClear: () {},
              onDelayEdit: () {},
            ),
          ),
        ),
      );

      final mainContainer = tester.widget<Container>(find.byType(Container).first);
      expect(mainContainer.margin, const EdgeInsets.symmetric(horizontal: 24, vertical: 8));

      final contentContainer = tester.widget<Container>(find.byType(Container).at(1));
      expect(contentContainer.padding, const EdgeInsets.all(20));
    });

    testWidgets('play icon is white and centered in service icon container', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AutomationReactionCard(
              reactionWithDelay: testReactionWithDelay,
              index: 0,
              onClear: () {},
              onDelayEdit: () {},
            ),
          ),
        ),
      );

      final playIcon = tester.widget<Icon>(find.byIcon(Icons.play_arrow));
      expect(playIcon.color, Colors.white);
      expect(playIcon.size, 24);
    });

    testWidgets('index badge has correct styling', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AutomationReactionCard(
              reactionWithDelay: testReactionWithDelay,
              index: 0,
              onClear: () {},
              onDelayEdit: () {},
            ),
          ),
        ),
      );

      final indexText = tester.widget<Text>(find.text('1'));
      expect(indexText.style!.fontFamily, 'Montserrat');
      expect(indexText.style!.fontSize, 10);
      expect(indexText.style!.fontWeight, FontWeight.w800);
    });
  });
}
