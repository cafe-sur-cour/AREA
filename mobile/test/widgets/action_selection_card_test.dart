import 'package:area/core/constants/app_colors.dart';
import 'package:area/core/utils/color_utils.dart';
import 'package:area/models/action_models.dart';
import 'package:area/widgets/action_selection_card.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  late ActionModel testAction;
  late ActionModel testActionWithConfig;
  late ActionModel testActionWithoutDescription;

  setUp(() {
    testAction = ActionModel(
      id: '1',
      name: 'Test Action',
      description: 'This is a test action for testing purposes',
      metadata: ActionMetadata(
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

    testActionWithConfig = ActionModel(
      id: '2',
      name: 'Action with Multiple Params',
      description: 'Action with multiple configuration parameters',
      metadata: ActionMetadata(
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

    testActionWithoutDescription = ActionModel(
      id: '3',
      name: 'Action Without Description',
      description: '',
      metadata: ActionMetadata(
        category: 'test',
        tags: [],
        icon: null,
        color: '#45B7D1',
        requiresAuth: false,
      ),
      configSchema: ConfigSchema(name: 'test', description: 'test schema', fields: []),
    );
  });

  group('ActionSelectionCard', () {
    testWidgets('renders action card with basic information', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: ActionSelectionCard(action: testAction)),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Test Action'), findsOneWidget);
      expect(find.text('This is a test action for testing purposes'), findsOneWidget);
      expect(find.byIcon(Icons.flash_on), findsOneWidget);
      expect(find.byIcon(Icons.arrow_forward_ios), findsOneWidget);
      expect(find.byType(Card), findsOneWidget);
    });

    testWidgets('renders action without description', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: ActionSelectionCard(action: testActionWithoutDescription)),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Action Without Description'), findsOneWidget);
      expect(find.text('This is a test action for testing purposes'), findsNothing);
      expect(find.byIcon(Icons.flash_on), findsOneWidget);
    });

    testWidgets('displays action icon when available', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: ActionSelectionCard(action: testAction)),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byType(Image), findsOneWidget);
    });

    testWidgets('shows fallback icon when action icon is null', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: ActionSelectionCard(action: testActionWithoutDescription)),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.flash_on), findsOneWidget);
      expect(find.byType(Image), findsNothing);
    });

    testWidgets('displays single parameter count correctly', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: ActionSelectionCard(action: testAction)),
        ),
      );

      expect(find.text('1 parameter'), findsOneWidget);
      expect(find.byIcon(Icons.settings), findsOneWidget);
    });

    testWidgets('displays multiple parameters count correctly', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: ActionSelectionCard(action: testActionWithConfig)),
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
          home: Scaffold(body: ActionSelectionCard(action: testActionWithoutDescription)),
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
            body: ActionSelectionCard(action: testAction, onTap: () => tapped = true),
          ),
        ),
      );

      await tester.tap(find.byType(InkWell));
      expect(tapped, true);
    });

    testWidgets('does not respond to tap when onTap is null', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: ActionSelectionCard(action: testAction)),
        ),
      );

      final inkWell = tester.widget<InkWell>(find.byType(InkWell));
      expect(inkWell.onTap, null);
    });

    testWidgets('applies correct styling to card', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: ActionSelectionCard(action: testAction)),
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
          home: Scaffold(body: ActionSelectionCard(action: testAction)),
        ),
      );

      final containers = tester.widgetList<Container>(find.byType(Container));
      final iconContainer = containers.first;

      expect(iconContainer.constraints!.maxWidth, 40);
      expect(iconContainer.constraints!.maxHeight, 40);

      final decoration = iconContainer.decoration as BoxDecoration;
      expect(decoration.borderRadius, BorderRadius.circular(8));
    });

    testWidgets('uses action color for icon container background', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: ActionSelectionCard(action: testAction)),
        ),
      );

      final containers = tester.widgetList<Container>(find.byType(Container));
      final iconContainer = containers.first;

      final decoration = iconContainer.decoration as BoxDecoration;
      final expectedColor = ColorUtils.getActionColor(testAction).withValues(alpha: 0.1);
      expect(decoration.color, expectedColor);
    });

    testWidgets('uses action color for fallback icon', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: ActionSelectionCard(action: testActionWithoutDescription)),
        ),
      );
      await tester.pumpAndSettle();

      final icon = tester.widget<Icon>(find.byIcon(Icons.flash_on));
      final expectedColor = ColorUtils.getActionColor(testActionWithoutDescription);
      expect(icon.color, expectedColor);
      expect(icon.size, 24);
    });

    testWidgets('applies correct text styling', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: ActionSelectionCard(action: testAction)),
        ),
      );

      final titleText = tester.widget<Text>(find.text('Test Action'));
      expect(titleText.style!.fontFamily, 'Montserrat');
      expect(titleText.style!.fontSize, 16);
      expect(titleText.style!.fontWeight, FontWeight.bold);
      expect(titleText.style!.color, AppColors.areaBlack);

      final descriptionText = tester.widget<Text>(
        find.text('This is a test action for testing purposes'),
      );
      expect(descriptionText.style!.fontFamily, 'Montserrat');
      expect(descriptionText.style!.fontSize, 14);
      expect(descriptionText.style!.color, AppColors.areaDarkGray);
      expect(descriptionText.style!.height, 1.4);
    });

    testWidgets('handles long text with ellipsis', (WidgetTester tester) async {
      final longAction = ActionModel(
        id: '1',
        name: 'Very Long Action Name That Should Be Truncated',
        description:
            'Very long description that should also be truncated when it exceeds the maximum number of lines allowed for display',
        metadata: ActionMetadata(
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
            body: SizedBox(width: 200, child: ActionSelectionCard(action: longAction)),
          ),
        ),
      );

      final titleText = tester.widget<Text>(
        find.text('Very Long Action Name That Should Be Truncated'),
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
          home: Scaffold(body: ActionSelectionCard(action: testActionWithConfig)),
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
          home: Scaffold(body: ActionSelectionCard(action: testAction)),
        ),
      );

      final arrowIcon = tester.widget<Icon>(find.byIcon(Icons.arrow_forward_ios));
      expect(arrowIcon.color, AppColors.areaDarkGray);
      expect(arrowIcon.size, 16);
    });
  });
}
