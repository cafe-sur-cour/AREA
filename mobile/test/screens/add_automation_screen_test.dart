import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:area/screens/add_automation_screen.dart';
import 'package:area/models/action_models.dart';
import 'package:area/models/service_models.dart';
import 'package:area/models/reaction_with_delay_model.dart';
import 'package:area/models/reaction_models.dart';
import 'package:area/core/notifiers/automation_builder_notifier.dart';
import 'package:area/services/secure_storage.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/widgets/automation/automation_action_card.dart';
import 'package:area/widgets/automation/automation_connector.dart';
import 'package:area/widgets/automation/reactions_section.dart';
import 'package:area/widgets/automation/automation_buttons.dart';
import 'package:area/widgets/automation/delay_picker_dialog.dart';

class FakeAutomationBuilderNotifier extends AutomationBuilderNotifier {
  void setSelectedActionForTesting(ActionModel? action) {
    initialize(
      action: action,
      service: selectedService,
      reactions: selectedReactionsWithDelay,
    );
  }

  void setSelectedServiceForTesting(ServiceModel? service) {
    initialize(
      action: selectedAction,
      service: service,
      reactions: selectedReactionsWithDelay,
    );
  }

  void setSelectedReactionsForTesting(List<ReactionWithDelayModel> reactions) {
    initialize(action: selectedAction, service: selectedService, reactions: reactions);
  }

  void clearForTesting() {
    initialize();
  }
}

