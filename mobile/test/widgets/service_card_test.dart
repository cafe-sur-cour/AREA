import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:area/widgets/service_card.dart';
import 'package:area/models/service_models.dart';
import 'package:area/core/constants/app_colors.dart';

void main() {
  group('ServiceCard', () {
    late ServiceModel testService;

    setUp(() {
      testService = ServiceModel(
        id: 'test-service',
        name: 'Test Service',
        description: 'A test service for automation',
        color: '#FF5733',
        icon: 'https://example.com/icon.png',
      );
    });

    testWidgets('renders service name and description', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: ServiceCard(service: testService)),
        ),
      );

      expect(find.text('Test Service'), findsOneWidget);
      expect(find.text('A test service for automation'), findsOneWidget);
    });

    testWidgets('renders with Card widget', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: ServiceCard(service: testService)),
        ),
      );

      expect(find.byType(Card), findsOneWidget);
    });

    testWidgets('renders InkWell for tap handling', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: ServiceCard(service: testService)),
        ),
      );

      expect(find.byType(InkWell), findsOneWidget);
    });

    testWidgets('calls onTap when tapped', (WidgetTester tester) async {
      bool tapped = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ServiceCard(service: testService, onTap: () => tapped = true),
          ),
        ),
      );

      await tester.tap(find.byType(InkWell));
      expect(tapped, true);
    });

    testWidgets('displays icon container', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: ServiceCard(service: testService)),
        ),
      );

      expect(find.byType(Container), findsWidgets);
    });

    testWidgets('renders service name with correct styling', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: ServiceCard(service: testService)),
        ),
      );

      final textWidget = tester.widget<Text>(find.text('Test Service'));
      expect(textWidget.style!.fontFamily, 'Montserrat');
      expect(textWidget.style!.fontSize, 16);
      expect(textWidget.style!.fontWeight, FontWeight.bold);
      expect(textWidget.style!.color, AppColors.areaBlack);
    });

    testWidgets('renders description with correct styling', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: ServiceCard(service: testService)),
        ),
      );

      final textWidget = tester.widget<Text>(find.text('A test service for automation'));
      expect(textWidget.style!.fontFamily, 'Montserrat');
      expect(textWidget.style!.fontSize, 12);
      expect(textWidget.style!.color, AppColors.areaDarkGray);
    });

    testWidgets('handles service without description', (WidgetTester tester) async {
      final serviceWithoutDesc = ServiceModel(
        id: 'test-service',
        name: 'Test Service',
        description: '',
        color: '#FF5733',
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: ServiceCard(service: serviceWithoutDesc)),
        ),
      );

      expect(find.text('Test Service'), findsOneWidget);
      expect(find.text(''), findsNothing);
    });

    testWidgets('handles service without icon', (WidgetTester tester) async {
      final serviceWithoutIcon = ServiceModel(
        id: 'test-service',
        name: 'Test Service',
        description: 'A test service',
        color: '#FF5733',
        icon: null,
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: ServiceCard(service: serviceWithoutIcon)),
        ),
      );

      expect(find.byIcon(Icons.web), findsOneWidget);
    });

    testWidgets('applies gradient background', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: ServiceCard(service: testService)),
        ),
      );

      final containers = tester.widgetList<Container>(find.byType(Container));
      bool hasGradientDecoration = false;
      for (final container in containers) {
        if (container.decoration is BoxDecoration) {
          final decoration = container.decoration as BoxDecoration;
          if (decoration.gradient != null) {
            hasGradientDecoration = true;
            break;
          }
        }
      }
      expect(hasGradientDecoration, true);
    });
  });
}
