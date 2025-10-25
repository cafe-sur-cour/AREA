import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:area/widgets/automation/automation_action_card.dart';
import 'package:area/models/action_models.dart';
import 'package:area/models/service_models.dart';
import 'package:area/core/constants/app_colors.dart';

void main() {
  group('AutomationActionCard', () {
    late ActionModel testAction;
    late ServiceModel testService;

    setUp(() {
      testAction = ActionModel(
        id: 'test-action',
        name: 'Test Action',
        description: 'A test action for automation',
      );

      testService = ServiceModel(
        id: 'test-service',
        name: 'Test Service',
        description: 'A test service',
        color: '#FF5733',
        icon: 'https://example.com/icon.png',
      );
    });

    testWidgets('renders action name and service name', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AutomationActionCard(
              action: testAction,
              service: testService,
              onClear: () {},
            ),
          ),
        ),
      );

      expect(find.text('Test Action'), findsOneWidget);
      expect(find.text('Test Service'), findsOneWidget);
      expect(find.text('ACTION'), findsOneWidget);
    });

    testWidgets('renders flash icon', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AutomationActionCard(
              action: testAction,
              service: testService,
              onClear: () {},
            ),
          ),
        ),
      );

      expect(find.byIcon(Icons.flash_on), findsOneWidget);
    });

    testWidgets('renders close button', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AutomationActionCard(
              action: testAction,
              service: testService,
              onClear: () {},
            ),
          ),
        ),
      );

      expect(find.byIcon(Icons.close_rounded), findsOneWidget);
    });

    testWidgets('calls onClear when close button is tapped', (WidgetTester tester) async {
      bool cleared = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AutomationActionCard(
              action: testAction,
              service: testService,
              onClear: () => cleared = true,
            ),
          ),
        ),
      );

      await tester.tap(find.byIcon(Icons.close_rounded));
      expect(cleared, true);
    });

    testWidgets('has correct border styling', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AutomationActionCard(
              action: testAction,
              service: testService,
              onClear: () {},
            ),
          ),
        ),
      );

      final containers = tester.widgetList<Container>(find.byType(Container));
      final innerContainer = containers.elementAt(1);
      final decoration = innerContainer.decoration as BoxDecoration;
      expect(decoration.borderRadius, BorderRadius.circular(20));
      expect(decoration.border, isNotNull);
    });

    testWidgets('has Material with elevation', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AutomationActionCard(
              action: testAction,
              service: testService,
              onClear: () {},
            ),
          ),
        ),
      );

      final materials = tester.widgetList<Material>(find.byType(Material));
      final mainMaterial = materials.elementAt(1);
      expect(mainMaterial.elevation, 8);
      expect(mainMaterial.borderRadius, BorderRadius.circular(20));
    });

    testWidgets('applies correct margins', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AutomationActionCard(
              action: testAction,
              service: testService,
              onClear: () {},
            ),
          ),
        ),
      );

      final container = tester.widget<Container>(find.byType(Container).first);
      expect(container.margin, const EdgeInsets.symmetric(horizontal: 24, vertical: 12));
    });

    testWidgets('renders service icon when available', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AutomationActionCard(
              action: testAction,
              service: testService,
              onClear: () {},
            ),
          ),
        ),
      );

      expect(find.byType(Image), findsOneWidget);
    });

    testWidgets('renders fallback icon when service has no icon', (WidgetTester tester) async {
      final serviceWithoutIcon = ServiceModel(
        id: 'test-service',
        name: 'Test Service',
        description: 'A test service',
        color: '#FF5733',
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AutomationActionCard(
              action: testAction,
              service: serviceWithoutIcon,
              onClear: () {},
            ),
          ),
        ),
      );

      expect(find.byIcon(Icons.web), findsOneWidget);
    });

    testWidgets('applies correct text styling for action name', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AutomationActionCard(
              action: testAction,
              service: testService,
              onClear: () {},
            ),
          ),
        ),
      );

      final textWidget = tester.widget<Text>(find.text('Test Action'));
      expect(textWidget.style!.fontFamily, 'Montserrat');
      expect(textWidget.style!.fontSize, 18);
      expect(textWidget.style!.fontWeight, FontWeight.w800);
      expect(textWidget.style!.color, AppColors.areaBlack);
    });

    testWidgets('applies correct text styling for ACTION label', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AutomationActionCard(
              action: testAction,
              service: testService,
              onClear: () {},
            ),
          ),
        ),
      );

      final textWidget = tester.widget<Text>(find.text('ACTION'));
      expect(textWidget.style!.fontFamily, 'Montserrat');
      expect(textWidget.style!.fontSize, 10);
      expect(textWidget.style!.fontWeight, FontWeight.w800);
      expect(textWidget.style!.letterSpacing, 1.2);
    });
  });
}
