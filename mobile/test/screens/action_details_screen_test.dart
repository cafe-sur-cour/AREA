import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:provider/provider.dart';
import 'package:area/screens/action_details_screen.dart';
import 'package:area/models/action_models.dart';
import 'package:area/models/service_models.dart';
import 'package:area/core/constants/app_colors.dart';
import 'package:area/core/notifiers/automation_builder_notifier.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/widgets/common/buttons/primary_button.dart';
import 'package:area/widgets/common/app_bar/custom_app_bar.dart';

class MockAutomationBuilderNotifier extends Mock implements AutomationBuilderNotifier {}

void main() {
  group('ActionDetailsScreen', () {
    late ActionModel testAction;
    late ServiceModel testService;
    late MockAutomationBuilderNotifier mockAutomationBuilder;

    setUp(() {
      testAction = ActionModel(
        id: 'test-action',
        name: 'Test Action',
        description: 'This is a test action description',
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
          home: ActionDetailsScreen(action: testAction, service: testService),
        ),
      );
    }

    testWidgets('renders action name in app bar', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.text('Test Action'), findsOneWidget);
    });

    testWidgets('renders action description when present', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.text('This is a test action description'), findsOneWidget);
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

      final context = tester.element(find.byType(ActionDetailsScreen));
      final localizations = AppLocalizations.of(context)!;

      expect(find.text('text (${localizations.required_lowercase})'), findsOneWidget);
      expect(find.text('number'), findsOneWidget);
    });

    testWidgets('renders choose action button', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byType(PrimaryButton), findsOneWidget);
      final context = tester.element(find.byType(ActionDetailsScreen));
      final localizations = AppLocalizations.of(context)!;
      expect(find.text(localizations.choose_this_action), findsOneWidget);
    });

    testWidgets('calls setAction and navigates when button is pressed', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      await tester.tap(find.byType(PrimaryButton));
      await tester.pumpAndSettle();

      verify(mockAutomationBuilder.setAction(testAction, testService)).called(1);
    });

    testWidgets('does not render description section when description is empty', (
      WidgetTester tester,
    ) async {
      final actionWithoutDesc = ActionModel(
        id: 'test-action',
        name: 'Test Action',
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
            home: ActionDetailsScreen(action: actionWithoutDesc, service: testService),
          ),
        ),
      );
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(ActionDetailsScreen));
      final localizations = AppLocalizations.of(context)!;
      expect(find.text(localizations.description), findsNothing);
    });

    testWidgets('does not render parameters section when no config fields', (
      WidgetTester tester,
    ) async {
      final actionWithoutConfig = ActionModel(
        id: 'test-action',
        name: 'Test Action',
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
            home: ActionDetailsScreen(action: actionWithoutConfig, service: testService),
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
  });
}
