import 'package:flutter_test/flutter_test.dart';
import 'package:area/models/service_models.dart';

void main() {
  group('ServiceModel', () {
    test('should create ServiceModel with required parameters', () {
      final service = ServiceModel(
        id: 'service1',
        name: 'Test Service',
        description: 'A test service',
        color: '#FF0000',
      );

      expect(service.id, 'service1');
      expect(service.name, 'Test Service');
      expect(service.description, 'A test service');
      expect(service.color, '#FF0000');
      expect(service.version, null);
      expect(service.icon, null);
    });

    test('should create ServiceModel with all parameters', () {
      final service = ServiceModel(
        id: 'service1',
        name: 'Test Service',
        description: 'A test service',
        version: '1.0.0',
        color: '#FF0000',
        icon: 'service_icon.png',
      );

      expect(service.id, 'service1');
      expect(service.name, 'Test Service');
      expect(service.description, 'A test service');
      expect(service.version, '1.0.0');
      expect(service.color, '#FF0000');
      expect(service.icon, 'service_icon.png');
    });

    test('fromJson should create ServiceModel from minimal JSON', () {
      final json = {
        'id': 'service1',
        'name': 'Test Service',
        'description': 'A test service',
        'color': '#FF0000',
      };

      final service = ServiceModel.fromJson(json);

      expect(service.id, 'service1');
      expect(service.name, 'Test Service');
      expect(service.description, 'A test service');
      expect(service.color, '#FF0000');
      expect(service.version, null);
      expect(service.icon, null);
    });

    test('fromJson should create ServiceModel with all fields', () {
      final json = {
        'id': 'service1',
        'name': 'Test Service',
        'description': 'A test service',
        'version': '1.0.0',
        'color': '#FF0000',
        'icon': 'service_icon.png',
      };

      final service = ServiceModel.fromJson(json);

      expect(service.id, 'service1');
      expect(service.name, 'Test Service');
      expect(service.description, 'A test service');
      expect(service.version, '1.0.0');
      expect(service.color, '#FF0000');
      expect(service.icon, 'service_icon.png');
    });

    test('fromJson should extract color and icon from actions metadata', () {
      final json = {
        'id': 'service1',
        'name': 'Test Service',
        'description': 'A test service',
        'actions': [
          {
            'id': 'action1',
            'metadata': {'color': '#00FF00', 'icon': 'action_icon.png'},
          },
        ],
      };

      final service = ServiceModel.fromJson(json);

      expect(service.color, '#00FF00');
      expect(service.icon, 'action_icon.png');
    });

    test(
      'fromJson should extract color and icon from reactions metadata when actions dont have them',
      () {
        final json = {
          'id': 'service1',
          'name': 'Test Service',
          'description': 'A test service',
          'actions': [{}],
          'reactions': [
            {
              'id': 'reaction1',
              'metadata': {'color': '#0000FF', 'icon': 'reaction_icon.png'},
            },
          ],
        };

        final service = ServiceModel.fromJson(json);

        expect(service.color, '#0000FF');
        expect(service.icon, 'reaction_icon.png');
      },
    );

    test('fromJson should use default color when no color found in metadata', () {
      final json = {
        'id': 'service1',
        'name': 'Test Service',
        'description': 'A test service',
        'actions': [{}],
        'reactions': [{}],
      };

      final service = ServiceModel.fromJson(json);

      expect(service.color, '#0175C2');
    });

    test('fromJson should prioritize actions metadata over reactions', () {
      final json = {
        'id': 'service1',
        'name': 'Test Service',
        'description': 'A test service',
        'actions': [
          {
            'id': 'action1',
            'metadata': {'color': '#FF0000', 'icon': 'action_icon.png'},
          },
        ],
        'reactions': [
          {
            'id': 'reaction1',
            'metadata': {'color': '#00FF00', 'icon': 'reaction_icon.png'},
          },
        ],
      };

      final service = ServiceModel.fromJson(json);

      expect(service.color, '#FF0000');
      expect(service.icon, 'action_icon.png');
    });

    test('fromJson should handle empty actions and reactions arrays', () {
      final json = {
        'id': 'service1',
        'name': 'Test Service',
        'description': 'A test service',
        'actions': [],
        'reactions': [],
      };

      final service = ServiceModel.fromJson(json);

      expect(service.color, '#0175C2');
      expect(service.icon, null);
    });

    test('fromJson should handle missing actions and reactions', () {
      final json = {'id': 'service1', 'name': 'Test Service', 'description': 'A test service'};

      final service = ServiceModel.fromJson(json);

      expect(service.color, '#0175C2');
      expect(service.icon, null);
    });

    test('fromJson should handle null description', () {
      final json = {
        'id': 'service1',
        'name': 'Test Service',
        'description': null,
        'color': '#FF0000',
      };

      final service = ServiceModel.fromJson(json);

      expect(service.description, '');
    });

    test('toJson should convert ServiceModel to JSON', () {
      final service = ServiceModel(
        id: 'service1',
        name: 'Test Service',
        description: 'A test service',
        version: '1.0.0',
        color: '#FF0000',
        icon: 'service_icon.png',
      );

      final json = service.toJson();

      expect(json['id'], 'service1');
      expect(json['name'], 'Test Service');
      expect(json['description'], 'A test service');
      expect(json['version'], '1.0.0');
      expect(json['color'], '#FF0000');
      expect(json['icon'], 'service_icon.png');
    });

    test('toJson should handle null optional fields', () {
      final service = ServiceModel(
        id: 'service1',
        name: 'Test Service',
        description: 'A test service',
        color: '#FF0000',
      );

      final json = service.toJson();

      expect(json['id'], 'service1');
      expect(json['name'], 'Test Service');
      expect(json['description'], 'A test service');
      expect(json['version'], null);
      expect(json['color'], '#FF0000');
      expect(json['icon'], null);
    });
  });
}
