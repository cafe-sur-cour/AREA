import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:provider/provider.dart';
import 'package:area/screens/reaction_details_screen.dart';
import 'package:area/models/reaction_models.dart';
import 'package:area/models/action_models.dart';
import 'package:area/models/service_models.dart';
import 'package:area/core/notifiers/automation_builder_notifier.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/widgets/common/app_bar/custom_app_bar.dart';

class MockAutomationBuilderNotifier extends Mock implements AutomationBuilderNotifier {}

void main() {
  group('ReactionDetailsScreen', () {
    late ReactionModel testReaction;
    late ServiceModel testService;
    late MockAutomationBuilderNotifier mockAutomationBuilder;

    setUp(() {
      testReaction = ReactionModel(
        id: 'test-reaction',
        name: 'Test Reaction',
        description: 'This is a test reaction description',
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
            ConfigField(
              name: 'param2',
              label: 'Parameter 2',
              type: 'number',
              required: false,
              description: 'Second parameter',
            ),
          ],
        ),
      );

      testService = ServiceModel(
        id: 'test-service',
        name: 'Test Service',
        description: 'Test service description',
        color: '#FF5733',
        icon: 'https://example.com/icon.png',
      );

      mockAutomationBuilder = MockAutomationBuilderNotifier();
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
          home: ReactionDetailsScreen(reaction: testReaction, service: testService),
        ),
      );
    }

    testWidgets('renders reaction name in app bar', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.text('Test Reaction'), findsOneWidget);
    });

    testWidgets('renders reaction description when present', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.text('This is a test reaction description'), findsOneWidget);
    });

    testWidgets('renders parameters section when config fields exist', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.text('Parameters'), findsOneWidget);
      expect(find.text('Parameter 1'), findsOneWidget);
      expect(find.text('Parameter 2'), findsOneWidget);
    });

    testWidgets('renders parameter types and requirements', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ReactionDetailsScreen));
      final localizations = AppLocalizations.of(context)!;

      expect(find.text('text (${localizations.required_lowercase})'), findsOneWidget);
      expect(find.text('number'), findsOneWidget);
    });

    testWidgets('renders execution delay section', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.text('Execution Delay'), findsOneWidget);
      expect(find.byIcon(Icons.schedule_rounded), findsOneWidget);
    });

    testWidgets('renders choose reaction button', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ReactionDetailsScreen));
      final localizations = AppLocalizations.of(context)!;
      expect(find.text(localizations.choose_this_reaction), findsOneWidget);
    });

    testWidgets('taps choose reaction button', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final chooseButton = find.text(
        AppLocalizations.of(
          tester.element(find.byType(ReactionDetailsScreen)),
        )!.choose_this_reaction,
      );

      expect(chooseButton, findsOneWidget);

      await tester.tap(chooseButton);
      await tester.pumpAndSettle();
    });

    testWidgets('opens delay picker when set button is pressed', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ReactionDetailsScreen));
      final localizations = AppLocalizations.of(context)!;

      final setButton = find.text(localizations.set);
      await tester.tap(setButton);
      await tester.pumpAndSettle();

      expect(find.text('Set Execution Delay'), findsOneWidget);
      expect(find.text('Days'), findsOneWidget);
      expect(find.text('Hours'), findsOneWidget);
      expect(find.text('Minutes'), findsOneWidget);
      expect(find.text('Seconds'), findsOneWidget);
    });

    testWidgets('delay picker shows increment and decrement buttons', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ReactionDetailsScreen));
      final localizations = AppLocalizations.of(context)!;

      await tester.tap(find.text(localizations.set));
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.add), findsWidgets);
      expect(find.byIcon(Icons.remove), findsWidgets);
    });

    testWidgets('closes delay picker when cancel button is pressed', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ReactionDetailsScreen));
      final localizations = AppLocalizations.of(context)!;

      await tester.tap(find.text(localizations.set));
      await tester.pumpAndSettle();

      await tester.tap(find.text(localizations.cancel));
      await tester.pumpAndSettle();

      expect(find.text('Set Execution Delay'), findsNothing);
    });

    testWidgets('delay picker has set delay button', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ReactionDetailsScreen));
      final localizations = AppLocalizations.of(context)!;

      await tester.tap(find.text(localizations.set));
      await tester.pumpAndSettle();

      expect(find.text(localizations.set_delay), findsOneWidget);
    });

    testWidgets('does not render description section when description is empty', (
      WidgetTester tester,
    ) async {
      final reactionWithoutDesc = ReactionModel(
        id: 'test-reaction',
        name: 'Test Reaction',
        description: '',
        configSchema: ConfigSchema(
          name: 'test-schema',
          description: 'Test schema',
          fields: [],
        ),
      );

      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider<AutomationBuilderNotifier>.value(
              value: mockAutomationBuilder,
            ),
          ],
          child: MaterialApp(
            localizationsDelegates: AppLocalizations.localizationsDelegates,
            supportedLocales: AppLocalizations.supportedLocales,
            home: ReactionDetailsScreen(reaction: reactionWithoutDesc, service: testService),
          ),
        ),
      );
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ReactionDetailsScreen));
      final localizations = AppLocalizations.of(context)!;
      expect(find.text(localizations.description), findsNothing);
    });

    testWidgets('does not render parameters section when no config fields', (
      WidgetTester tester,
    ) async {
      final reactionWithoutConfig = ReactionModel(
        id: 'test-reaction',
        name: 'Test Reaction',
        description: 'Description',
        configSchema: ConfigSchema(
          name: 'test-schema',
          description: 'Test schema',
          fields: [],
        ),
      );

      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider<AutomationBuilderNotifier>.value(
              value: mockAutomationBuilder,
            ),
          ],
          child: MaterialApp(
            localizationsDelegates: AppLocalizations.localizationsDelegates,
            supportedLocales: AppLocalizations.supportedLocales,
            home: ReactionDetailsScreen(reaction: reactionWithoutConfig, service: testService),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Parameters'), findsNothing);
    });

    testWidgets('applies correct service color to app bar', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final appBar = tester.widget<CustomAppBar>(find.byType(CustomAppBar));
      expect(appBar.bgColor, const Color(0xFFFF5733));
    });

    testWidgets('renders scrollable content', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byType(SingleChildScrollView), findsOneWidget);
    });

    testWidgets('renders parameters with icons', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.settings), findsNWidgets(2));
    });

    testWidgets('shows set button initially for delay', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ReactionDetailsScreen));
      final localizations = AppLocalizations.of(context)!;

      expect(find.text(localizations.set), findsOneWidget);
    });

    testWidgets('delay picker shows time unit labels', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ReactionDetailsScreen));
      final localizations = AppLocalizations.of(context)!;

      await tester.tap(find.text(localizations.set));
      await tester.pumpAndSettle();

      expect(find.text('Days'), findsOneWidget);
      expect(find.text('Hours'), findsOneWidget);
      expect(find.text('Minutes'), findsOneWidget);
      expect(find.text('Seconds'), findsOneWidget);
    });

    testWidgets('delay picker displays info message', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ReactionDetailsScreen));
      final localizations = AppLocalizations.of(context)!;

      await tester.tap(find.text(localizations.set));
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.info_outline), findsOneWidget);
    });
  });
}
