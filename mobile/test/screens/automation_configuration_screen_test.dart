import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart' as mocktail;
import 'package:provider/provider.dart';
import 'package:area/screens/automation_configuration_screen.dart';
import 'package:area/models/action_models.dart';
import 'package:area/models/service_models.dart';
import 'package:area/models/reaction_with_delay_model.dart';
import 'package:area/models/reaction_models.dart';
import 'package:area/core/notifiers/automation_builder_notifier.dart';
import 'package:area/core/notifiers/backend_address_notifier.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/widgets/dynamic_text_field.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:area/services/secure_http_client.dart';
import 'package:area/services/secure_storage.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class MockAutomationBuilderNotifier extends mocktail.Mock
    implements AutomationBuilderNotifier {}

class MockBackendAddressNotifier extends mocktail.Mock implements BackendAddressNotifier {}

class MockFlutterSecureStorage extends mocktail.Mock implements FlutterSecureStorage {}

void main() {
  group('AutomationConfigurationScreen', () {
    late MockAutomationBuilderNotifier mockAutomationBuilder;
    late MockBackendAddressNotifier mockBackendNotifier;
    late MockFlutterSecureStorage mockSecureStorage;
    late ActionModel testAction;
    late ServiceModel testService;
    late ReactionWithDelayModel testReaction;

    setUp(() {
      mockAutomationBuilder = MockAutomationBuilderNotifier();
      mockBackendNotifier = MockBackendAddressNotifier();
      mockSecureStorage = MockFlutterSecureStorage();
      setSecureStorage(mockSecureStorage);

      mocktail.when(() => mockSecureStorage.read(key: 'jwt')).thenAnswer((_) async => null);
      testAction = ActionModel(
        id: 'test-action',
        name: 'Test Action',
        description: 'Test action description',
        configSchema: ConfigSchema(
          name: 'test-schema',
          description: 'Test schema',
          fields: [
            ConfigField(
              name: 'actionParam',
              label: 'Action Parameter',
              type: 'text',
              required: true,
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
        delayInSeconds: 60,
      );
    });

    tearDown(() {
      SecureHttpClient.reset();
    });

    Widget createTestWidget() {
      return MultiProvider(
        providers: [
          ChangeNotifierProvider<AutomationBuilderNotifier>.value(
            value: mockAutomationBuilder,
          ),
          ChangeNotifierProvider<BackendAddressNotifier>.value(value: mockBackendNotifier),
        ],
        child: MaterialApp(
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: const AutomationConfigurationScreen(),
        ),
      );
    }

    testWidgets('renders app bar with correct title', (WidgetTester tester) async {
      mocktail.when(() => mockAutomationBuilder.selectedAction).thenReturn(testAction);
      mocktail.when(() => mockAutomationBuilder.selectedService).thenReturn(testService);
      mocktail.when(() => mockAutomationBuilder.selectedReactionsWithDelay).thenReturn([
        testReaction,
      ]);
      mocktail.when(() => mockAutomationBuilder.isComplete).thenReturn(true);

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(
        find.text(
          AppLocalizations.of(
            tester.element(find.byType(AutomationConfigurationScreen)),
          )!
              .configure_automation,
        ),
        findsOneWidget,
      );
    });

    testWidgets('renders name and description text fields', (WidgetTester tester) async {
      mocktail.when(() => mockAutomationBuilder.selectedAction).thenReturn(testAction);
      mocktail.when(() => mockAutomationBuilder.selectedService).thenReturn(testService);
      mocktail.when(() => mockAutomationBuilder.selectedReactionsWithDelay).thenReturn([
        testReaction,
      ]);
      mocktail.when(() => mockAutomationBuilder.isComplete).thenReturn(true);

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byType(TextFormField), findsWidgets);
    });

    testWidgets('renders action config section when action has config fields', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockAutomationBuilder.selectedAction).thenReturn(testAction);
      mocktail.when(() => mockAutomationBuilder.selectedService).thenReturn(testService);
      mocktail.when(() => mockAutomationBuilder.selectedReactionsWithDelay).thenReturn([
        testReaction,
      ]);
      mocktail.when(() => mockAutomationBuilder.isComplete).thenReturn(true);
      mocktail
          .when(() => mockAutomationBuilder.getActionConfigValue(mocktail.any()))
          .thenReturn(null);

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(AutomationConfigurationScreen));
      final localizations = AppLocalizations.of(context)!;
      expect(find.text(localizations.action_colon(testAction.name)), findsOneWidget);
    });

    testWidgets('renders reaction config section when reaction has config fields', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockAutomationBuilder.selectedAction).thenReturn(testAction);
      mocktail.when(() => mockAutomationBuilder.selectedService).thenReturn(testService);
      mocktail.when(() => mockAutomationBuilder.selectedReactionsWithDelay).thenReturn([
        testReaction,
      ]);
      mocktail.when(() => mockAutomationBuilder.isComplete).thenReturn(true);
      mocktail
          .when(() => mockAutomationBuilder.getActionConfigValue(mocktail.any()))
          .thenReturn(null);

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(AutomationConfigurationScreen));
      final localizations = AppLocalizations.of(context)!;
      expect(
        find.text(localizations.reaction_number(1, testReaction.reaction.name)),
        findsOneWidget,
      );
    });

    testWidgets('renders create button', (WidgetTester tester) async {
      mocktail.when(() => mockAutomationBuilder.selectedAction).thenReturn(testAction);
      mocktail.when(() => mockAutomationBuilder.selectedService).thenReturn(testService);
      mocktail.when(() => mockAutomationBuilder.selectedReactionsWithDelay).thenReturn([
        testReaction,
      ]);
      mocktail.when(() => mockAutomationBuilder.isComplete).thenReturn(true);

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(AutomationConfigurationScreen));
      final localizations = AppLocalizations.of(context)!;

      expect(find.byType(ElevatedButton), findsOneWidget);
      expect(find.text(localizations.create_automation), findsOneWidget);
    });

    testWidgets('displays form with validation', (WidgetTester tester) async {
      mocktail.when(() => mockAutomationBuilder.selectedAction).thenReturn(testAction);
      mocktail.when(() => mockAutomationBuilder.selectedService).thenReturn(testService);
      mocktail.when(() => mockAutomationBuilder.selectedReactionsWithDelay).thenReturn([
        testReaction,
      ]);
      mocktail.when(() => mockAutomationBuilder.isComplete).thenReturn(true);
      mocktail.when(() => mockAutomationBuilder.getValidationErrors()).thenReturn([
        'Validation error',
      ]);
      mocktail
          .when(() => mockAutomationBuilder.getActionConfigValue(mocktail.any()))
          .thenReturn(null);

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byType(Form), findsOneWidget);
      expect(find.byType(ElevatedButton), findsOneWidget);
    });

    testWidgets('displays automation configuration fields', (WidgetTester tester) async {
      mocktail.when(() => mockAutomationBuilder.selectedAction).thenReturn(testAction);
      mocktail.when(() => mockAutomationBuilder.selectedService).thenReturn(testService);
      mocktail.when(() => mockAutomationBuilder.selectedReactionsWithDelay).thenReturn([
        testReaction,
      ]);
      mocktail.when(() => mockAutomationBuilder.isComplete).thenReturn(true);
      mocktail.when(() => mockAutomationBuilder.getValidationErrors()).thenReturn([]);
      mocktail
          .when(() => mockAutomationBuilder.getActionConfigValue(mocktail.any()))
          .thenReturn(null);
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn(null);

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(AutomationConfigurationScreen));
      final localizations = AppLocalizations.of(context)!;

      expect(find.text(localizations.automation_details), findsOneWidget);
      expect(find.byType(Card), findsWidgets);
    });

    testWidgets('renders complete configuration screen with all sections', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockAutomationBuilder.selectedAction).thenReturn(testAction);
      mocktail.when(() => mockAutomationBuilder.selectedService).thenReturn(testService);
      mocktail.when(() => mockAutomationBuilder.selectedReactionsWithDelay).thenReturn([
        testReaction,
      ]);
      mocktail.when(() => mockAutomationBuilder.isComplete).thenReturn(true);
      mocktail.when(() => mockAutomationBuilder.getValidationErrors()).thenReturn([]);
      mocktail.when(() => mockAutomationBuilder.actionConfig).thenReturn({
        'actionParam': 'test value',
      });
      mocktail
          .when(() => mockAutomationBuilder.getActionConfigValue(mocktail.any()))
          .thenReturn(null);
      mocktail.when(() => mockBackendNotifier.backendAddress).thenReturn('http://test.com/');
      mocktail.when(() => mockAutomationBuilder.clearAll()).thenReturn(null);

      SecureHttpClient.setClient(
        MockClient((request) async {
          if (request.url.toString().contains('api/automations')) {
            return http.Response(
              jsonEncode({'message': 'Automation created successfully'}),
              201,
            );
          }
          return http.Response(jsonEncode({'error': 'Not Found'}), 404);
        }),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byType(Form), findsOneWidget);
      expect(find.byType(Card), findsWidgets);
      expect(find.byType(TextFormField), findsWidgets);
      expect(find.byType(ElevatedButton), findsOneWidget);
    });

    testWidgets('displays invalid state message when automation is incomplete', (
      WidgetTester tester,
    ) async {
      mocktail.when(() => mockAutomationBuilder.isComplete).thenReturn(false);
      mocktail.when(() => mockAutomationBuilder.selectedAction).thenReturn(null);
      mocktail.when(() => mockAutomationBuilder.selectedService).thenReturn(null);
      mocktail.when(() => mockAutomationBuilder.selectedReactionsWithDelay).thenReturn([]);

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final context = tester.element(find.byType(AutomationConfigurationScreen));
      final localizations = AppLocalizations.of(context)!;

      expect(find.text(localizations.invalid_automation_state), findsOneWidget);
      expect(find.byIcon(Icons.error_outline), findsOneWidget);
    });

    testWidgets('renders different field types correctly', (WidgetTester tester) async {
      final actionWithVariousFields = ActionModel(
        id: 'test-action',
        name: 'Test Action',
        description: 'Test action description',
        configSchema: ConfigSchema(
          name: 'test-schema',
          description: 'Test schema',
          fields: [
            ConfigField(name: 'textField', label: 'Text Field', type: 'text', required: true),
            ConfigField(
              name: 'textareaField',
              label: 'Text Area',
              type: 'textarea',
              required: false,
            ),
            ConfigField(
              name: 'numberField',
              label: 'Number Field',
              type: 'number',
              required: true,
            ),
            ConfigField(
              name: 'selectField',
              label: 'Select Field',
              type: 'select',
              options: [
                ConfigOption(value: 'option1', label: 'Option 1'),
                ConfigOption(value: 'option2', label: 'Option 2'),
              ],
              required: false,
            ),
            ConfigField(
              name: 'checkboxField',
              label: 'Checkbox Field',
              type: 'checkbox',
              required: false,
            ),
          ],
        ),
      );

      mocktail
          .when(() => mockAutomationBuilder.selectedAction)
          .thenReturn(actionWithVariousFields);
      mocktail.when(() => mockAutomationBuilder.selectedService).thenReturn(testService);
      mocktail.when(() => mockAutomationBuilder.selectedReactionsWithDelay).thenReturn([]);
      mocktail.when(() => mockAutomationBuilder.isComplete).thenReturn(true);
      mocktail
          .when(() => mockAutomationBuilder.getActionConfigValue(mocktail.any()))
          .thenReturn(null);

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byType(TextFormField), findsWidgets);
      await tester.dragUntilVisible(
        find.byType(DropdownButtonFormField<String>),
        find.byType(SingleChildScrollView),
        const Offset(0, -50),
      );
      expect(find.byType(DropdownButtonFormField<String>), findsOneWidget);

      await tester.dragUntilVisible(
        find.byType(Checkbox),
        find.byType(SingleChildScrollView),
        const Offset(0, -50),
      );
      expect(find.byType(Checkbox), findsOneWidget);
    });

    testWidgets('handles dynamic text fields', (WidgetTester tester) async {
      final actionWithDynamicField = ActionModel(
        id: 'test-action',
        name: 'Test Action',
        description: 'Test action description',
        configSchema: ConfigSchema(
          name: 'test-schema',
          description: 'Test schema',
          fields: [
            ConfigField(
              name: 'dynamicField',
              label: 'Dynamic Field',
              type: 'text',
              isDynamic: true,
              required: true,
            ),
          ],
        ),
      );

      mocktail
          .when(() => mockAutomationBuilder.selectedAction)
          .thenReturn(actionWithDynamicField);
      mocktail.when(() => mockAutomationBuilder.selectedService).thenReturn(testService);
      mocktail.when(() => mockAutomationBuilder.selectedReactionsWithDelay).thenReturn([]);
      mocktail.when(() => mockAutomationBuilder.isComplete).thenReturn(true);
      mocktail
          .when(() => mockAutomationBuilder.getActionConfigValue(mocktail.any()))
          .thenReturn(null);

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byType(DynamicTextField), findsOneWidget);
    });

    testWidgets('renders field descriptions when present', (WidgetTester tester) async {
      final actionWithDescriptions = ActionModel(
        id: 'test-action',
        name: 'Test Action',
        description: 'Test action description',
        configSchema: ConfigSchema(
          name: 'test-schema',
          description: 'Test schema',
          fields: [
            ConfigField(
              name: 'fieldWithDesc',
              label: 'Field with Description',
              type: 'text',
              description: 'This is a field description',
              required: true,
            ),
          ],
        ),
      );

      mocktail
          .when(() => mockAutomationBuilder.selectedAction)
          .thenReturn(actionWithDescriptions);
      mocktail.when(() => mockAutomationBuilder.selectedService).thenReturn(testService);
      mocktail.when(() => mockAutomationBuilder.selectedReactionsWithDelay).thenReturn([]);
      mocktail.when(() => mockAutomationBuilder.isComplete).thenReturn(true);
      mocktail
          .when(() => mockAutomationBuilder.getActionConfigValue(mocktail.any()))
          .thenReturn(null);

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.text('This is a field description'), findsOneWidget);
    });

    testWidgets('shows required field indicators', (WidgetTester tester) async {
      mocktail.when(() => mockAutomationBuilder.selectedAction).thenReturn(testAction);
      mocktail.when(() => mockAutomationBuilder.selectedService).thenReturn(testService);
      mocktail.when(() => mockAutomationBuilder.selectedReactionsWithDelay).thenReturn([]);
      mocktail.when(() => mockAutomationBuilder.isComplete).thenReturn(true);
      mocktail
          .when(() => mockAutomationBuilder.getActionConfigValue(mocktail.any()))
          .thenReturn(null);

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.textContaining('*'), findsWidgets);
    });
  });
}
