import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:area/services/api_service.dart';
import 'package:area/services/secure_http_client.dart';
import 'package:area/services/secure_storage.dart';
import 'package:area/models/service_models.dart';
import 'package:area/models/action_models.dart';
import 'package:area/models/reaction_models.dart';

class MockFlutterSecureStorage extends Mock implements FlutterSecureStorage {}

void main() {
  group('ApiService', () {
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

    group('fetchServicesWithActions', () {
      test('fetches services with actions successfully', () async {
        final mockResponse = {
          'services': [
            {
              'id': 'service1',
              'name': 'Test Service',
              'description': 'A test service',
              'version': '1.0',
              'icon': 'icon.png',
            },
          ],
        };

        SecureHttpClient.setClient(
          MockClient((request) async {
            expect(request.url.toString(), contains('services/actions'));
            expect(request.headers['Authorization'], equals('Bearer test-jwt-token'));
            expect(request.headers['Content-Type'], contains('application/json'));
            return http.Response(jsonEncode(mockResponse), 200);
          }),
        );

        final services = await ApiService.fetchServicesWithActions(testBackendAddress);

        expect(services, isA<List<ServiceModel>>());
        expect(services.length, equals(1));
        expect(services[0].id, equals('service1'));
        expect(services[0].name, equals('Test Service'));
      });

      test('fetches multiple services successfully', () async {
        final mockResponse = {
          'services': [
            {
              'id': 'service1',
              'name': 'Service 1',
              'description': 'First service',
              'version': '1.0',
              'icon': 'icon1.png',
            },
            {
              'id': 'service2',
              'name': 'Service 2',
              'description': 'Second service',
              'version': '2.0',
              'icon': 'icon2.png',
            },
          ],
        };

        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response(jsonEncode(mockResponse), 200);
          }),
        );

        final services = await ApiService.fetchServicesWithActions(testBackendAddress);

        expect(services.length, equals(2));
        expect(services[0].id, equals('service1'));
        expect(services[1].id, equals('service2'));
      });

      test('fetches services without JWT token', () async {
        when(() => mockSecureStorage.read(key: 'jwt')).thenAnswer((_) async => null);

        final mockResponse = {
          'services': [
            {
              'id': 'service1',
              'name': 'Test Service',
              'description': 'A test service',
              'version': '1.0',
              'icon': 'icon.png',
            },
          ],
        };

        SecureHttpClient.setClient(
          MockClient((request) async {
            expect(request.headers['Authorization'], isNull);
            return http.Response(jsonEncode(mockResponse), 200);
          }),
        );

        final services = await ApiService.fetchServicesWithActions(testBackendAddress);

        expect(services.length, equals(1));
      });

      test('handles empty services list', () async {
        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response(jsonEncode({'services': []}), 200);
          }),
        );

        final services = await ApiService.fetchServicesWithActions(testBackendAddress);

        expect(services, isEmpty);
      });

      test('throws exception on error response', () async {
        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response(jsonEncode({'error': 'Services not found'}), 404);
          }),
        );

        expect(
          () => ApiService.fetchServicesWithActions(testBackendAddress),
          throwsA(isA<Exception>()),
        );
      });

      test('throws exception on server error', () async {
        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response(jsonEncode({'error': 'Internal server error'}), 500);
          }),
        );

        expect(
          () => ApiService.fetchServicesWithActions(testBackendAddress),
          throwsA(isA<Exception>()),
        );
      });
    });

    group('fetchServiceActions', () {
      test('fetches actions for a service successfully', () async {
        final mockResponse = {
          'actions': [
            {
              'id': 'action1',
              'name': 'Test Action',
              'description': 'A test action',
              'parameters': [],
            },
          ],
        };

        SecureHttpClient.setClient(
          MockClient((request) async {
            expect(request.url.toString(), contains('services/service1/actions'));
            expect(request.headers['Authorization'], equals('Bearer test-jwt-token'));
            return http.Response(jsonEncode(mockResponse), 200);
          }),
        );

        final actions = await ApiService.fetchServiceActions(testBackendAddress, 'service1');

        expect(actions, isA<List<ActionModel>>());
        expect(actions.length, equals(1));
        expect(actions[0].id, equals('action1'));
        expect(actions[0].name, equals('Test Action'));
      });

      test('fetches multiple actions successfully', () async {
        final mockResponse = {
          'actions': [
            {
              'id': 'action1',
              'name': 'Action 1',
              'description': 'First action',
              'parameters': [],
            },
            {
              'id': 'action2',
              'name': 'Action 2',
              'description': 'Second action',
              'parameters': [],
            },
          ],
        };

        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response(jsonEncode(mockResponse), 200);
          }),
        );

        final actions = await ApiService.fetchServiceActions(testBackendAddress, 'service1');

        expect(actions.length, equals(2));
        expect(actions[0].id, equals('action1'));
        expect(actions[1].id, equals('action2'));
      });

      test('handles empty actions list', () async {
        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response(jsonEncode({'actions': []}), 200);
          }),
        );

        final actions = await ApiService.fetchServiceActions(testBackendAddress, 'service1');

        expect(actions, isEmpty);
      });

      test('throws exception on error response', () async {
        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response(jsonEncode({'error': 'Actions not found'}), 404);
          }),
        );

        expect(
          () => ApiService.fetchServiceActions(testBackendAddress, 'service1'),
          throwsA(isA<Exception>()),
        );
      });
    });

    group('fetchServicesWithReactions', () {
      test('fetches services with reactions successfully', () async {
        final mockResponse = {
          'services': [
            {
              'id': 'service1',
              'name': 'Test Service',
              'description': 'A test service',
              'version': '1.0',
              'icon': 'icon.png',
            },
          ],
        };

        SecureHttpClient.setClient(
          MockClient((request) async {
            expect(request.url.toString(), contains('services/reactions'));
            expect(request.headers['Authorization'], equals('Bearer test-jwt-token'));
            return http.Response(jsonEncode(mockResponse), 200);
          }),
        );

        final services = await ApiService.fetchServicesWithReactions(testBackendAddress);

        expect(services, isA<List<ServiceModel>>());
        expect(services.length, equals(1));
        expect(services[0].id, equals('service1'));
      });

      test('handles empty services list', () async {
        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response(jsonEncode({'services': []}), 200);
          }),
        );

        final services = await ApiService.fetchServicesWithReactions(testBackendAddress);

        expect(services, isEmpty);
      });

      test('throws exception on error response', () async {
        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response(jsonEncode({'error': 'Services not found'}), 404);
          }),
        );

        expect(
          () => ApiService.fetchServicesWithReactions(testBackendAddress),
          throwsA(isA<Exception>()),
        );
      });
    });

    group('fetchServiceReactions', () {
      test('fetches reactions for a service successfully', () async {
        final mockResponse = {
          'reactions': [
            {
              'id': 'reaction1',
              'name': 'Test Reaction',
              'description': 'A test reaction',
              'parameters': [],
            },
          ],
        };

        SecureHttpClient.setClient(
          MockClient((request) async {
            expect(request.url.toString(), contains('services/service1/reactions'));
            expect(request.headers['Authorization'], equals('Bearer test-jwt-token'));
            return http.Response(jsonEncode(mockResponse), 200);
          }),
        );

        final reactions = await ApiService.fetchServiceReactions(
          testBackendAddress,
          'service1',
        );

        expect(reactions, isA<List<ReactionModel>>());
        expect(reactions.length, equals(1));
        expect(reactions[0].id, equals('reaction1'));
        expect(reactions[0].name, equals('Test Reaction'));
      });

      test('fetches multiple reactions successfully', () async {
        final mockResponse = {
          'reactions': [
            {
              'id': 'reaction1',
              'name': 'Reaction 1',
              'description': 'First reaction',
              'parameters': [],
            },
            {
              'id': 'reaction2',
              'name': 'Reaction 2',
              'description': 'Second reaction',
              'parameters': [],
            },
          ],
        };

        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response(jsonEncode(mockResponse), 200);
          }),
        );

        final reactions = await ApiService.fetchServiceReactions(
          testBackendAddress,
          'service1',
        );

        expect(reactions.length, equals(2));
        expect(reactions[0].id, equals('reaction1'));
        expect(reactions[1].id, equals('reaction2'));
      });

      test('handles empty reactions list', () async {
        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response(jsonEncode({'reactions': []}), 200);
          }),
        );

        final reactions = await ApiService.fetchServiceReactions(
          testBackendAddress,
          'service1',
        );

        expect(reactions, isEmpty);
      });

      test('throws exception on error response', () async {
        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response(jsonEncode({'error': 'Reactions not found'}), 404);
          }),
        );

        expect(
          () => ApiService.fetchServiceReactions(testBackendAddress, 'service1'),
          throwsA(isA<Exception>()),
        );
      });
    });

    group('fetchActionById', () {
      test('fetches action by ID successfully', () async {
        final mockResponse = {
          'id': 'action1',
          'name': 'Test Action',
          'description': 'A test action',
          'parameters': [],
        };

        SecureHttpClient.setClient(
          MockClient((request) async {
            expect(request.url.toString(), contains('services/service1/actions/action1'));
            expect(request.headers['Authorization'], equals('Bearer test-jwt-token'));
            return http.Response(jsonEncode(mockResponse), 200);
          }),
        );

        final action = await ApiService.fetchActionById(
          testBackendAddress,
          'service1',
          'action1',
        );

        expect(action, isA<ActionModel>());
        expect(action.id, equals('action1'));
        expect(action.name, equals('Test Action'));
      });

      test('throws exception when action not found', () async {
        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response(jsonEncode({'error': 'Action not found'}), 404);
          }),
        );

        expect(
          () => ApiService.fetchActionById(testBackendAddress, 'service1', 'action1'),
          throwsA(isA<Exception>()),
        );
      });

      test('throws exception on server error', () async {
        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response(jsonEncode({'error': 'Internal server error'}), 500);
          }),
        );

        expect(
          () => ApiService.fetchActionById(testBackendAddress, 'service1', 'action1'),
          throwsA(isA<Exception>()),
        );
      });
    });

    group('fetchReactionById', () {
      test('fetches reaction by ID successfully', () async {
        final mockResponse = {
          'id': 'reaction1',
          'name': 'Test Reaction',
          'description': 'A test reaction',
          'parameters': [],
        };

        SecureHttpClient.setClient(
          MockClient((request) async {
            expect(request.url.toString(), contains('services/service1/reactions/reaction1'));
            expect(request.headers['Authorization'], equals('Bearer test-jwt-token'));
            return http.Response(jsonEncode(mockResponse), 200);
          }),
        );

        final reaction = await ApiService.fetchReactionById(
          testBackendAddress,
          'service1',
          'reaction1',
        );

        expect(reaction, isA<ReactionModel>());
        expect(reaction.id, equals('reaction1'));
        expect(reaction.name, equals('Test Reaction'));
      });

      test('throws exception when reaction not found', () async {
        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response(jsonEncode({'error': 'Reaction not found'}), 404);
          }),
        );

        expect(
          () => ApiService.fetchReactionById(testBackendAddress, 'service1', 'reaction1'),
          throwsA(isA<Exception>()),
        );
      });

      test('throws exception on server error', () async {
        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response(jsonEncode({'error': 'Internal server error'}), 500);
          }),
        );

        expect(
          () => ApiService.fetchReactionById(testBackendAddress, 'service1', 'reaction1'),
          throwsA(isA<Exception>()),
        );
      });
    });

    group('JWT Authorization', () {
      test('includes JWT token in request headers when available', () async {
        when(() => mockSecureStorage.read(key: 'jwt')).thenAnswer((_) async => 'my-token');

        SecureHttpClient.setClient(
          MockClient((request) async {
            expect(request.headers['Authorization'], equals('Bearer my-token'));
            return http.Response(jsonEncode({'services': []}), 200);
          }),
        );

        await ApiService.fetchServicesWithActions(testBackendAddress);
      });

      test('does not include Authorization header when JWT is null', () async {
        when(() => mockSecureStorage.read(key: 'jwt')).thenAnswer((_) async => null);

        SecureHttpClient.setClient(
          MockClient((request) async {
            expect(request.headers.containsKey('Authorization'), isFalse);
            return http.Response(jsonEncode({'services': []}), 200);
          }),
        );

        await ApiService.fetchServicesWithActions(testBackendAddress);
      });
    });

    group('Error handling', () {
      test('handles malformed JSON response', () async {
        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response('Invalid JSON', 200);
          }),
        );

        expect(
          () => ApiService.fetchServicesWithActions(testBackendAddress),
          throwsA(isA<FormatException>()),
        );
      });

      test('handles network error', () async {
        SecureHttpClient.setClient(
          MockClient((request) async {
            throw Exception('Network error');
          }),
        );

        expect(
          () => ApiService.fetchServicesWithActions(testBackendAddress),
          throwsA(isA<Exception>()),
        );
      });

      test('handles unauthorized error', () async {
        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response(jsonEncode({'error': 'Unauthorized'}), 401);
          }),
        );

        expect(
          () => ApiService.fetchServicesWithActions(testBackendAddress),
          throwsA(isA<Exception>()),
        );
      });

      test('handles forbidden error', () async {
        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response(jsonEncode({'error': 'Forbidden'}), 403);
          }),
        );

        expect(
          () => ApiService.fetchServicesWithActions(testBackendAddress),
          throwsA(isA<Exception>()),
        );
      });
    });
  });
}
