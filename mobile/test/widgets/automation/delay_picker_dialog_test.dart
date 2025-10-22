import 'package:area/core/constants/app_colors.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/models/reaction_models.dart';
import 'package:area/models/reaction_with_delay_model.dart';
import 'package:area/models/service_models.dart';
import 'package:area/widgets/automation/delay_picker_dialog.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  late ServiceModel testService;
  late ReactionModel testReaction;
  late ReactionWithDelayModel testReactionWithDelay;

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
      delayInSeconds: 9000,
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

  group('DelayPickerDialog', () {
    testWidgets('renders dialog with all delay inputs', (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestWidget(
          DelayPickerDialog(reactionWithDelay: testReactionWithDelay, onDelaySet: (_) {}),
        ),
      );

      expect(find.byType(AlertDialog), findsOneWidget);
      expect(find.byIcon(Icons.access_time), findsOneWidget);
      expect(find.text('Set Delay for\nTest Reaction'), findsOneWidget);
      expect(find.byIcon(Icons.remove), findsNWidgets(4));
      expect(find.byIcon(Icons.add), findsNWidgets(4));
      expect(find.byIcon(Icons.info_outline), findsOneWidget);
      expect(find.text('Cancel'), findsOneWidget);
      expect(find.text('Set Delay'), findsOneWidget);
    });

    testWidgets('initializes with correct values from reaction delay', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        buildTestWidget(
          DelayPickerDialog(reactionWithDelay: testReactionWithDelay, onDelaySet: (_) {}),
        ),
      );

      expect(find.text('0'), findsNWidgets(2));
      expect(find.text('2'), findsOneWidget);
      expect(find.text('30'), findsOneWidget);
    });

    testWidgets('initializes with zero values when no delay', (WidgetTester tester) async {
      final reactionWithNoDelay = ReactionWithDelayModel(
        service: testService,
        reaction: testReaction,
        delayInSeconds: 0,
      );

      await tester.pumpWidget(
        buildTestWidget(
          DelayPickerDialog(reactionWithDelay: reactionWithNoDelay, onDelaySet: (_) {}),
        ),
      );

      expect(find.text('0'), findsNWidgets(4));
    });

    testWidgets('can increment days', (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestWidget(
          DelayPickerDialog(reactionWithDelay: testReactionWithDelay, onDelaySet: (_) {}),
        ),
      );

      final addButtons = find.byIcon(Icons.add);
      await tester.tap(addButtons.first);
      await tester.pump();

      expect(find.text('1'), findsOneWidget);
    });

    testWidgets('can decrement hours', (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestWidget(
          DelayPickerDialog(reactionWithDelay: testReactionWithDelay, onDelaySet: (_) {}),
        ),
      );

      final removeButtons = find.byIcon(Icons.remove);
      await tester.tap(removeButtons.at(1));
      await tester.pump();

      expect(find.text('1'), findsOneWidget);
    });

    testWidgets('cannot decrement below zero', (WidgetTester tester) async {
      final reactionWithZeroDelay = ReactionWithDelayModel(
        service: testService,
        reaction: testReaction,
        delayInSeconds: 0,
      );

      await tester.pumpWidget(
        buildTestWidget(
          DelayPickerDialog(reactionWithDelay: reactionWithZeroDelay, onDelaySet: (_) {}),
        ),
      );

      final removeButtons = find.byIcon(Icons.remove);
      await tester.tap(removeButtons.first);
      await tester.pump();

      expect(find.text('0'), findsNWidgets(4));
    });

    testWidgets('cannot increment beyond maximum for hours', (WidgetTester tester) async {
      final reactionWithMaxHours = ReactionWithDelayModel(
        service: testService,
        reaction: testReaction,
        delayInSeconds: 82800,
      );

      await tester.pumpWidget(
        buildTestWidget(
          DelayPickerDialog(reactionWithDelay: reactionWithMaxHours, onDelaySet: (_) {}),
        ),
      );

      final addButtons = find.byIcon(Icons.add);
      await tester.tap(addButtons.at(1));
      await tester.pump();

      expect(find.text('23'), findsOneWidget);
    });

    testWidgets('cannot increment beyond maximum for minutes and seconds', (
      WidgetTester tester,
    ) async {
      final reactionWithMaxTime = ReactionWithDelayModel(
        service: testService,
        reaction: testReaction,
        delayInSeconds: 3599,
      );

      await tester.pumpWidget(
        buildTestWidget(
          DelayPickerDialog(reactionWithDelay: reactionWithMaxTime, onDelaySet: (_) {}),
        ),
      );

      final addButtons = find.byIcon(Icons.add);
      await tester.tap(addButtons.at(2));
      await tester.pump();

      expect(find.text('59'), findsNWidgets(2));
    });

    testWidgets('updates total delay display when values change', (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestWidget(
          DelayPickerDialog(reactionWithDelay: testReactionWithDelay, onDelaySet: (_) {}),
        ),
      );

      expect(find.textContaining('2h 30m'), findsOneWidget);

      final addButtons = find.byIcon(Icons.add);
      await tester.tap(addButtons.at(1));
      await tester.pump();

      expect(find.textContaining('3h 30m'), findsOneWidget);
    });

    testWidgets('shows "No delay" when all values are zero', (WidgetTester tester) async {
      final reactionWithZeroDelay = ReactionWithDelayModel(
        service: testService,
        reaction: testReaction,
        delayInSeconds: 0,
      );

      await tester.pumpWidget(
        buildTestWidget(
          DelayPickerDialog(reactionWithDelay: reactionWithZeroDelay, onDelaySet: (_) {}),
        ),
      );

      expect(find.text('Total delay: No delay'), findsOneWidget);
    });

    testWidgets('calls onDelaySet and closes dialog when set delay is tapped', (
      WidgetTester tester,
    ) async {
      int? setDelayValue;

      await tester.pumpWidget(
        buildTestWidget(
          DelayPickerDialog(
            reactionWithDelay: testReactionWithDelay,
            onDelaySet: (delay) => setDelayValue = delay,
          ),
        ),
      );

      await tester.tap(find.text('Set Delay'));
      await tester.pumpAndSettle();

      expect(setDelayValue, 9000);
      expect(find.byType(AlertDialog), findsNothing);
    });

    testWidgets('closes dialog when cancel is tapped', (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestWidget(
          DelayPickerDialog(reactionWithDelay: testReactionWithDelay, onDelaySet: (_) {}),
        ),
      );

      await tester.tap(find.text('Cancel'));
      await tester.pumpAndSettle();

      expect(find.byType(AlertDialog), findsNothing);
    });

    testWidgets('has correct styling for input fields', (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestWidget(
          DelayPickerDialog(reactionWithDelay: testReactionWithDelay, onDelaySet: (_) {}),
        ),
      );

      final containers = tester.widgetList<Container>(find.byType(Container));
      bool foundBorderedContainer = false;
      for (final container in containers) {
        if (container.decoration is BoxDecoration) {
          final decoration = container.decoration as BoxDecoration;
          if (decoration.border != null) {
            foundBorderedContainer = true;
            break;
          }
        }
      }
      expect(foundBorderedContainer, true);
    });

    testWidgets('total delay info box has correct styling', (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestWidget(
          DelayPickerDialog(reactionWithDelay: testReactionWithDelay, onDelaySet: (_) {}),
        ),
      );

      final infoContainer = tester.widget<Container>(
        find
            .ancestor(of: find.byIcon(Icons.info_outline), matching: find.byType(Container))
            .last,
      );

      final decoration = infoContainer.decoration as BoxDecoration;
      expect(decoration.borderRadius, BorderRadius.circular(12));
    });

    testWidgets('set delay button has correct styling', (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestWidget(
          DelayPickerDialog(reactionWithDelay: testReactionWithDelay, onDelaySet: (_) {}),
        ),
      );

      final button = tester.widget<ElevatedButton>(
        find.ancestor(of: find.text('Set Delay'), matching: find.byType(ElevatedButton)),
      );
      final buttonStyle = button.style!;
      expect(buttonStyle.backgroundColor!.resolve({}), AppColors.areaBlue3);
      expect(buttonStyle.foregroundColor!.resolve({}), Colors.white);
    });

    testWidgets('formats complex delay correctly', (WidgetTester tester) async {
      final complexDelay = ReactionWithDelayModel(
        service: testService,
        reaction: testReaction,
        delayInSeconds: 95445,
      );

      await tester.pumpWidget(
        buildTestWidget(
          DelayPickerDialog(reactionWithDelay: complexDelay, onDelaySet: (_) {}),
        ),
      );

      expect(find.textContaining('Total delay: 1d 2h 30m 45s'), findsOneWidget);
    });
  });
}
