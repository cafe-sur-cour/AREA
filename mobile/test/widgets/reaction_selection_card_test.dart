import 'package:area/core/constants/app_colors.dart';
import 'package:area/core/utils/color_utils.dart';
import 'package:area/models/action_models.dart';
import 'package:area/models/reaction_models.dart';
import 'package:area/widgets/reaction_selection_card.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  late ReactionModel testReaction;
  late ReactionModel testReactionWithConfig;
  late ReactionModel testReactionWithoutDescription;

  setUp(() {
    testReaction = ReactionModel(
      id: '1',
      name: 'Test Reaction',
      description: 'This is a test reaction for testing purposes',
      metadata: ReactionMetadata(
        category: 'test',
        tags: [],
        icon: 'test_icon.png',
        color: '#FF6B6B',
        requiresAuth: false,
      ),
      configSchema: ConfigSchema(
        name: 'test',
        description: 'test schema',
        fields: [
          ConfigField(
            name: 'param1',
            type: 'string',
            label: 'First parameter',
            required: true,
          ),
        ],
      ),
    );

    testReactionWithConfig = ReactionModel(
      id: '2',
      name: 'Reaction with Multiple Params',
      description: 'Reaction with multiple configuration parameters',
      metadata: ReactionMetadata(
        category: 'test',
        tags: [],
        icon: 'config_icon.png',
        color: '#4ECDC4',
        requiresAuth: false,
      ),
      configSchema: ConfigSchema(
        name: 'test',
        description: 'test schema',
        fields: [
          ConfigField(
            name: 'param1',
            type: 'string',
            label: 'First parameter',
            required: true,
          ),
          ConfigField(
            name: 'param2',
            type: 'number',
            label: 'Second parameter',
            required: false,
          ),
          ConfigField(
            name: 'param3',
            type: 'boolean',
            label: 'Third parameter',
            required: true,
          ),
        ],
      ),
    );

    testReactionWithoutDescription = ReactionModel(
      id: '3',
      name: 'Reaction Without Description',
      description: '',
      metadata: ReactionMetadata(
        category: 'test',
        tags: [],
        icon: null,
        color: '#45B7D1',
        requiresAuth: false,
      ),
      configSchema: ConfigSchema(name: 'test', description: 'test schema', fields: []),
    );
  });

  group('ReactionSelectionCard', () {
    testWidgets('renders reaction card with basic information', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: ReactionSelectionCard(reaction: testReaction)),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Test Reaction'), findsOneWidget);
      expect(find.text('This is a test reaction for testing purposes'), findsOneWidget);
      expect(find.byIcon(Icons.replay), findsOneWidget);
      expect(find.byIcon(Icons.arrow_forward_ios), findsOneWidget);
      expect(find.byType(Card), findsOneWidget);
    });

    testWidgets('renders reaction without description', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ReactionSelectionCard(reaction: testReactionWithoutDescription),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Reaction Without Description'), findsOneWidget);
      expect(find.text('This is a test reaction for testing purposes'), findsNothing);
      expect(find.byIcon(Icons.replay), findsOneWidget);
    });

    testWidgets('displays reaction icon when available', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: ReactionSelectionCard(reaction: testReaction)),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byType(Image), findsOneWidget);
    });

    testWidgets('shows fallback icon when reaction icon is null', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ReactionSelectionCard(reaction: testReactionWithoutDescription),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.replay), findsOneWidget);
      expect(find.byType(Image), findsNothing);
    });

    testWidgets('displays single parameter count correctly', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: ReactionSelectionCard(reaction: testReaction)),
        ),
      );

      expect(find.text('1 parameter'), findsOneWidget);
      expect(find.byIcon(Icons.settings), findsOneWidget);
    });

    testWidgets('displays multiple parameters count correctly', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: ReactionSelectionCard(reaction: testReactionWithConfig)),
        ),
      );

      expect(find.text('3 parameters'), findsOneWidget);
      expect(find.byIcon(Icons.settings), findsOneWidget);
    });

    testWidgets('does not show parameters section when no config fields', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ReactionSelectionCard(reaction: testReactionWithoutDescription),
          ),
        ),
      );

      expect(find.byIcon(Icons.settings), findsNothing);
      expect(find.textContaining('parameter'), findsNothing);
    });

    testWidgets('calls onTap when card is tapped', (WidgetTester tester) async {
      bool tapped = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ReactionSelectionCard(reaction: testReaction, onTap: () => tapped = true),
          ),
        ),
      );

      await tester.tap(find.byType(InkWell));
      expect(tapped, true);
    });

    testWidgets('does not respond to tap when onTap is null', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: ReactionSelectionCard(reaction: testReaction)),
        ),
      );

      final inkWell = tester.widget<InkWell>(find.byType(InkWell));
      expect(inkWell.onTap, null);
    });

    testWidgets('applies correct styling to card', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: ReactionSelectionCard(reaction: testReaction)),
        ),
      );

      final card = tester.widget<Card>(find.byType(Card));
      expect(card.elevation, 2);
      expect(card.shape, isA<RoundedRectangleBorder>());

      final shape = card.shape as RoundedRectangleBorder;
      expect(shape.borderRadius, BorderRadius.circular(12));
    });

    testWidgets('applies correct styling to icon container', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: ReactionSelectionCard(reaction: testReaction)),
        ),
      );

      final containers = tester.widgetList<Container>(find.byType(Container));
      final iconContainer = containers.first;

      expect(iconContainer.constraints!.maxWidth, 40);
      expect(iconContainer.constraints!.maxHeight, 40);

      final decoration = iconContainer.decoration as BoxDecoration;
      expect(decoration.borderRadius, BorderRadius.circular(8));
    });

    testWidgets('uses reaction color for icon container background', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: ReactionSelectionCard(reaction: testReaction)),
        ),
      );

      final containers = tester.widgetList<Container>(find.byType(Container));
      final iconContainer = containers.first;

      final decoration = iconContainer.decoration as BoxDecoration;
      final expectedColor = ColorUtils.getReactionColor(testReaction).withValues(alpha: 0.1);
      expect(decoration.color, expectedColor);
    });

    testWidgets('uses reaction color for fallback icon', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ReactionSelectionCard(reaction: testReactionWithoutDescription),
          ),
        ),
      );
      await tester.pumpAndSettle();

      final icon = tester.widget<Icon>(find.byIcon(Icons.replay));
      final expectedColor = ColorUtils.getReactionColor(testReactionWithoutDescription);
      expect(icon.color, expectedColor);
      expect(icon.size, 24);
    });

    testWidgets('applies correct text styling', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: ReactionSelectionCard(reaction: testReaction)),
        ),
      );

      final titleText = tester.widget<Text>(find.text('Test Reaction'));
      expect(titleText.style!.fontFamily, 'Montserrat');
      expect(titleText.style!.fontSize, 16);
      expect(titleText.style!.fontWeight, FontWeight.bold);
      expect(titleText.style!.color, AppColors.areaBlack);

      final descriptionText = tester.widget<Text>(
        find.text('This is a test reaction for testing purposes'),
      );
      expect(descriptionText.style!.fontFamily, 'Montserrat');
      expect(descriptionText.style!.fontSize, 14);
      expect(descriptionText.style!.color, AppColors.areaDarkGray);
      expect(descriptionText.style!.height, 1.4);
    });

    testWidgets('handles long text with ellipsis', (WidgetTester tester) async {
      final longReaction = ReactionModel(
        id: '1',
        name: 'Very Long Reaction Name That Should Be Truncated',
        description:
            'Very long description that should also be truncated when it exceeds the maximum number of lines allowed for display',
        metadata: ReactionMetadata(
          category: 'test',
          tags: [],
          icon: 'test_icon.png',
          color: '#FF6B6B',
          requiresAuth: false,
        ),
        configSchema: ConfigSchema(name: 'test', description: 'test schema', fields: []),
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SizedBox(width: 200, child: ReactionSelectionCard(reaction: longReaction)),
          ),
        ),
      );

      final titleText = tester.widget<Text>(
        find.text('Very Long Reaction Name That Should Be Truncated'),
      );
      expect(titleText.maxLines, 2);
      expect(titleText.overflow, TextOverflow.ellipsis);

      final descriptionText = tester.widget<Text>(
        find.textContaining('Very long description'),
      );
      expect(descriptionText.maxLines, 3);
      expect(descriptionText.overflow, TextOverflow.ellipsis);
    });

    testWidgets('parameters text has correct styling', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: ReactionSelectionCard(reaction: testReactionWithConfig)),
        ),
      );

      final paramText = tester.widget<Text>(find.text('3 parameters'));
      expect(paramText.style!.fontFamily, 'Montserrat');
      expect(paramText.style!.fontSize, 12);
      expect((paramText.style!.color!.a * 255.0).round() & 0xff, lessThan(255));
    });

    testWidgets('arrow icon has correct styling', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: ReactionSelectionCard(reaction: testReaction)),
        ),
      );

      final arrowIcon = tester.widget<Icon>(find.byIcon(Icons.arrow_forward_ios));
      expect(arrowIcon.color, AppColors.areaDarkGray);
      expect(arrowIcon.size, 16);
    });
  });
}