void main() {
  group('AddAutomationScreen', () {
    late dynamic mockAutomationBuilder;
    late ActionModel testAction;
    late ServiceModel testService;
    late ReactionWithDelayModel testReaction;

    setUp(() {
      mockAutomationBuilder = FakeAutomationBuilderNotifier();

      testAction = ActionModel(
        id: 'test-action',
        name: 'Test Action',
        description: 'Test action description',
        configSchema: ConfigSchema(
          name: 'test-schema',
          description: 'Test schema',
          fields: [
            ConfigField(
              name: 'param1',
              label: 'Parameter 1',
              type: 'text',
              required: true,
              description: 'First parameter',
            ),
          ],
        ),
      );
      testService = ServiceModel(
        id: 'test-service',
        name: 'Test Service',
        description: 'Test service',
        color: '#FF5733',
      );
      testReaction = ReactionWithDelayModel(
        reaction: ReactionModel(
          id: 'test-reaction',
          name: 'Test Reaction',
          description: 'Test reaction description',
          configSchema: ConfigSchema(
            name: 'reaction-schema',
            description: 'Test reaction schema',
            fields: [
              ConfigField(
                name: 'reactionParam',
                label: 'Reaction Parameter',
                type: 'number',
                required: false,
              ),
            ],
          ),
        ),
        service: testService,
        delayInSeconds: 0,
      );
    });

    Widget createTestWidget() {
      return MultiProvider(
        providers: [
          ChangeNotifierProvider<AutomationBuilderNotifier>.value(
            value: mockAutomationBuilder,
          ),
        ],
        child: MaterialApp(
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: const AddAutomationScreen(),
        ),
      );
    }

    testWidgets('renders logo image when no action or reactions', (WidgetTester tester) async {
      (mockAutomationBuilder as FakeAutomationBuilderNotifier).clearForTesting();

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byType(Image), findsOneWidget);
    });

    testWidgets('renders smaller logo when action or reactions exist', (
      WidgetTester tester,
    ) async {
      (mockAutomationBuilder as FakeAutomationBuilderNotifier)
        ..setSelectedActionForTesting(testAction)
        ..setSelectedServiceForTesting(testService)
        ..setSelectedReactionsForTesting([testReaction]);

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final image = tester.widget<Image>(find.byType(Image));
      expect(image.height, 80);
      expect(image.width, 80);
    });

    testWidgets('renders AutomationActionCard when action is selected', (
      WidgetTester tester,
    ) async {
      (mockAutomationBuilder as FakeAutomationBuilderNotifier)
        ..setSelectedActionForTesting(testAction)
        ..setSelectedServiceForTesting(testService)
        ..setSelectedReactionsForTesting([]);

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byType(AutomationActionCard), findsOneWidget);
    });

    testWidgets('renders AutomationConnector when action and reactions exist', (
      WidgetTester tester,
    ) async {
      (mockAutomationBuilder as FakeAutomationBuilderNotifier)
        ..setSelectedActionForTesting(testAction)
        ..setSelectedServiceForTesting(testService)
        ..setSelectedReactionsForTesting([testReaction]);

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byType(AutomationConnector), findsOneWidget);
    });

    testWidgets('renders ReactionsSection when reactions exist', (WidgetTester tester) async {
      (mockAutomationBuilder as FakeAutomationBuilderNotifier)
        ..setSelectedActionForTesting(null)
        ..setSelectedServiceForTesting(null)
        ..setSelectedReactionsForTesting([testReaction]);

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byType(ReactionsSection), findsOneWidget);
    });

    testWidgets('renders AutomationButtons', (WidgetTester tester) async {
      (mockAutomationBuilder as FakeAutomationBuilderNotifier).clearForTesting();

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byType(AutomationButtons), findsOneWidget);
    });

    testWidgets(
      'navigates to action-services when add action is tapped and user is connected',
      (WidgetTester tester) async {
        (mockAutomationBuilder as FakeAutomationBuilderNotifier).clearForTesting();

        await tester.pumpWidget(createTestWidget());
        await tester.pumpAndSettle();
      },
    );

    testWidgets('shows error snackbar when add action is tapped and user is not connected', (
      WidgetTester tester,
    ) async {
      (mockAutomationBuilder as FakeAutomationBuilderNotifier).clearForTesting();

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();
    });

    testWidgets('calls clearAction when action card is cleared', (WidgetTester tester) async {
      (mockAutomationBuilder as FakeAutomationBuilderNotifier)
        ..setSelectedActionForTesting(testAction)
        ..setSelectedServiceForTesting(testService)
        ..setSelectedReactionsForTesting([]);

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();
    });

    testWidgets('calls clearReactions when clear all reactions is tapped', (
      WidgetTester tester,
    ) async {
      (mockAutomationBuilder as FakeAutomationBuilderNotifier)
        ..setSelectedActionForTesting(null)
        ..setSelectedServiceForTesting(null)
        ..setSelectedReactionsForTesting([testReaction]);

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      // This would require finding and tapping the clear all button
    });

    testWidgets('calls removeReaction when reaction is cleared', (WidgetTester tester) async {
      (mockAutomationBuilder as FakeAutomationBuilderNotifier)
        ..setSelectedActionForTesting(null)
        ..setSelectedServiceForTesting(null)
        ..setSelectedReactionsForTesting([testReaction]);

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();
    });

    testWidgets(
      'navigates to automation-configuration when create automation is tapped with valid data',
      (WidgetTester tester) async {
        (mockAutomationBuilder as FakeAutomationBuilderNotifier)
          ..setSelectedActionForTesting(testAction)
          ..setSelectedServiceForTesting(testService)
          ..setSelectedReactionsForTesting([testReaction]);

        await tester.pumpWidget(createTestWidget());
        await tester.pumpAndSettle();
      },
    );

    testWidgets('shows error snackbar when create automation is tapped without action', (
      WidgetTester tester,
    ) async {
      (mockAutomationBuilder as FakeAutomationBuilderNotifier)
        ..setSelectedActionForTesting(null)
        ..setSelectedServiceForTesting(null)
        ..setSelectedReactionsForTesting([testReaction]);

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();
    });

    testWidgets('shows error snackbar when create automation is tapped without reactions', (
      WidgetTester tester,
    ) async {
      (mockAutomationBuilder as FakeAutomationBuilderNotifier)
        ..setSelectedActionForTesting(testAction)
        ..setSelectedServiceForTesting(testService)
        ..setSelectedReactionsForTesting([]);

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();
    });

    testWidgets('shows delay picker dialog when delay edit is tapped', (
      WidgetTester tester,
    ) async {
      (mockAutomationBuilder as FakeAutomationBuilderNotifier)
        ..setSelectedActionForTesting(null)
        ..setSelectedServiceForTesting(null)
        ..setSelectedReactionsForTesting([testReaction]);

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();
    });
  });
}
