import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:area/services/api_mapping_action_reaction.dart';
import 'package:area/services/secure_http_client.dart';
import 'package:area/services/secure_storage.dart';
import 'package:area/models/action_models.dart';
import 'package:area/models/reaction_models.dart';
import 'package:area/models/reaction_with_delay_model.dart';
import 'package:area/models/automation_models.dart';
import 'package:area/models/service_models.dart';

class MockFlutterSecureStorage extends Mock implements FlutterSecureStorage {}

void main() {
  group('ApiMappingActionReaction', () {
    late MockFlutterSecureStorage mockSecureStorage;
    const testBackendAddress = 'http://test.com/';

    setUp(() {
      mockSecureStorage = MockFlutterSecureStorage();
      setSecureStorage(mockSecureStorage);
      when(() => mockSecureStorage.read(key: 'jwt')).thenAnswer((_) async => 'test-jwt-token');
    });

    tearDown(() {
      SecureHttpClient.reset();
    });

    group('createAutomation', () {
      test('creates automation successfully', () async {
        final action = ActionModel(
          id: 'action1',
          name: 'Test Action',
          description: 'Action description',
        );

        final service = ServiceModel(
          id: 'service1',
          name: 'Test Service',
          description: 'Service description',
          color: '#0175C2',
        );

        final reaction = ReactionModel(
          id: 'reaction1',
          name: 'Test Reaction',
          description: 'Reaction description',
        );

        final reactionWithDelay = ReactionWithDelayModel(
          reaction: reaction,
          service: service,
          delayInSeconds: 0,
        );

        SecureHttpClient.setClient(
          MockClient((request) async {
            expect(request.url.toString(), contains('api/mappings'));
            expect(request.method, equals('POST'));
            expect(request.headers['Authorization'], equals('Bearer test-jwt-token'));
            expect(request.headers['Content-Type'], contains('application/json'));

            final body = jsonDecode(request.body);
            expect(body['name'], equals('Test Automation'));
            expect(body['description'], equals('Test Description'));
            expect(body['action']['type'], equals('action1'));
            expect(body['reactions'][0]['type'], equals('reaction1'));
            expect(body['is_active'], equals(true));

            return http.Response(jsonEncode({'id': 1}), 201);
          }),
        );

        await ApiMappingActionReaction.createAutomation(
          testBackendAddress,
          'Test Automation',
          'Test Description',
          action,
          [reactionWithDelay],
        );
      });

      test('creates automation with custom configuration', () async {
        final action = ActionModel(
          id: 'action1',
          name: 'Test Action',
          description: 'Action description',
        );

        final service = ServiceModel(
          id: 'service1',
          name: 'Test Service',
          description: 'Service description',
          color: '#0175C2',
        );

        final reaction = ReactionModel(
          id: 'reaction1',
          name: 'Test Reaction',
          description: 'Reaction description',
        );

        final reactionWithDelay = ReactionWithDelayModel(
          reaction: reaction,
          service: service,
          delayInSeconds: 60,
        );

        final actionConfig = {'key': 'value'};
        final reactionConfigs = [
          {'config_key': 'config_value'},
        ];

        SecureHttpClient.setClient(
          MockClient((request) async {
            final body = jsonDecode(request.body);
            expect(body['action']['config'], equals(actionConfig));
            expect(body['reactions'][0]['config'], equals(reactionConfigs[0]));
            expect(body['reactions'][0]['delay'], equals(60));

            return http.Response(jsonEncode({'id': 1}), 201);
          }),
        );

        await ApiMappingActionReaction.createAutomation(
          testBackendAddress,
          'Test Automation',
          'Test Description',
          action,
          [reactionWithDelay],
          actionConfig: actionConfig,
          reactionConfigs: reactionConfigs,
        );
      });

      test('creates automation with multiple reactions', () async {
        final action = ActionModel(
          id: 'action1',
          name: 'Test Action',
          description: 'Action description',
        );

        final service = ServiceModel(
          id: 'service1',
          name: 'Test Service',
          description: 'Service description',
          color: '#0175C2',
        );

        final reactions = [
          ReactionWithDelayModel(
            reaction: ReactionModel(
              id: 'reaction1',
              name: 'Reaction 1',
              description: 'First reaction',
            ),
            service: service,
            delayInSeconds: 0,
          ),
          ReactionWithDelayModel(
            reaction: ReactionModel(
              id: 'reaction2',
              name: 'Reaction 2',
              description: 'Second reaction',
            ),
            service: service,
            delayInSeconds: 120,
          ),
        ];

        SecureHttpClient.setClient(
          MockClient((request) async {
            final body = jsonDecode(request.body);
            expect(body['reactions'].length, equals(2));
            expect(body['reactions'][0]['type'], equals('reaction1'));
            expect(body['reactions'][1]['type'], equals('reaction2'));
            expect(body['reactions'][1]['delay'], equals(120));

            return http.Response(jsonEncode({'id': 1}), 201);
          }),
        );

        await ApiMappingActionReaction.createAutomation(
          testBackendAddress,
          'Test Automation',
          'Test Description',
          action,
          reactions,
        );
      });

      test('throws exception when creation fails', () async {
        final action = ActionModel(
          id: 'action1',
          name: 'Test Action',
          description: 'Action description',
        );

        final service = ServiceModel(
          id: 'service1',
          name: 'Test Service',
          description: 'Service description',
          color: '#0175C2',
        );

        final reaction = ReactionModel(
          id: 'reaction1',
          name: 'Test Reaction',
          description: 'Reaction description',
        );

        final reactionWithDelay = ReactionWithDelayModel(
          reaction: reaction,
          service: service,
          delayInSeconds: 0,
        );

        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response(jsonEncode({'error': 'Creation failed'}), 400);
          }),
        );

        expect(
          () => ApiMappingActionReaction.createAutomation(
            testBackendAddress,
            'Test Automation',
            'Test Description',
            action,
            [reactionWithDelay],
          ),
          throwsA(isA<Exception>()),
        );
      });

      test('includes JWT token in request headers', () async {
        final action = ActionModel(
          id: 'action1',
          name: 'Test Action',
          description: 'Action description',
        );

        final service = ServiceModel(
          id: 'service1',
          name: 'Test Service',
          description: 'Service description',
          color: '#0175C2',
        );

        final reaction = ReactionModel(
          id: 'reaction1',
          name: 'Test Reaction',
          description: 'Reaction description',
        );

        final reactionWithDelay = ReactionWithDelayModel(
          reaction: reaction,
          service: service,
          delayInSeconds: 0,
        );

        when(() => mockSecureStorage.read(key: 'jwt')).thenAnswer((_) async => 'custom-token');

        SecureHttpClient.setClient(
          MockClient((request) async {
            expect(request.headers['Authorization'], equals('Bearer custom-token'));
            return http.Response(jsonEncode({'id': 1}), 201);
          }),
        );

        await ApiMappingActionReaction.createAutomation(
          testBackendAddress,
          'Test Automation',
          'Test Description',
          action,
          [reactionWithDelay],
        );
      });
    });

    group('getAutomations', () {
      test('fetches automations successfully', () async {
        final mockResponse = {
          'mappings': [
            {
              'id': 1,
              'name': 'Test Automation',
              'description': 'Test description',
              'action': {'type': 'action1', 'config': {}},
              'reactions': [
                {'type': 'reaction1', 'config': {}, 'delay': 0},
              ],
              'is_active': true,
              'created_by': 1,
              'created_at': '2024-01-01T00:00:00Z',
              'updated_at': '2024-01-01T00:00:00Z',
            },
          ],
        };

        SecureHttpClient.setClient(
          MockClient((request) async {
            expect(request.url.toString(), contains('api/mappings'));
            expect(request.method, equals('GET'));
            expect(request.headers['Authorization'], equals('Bearer test-jwt-token'));
            return http.Response(jsonEncode(mockResponse), 200);
          }),
        );

        final automations = await ApiMappingActionReaction.getAutomations(testBackendAddress);

        expect(automations, isA<List<AutomationModel>>());
        expect(automations.length, equals(1));
        expect(automations[0].id, equals(1));
        expect(automations[0].name, equals('Test Automation'));
      });

      test('fetches multiple automations', () async {
        final mockResponse = {
          'mappings': [
            {
              'id': 1,
              'name': 'Automation 1',
              'description': 'First automation',
              'action': {'type': 'action1', 'config': {}},
              'reactions': [
                {'type': 'reaction1', 'config': {}, 'delay': 0},
              ],
              'is_active': true,
              'created_by': 1,
              'created_at': '2024-01-01T00:00:00Z',
              'updated_at': '2024-01-01T00:00:00Z',
            },
            {
              'id': 2,
              'name': 'Automation 2',
              'description': 'Second automation',
              'action': {'type': 'action2', 'config': {}},
              'reactions': [
                {'type': 'reaction2', 'config': {}, 'delay': 60},
              ],
              'is_active': false,
              'created_by': 1,
              'created_at': '2024-01-02T00:00:00Z',
              'updated_at': '2024-01-02T00:00:00Z',
            },
          ],
        };

        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response(jsonEncode(mockResponse), 200);
          }),
        );

        final automations = await ApiMappingActionReaction.getAutomations(testBackendAddress);

        expect(automations.length, equals(2));
        expect(automations[0].id, equals(1));
        expect(automations[1].id, equals(2));
      });

      test('returns empty list when no automations', () async {
        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response(jsonEncode({'mappings': []}), 200);
          }),
        );

        final automations = await ApiMappingActionReaction.getAutomations(testBackendAddress);

        expect(automations, isEmpty);
      });

      test('throws exception when JWT is missing', () async {
        when(() => mockSecureStorage.read(key: 'jwt')).thenAnswer((_) async => null);

        expect(
          () => ApiMappingActionReaction.getAutomations(testBackendAddress),
          throwsA(isA<String>()),
        );
      });

      test('throws exception on error response', () async {
        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response(jsonEncode({'error': 'Failed to fetch'}), 500);
          }),
        );

        expect(
          () => ApiMappingActionReaction.getAutomations(testBackendAddress),
          throwsA(isA<Exception>()),
        );
      });
    });

    group('deleteAutomation', () {
      test('deletes automation successfully', () async {
        SecureHttpClient.setClient(
          MockClient((request) async {
            expect(request.url.toString(), contains('api/mappings/1'));
            expect(request.method, equals('DELETE'));
            expect(request.headers['Authorization'], equals('Bearer test-jwt-token'));
            return http.Response('', 204);
          }),
        );

        await ApiMappingActionReaction.deleteAutomation(testBackendAddress, 1);
      });

      test('deletes automation with 200 status', () async {
        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response(jsonEncode({'message': 'Deleted'}), 200);
          }),
        );

        await ApiMappingActionReaction.deleteAutomation(testBackendAddress, 1);
      });

      test('throws exception when deletion fails', () async {
        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response(jsonEncode({'error': 'Not found'}), 404);
          }),
        );

        expect(
          () => ApiMappingActionReaction.deleteAutomation(testBackendAddress, 1),
          throwsA(isA<Exception>()),
        );
      });

      test('throws exception on server error', () async {
        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response(jsonEncode({'error': 'Server error'}), 500);
          }),
        );

        expect(
          () => ApiMappingActionReaction.deleteAutomation(testBackendAddress, 1),
          throwsA(isA<Exception>()),
        );
      });
    });

    group('activateAutomation', () {
      test('activates automation successfully', () async {
        SecureHttpClient.setClient(
          MockClient((request) async {
            expect(request.url.toString(), contains('api/mappings/1/activate'));
            expect(request.method, equals('PUT'));
            expect(request.headers['Authorization'], equals('Bearer test-jwt-token'));
            return http.Response(
              jsonEncode({
                'mapping': {'updated_at': '2024-01-01T00:00:00Z'},
              }),
              200,
            );
          }),
        );

        final updatedAt = await ApiMappingActionReaction.activateAutomation(
          testBackendAddress,
          1,
        );

        expect(updatedAt, equals('2024-01-01T00:00:00Z'));
      });

      test('throws exception when activation fails', () async {
        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response(jsonEncode({'error': 'Activation failed'}), 400);
          }),
        );

        expect(
          () => ApiMappingActionReaction.activateAutomation(testBackendAddress, 1),
          throwsA(isA<Exception>()),
        );
      });

      test('throws exception when automation not found', () async {
        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response(jsonEncode({'error': 'Not found'}), 404);
          }),
        );

        expect(
          () => ApiMappingActionReaction.activateAutomation(testBackendAddress, 1),
          throwsA(isA<Exception>()),
        );
      });
    });

    group('deactivateAutomation', () {
      test('deactivates automation successfully', () async {
        SecureHttpClient.setClient(
          MockClient((request) async {
            expect(request.url.toString(), contains('api/mappings/1/deactivate'));
            expect(request.method, equals('PUT'));
            expect(request.headers['Authorization'], equals('Bearer test-jwt-token'));
            return http.Response(
              jsonEncode({
                'mapping': {'updated_at': '2024-01-01T00:00:00Z'},
              }),
              200,
            );
          }),
        );

        final updatedAt = await ApiMappingActionReaction.deactivateAutomation(
          testBackendAddress,
          1,
        );

        expect(updatedAt, equals('2024-01-01T00:00:00Z'));
      });

      test('throws exception when deactivation fails', () async {
        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response(jsonEncode({'error': 'Deactivation failed'}), 400);
          }),
        );

        expect(
          () => ApiMappingActionReaction.deactivateAutomation(testBackendAddress, 1),
          throwsA(isA<Exception>()),
        );
      });

      test('throws exception when automation not found', () async {
        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response(jsonEncode({'error': 'Not found'}), 404);
          }),
        );

        expect(
          () => ApiMappingActionReaction.deactivateAutomation(testBackendAddress, 1),
          throwsA(isA<Exception>()),
        );
      });
    });

    group('JWT Authorization', () {
      test('includes JWT token in all requests', () async {
        when(() => mockSecureStorage.read(key: 'jwt')).thenAnswer((_) async => 'my-token');

        SecureHttpClient.setClient(
          MockClient((request) async {
            expect(request.headers['Authorization'], equals('Bearer my-token'));
            return http.Response(jsonEncode({'mappings': []}), 200);
          }),
        );

        await ApiMappingActionReaction.getAutomations(testBackendAddress);
      });

      test('handles null JWT token gracefully for creation', () async {
        when(() => mockSecureStorage.read(key: 'jwt')).thenAnswer((_) async => null);

        final action = ActionModel(
          id: 'action1',
          name: 'Test Action',
          description: 'Action description',
        );

        final service = ServiceModel(
          id: 'service1',
          name: 'Test Service',
          description: 'Service description',
          color: '#0175C2',
        );

        final reaction = ReactionModel(
          id: 'reaction1',
          name: 'Test Reaction',
          description: 'Reaction description',
        );

        final reactionWithDelay = ReactionWithDelayModel(
          reaction: reaction,
          service: service,
          delayInSeconds: 0,
        );

        SecureHttpClient.setClient(
          MockClient((request) async {
            expect(request.headers.containsKey('Authorization'), isFalse);
            return http.Response(jsonEncode({'id': 1}), 201);
          }),
        );

        await ApiMappingActionReaction.createAutomation(
          testBackendAddress,
          'Test Automation',
          'Test Description',
          action,
          [reactionWithDelay],
        );
      });
    });

    group('Error handling', () {
      test('handles network errors', () async {
        SecureHttpClient.setClient(
          MockClient((request) async {
            throw Exception('Network error');
          }),
        );

        expect(
          () => ApiMappingActionReaction.getAutomations(testBackendAddress),
          throwsA(isA<Exception>()),
        );
      });

      test('handles malformed JSON in response', () async {
        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response('Invalid JSON', 200);
          }),
        );

        expect(
          () => ApiMappingActionReaction.getAutomations(testBackendAddress),
          throwsA(isA<FormatException>()),
        );
      });
    });
  });
}
