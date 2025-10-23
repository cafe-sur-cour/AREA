import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:area/services/secure_http_client.dart';

void main() {
  group('SecureHttpClient', () {
    setUp(() {
      SecureHttpClient.reset();
    });

    tearDown(() {
      SecureHttpClient.reset();
    });

    group('getClient', () {
      test('returns a client instance', () {
        final client = SecureHttpClient.getClient();

        expect(client, isNotNull);
        expect(client, isA<http.Client>());
      });

      test('returns the same instance when called multiple times', () {
        final client1 = SecureHttpClient.getClient();
        final client2 = SecureHttpClient.getClient();

        expect(client1, same(client2));
      });

      test('returns a client that allows self-signed certificates by default', () {
        final client = SecureHttpClient.getClient();

        expect(client, isNotNull);
      });

      test('returns a client with custom allowSelfSigned parameter', () {
        final client = SecureHttpClient.getClient(allowSelfSigned: false);

        expect(client, isNotNull);
        expect(client, isA<http.Client>());
      });

      test('returns the same client when allowSelfSigned is explicitly true', () {
        final client1 = SecureHttpClient.getClient(allowSelfSigned: true);
        final client2 = SecureHttpClient.getClient(allowSelfSigned: true);

        expect(client1, same(client2));
      });
    });

    group('setClient', () {
      test('sets a custom client', () {
        final mockClient = MockClient((request) async {
          return http.Response('test', 200);
        });

        SecureHttpClient.setClient(mockClient);
        final client = SecureHttpClient.getClient();

        expect(client, same(mockClient));
      });

      test('replaces existing client with custom client', () {
        final firstClient = SecureHttpClient.getClient();
        final mockClient = MockClient((request) async {
          return http.Response('test', 200);
        });

        SecureHttpClient.setClient(mockClient);
        final secondClient = SecureHttpClient.getClient();

        expect(firstClient, isNot(same(secondClient)));
        expect(secondClient, same(mockClient));
      });

      test('custom client is used for requests', () async {
        final mockClient = MockClient((request) async {
          return http.Response('custom response', 200);
        });

        SecureHttpClient.setClient(mockClient);
        final client = SecureHttpClient.getClient();

        final response = await client.get(Uri.parse('http://test.com'));

        expect(response.statusCode, equals(200));
        expect(response.body, equals('custom response'));
      });
    });

    group('reset', () {
      test('resets the client to null', () {
        final client1 = SecureHttpClient.getClient();
        expect(client1, isNotNull);

        SecureHttpClient.reset();

        final client2 = SecureHttpClient.getClient();
        expect(client2, isNotNull);
        expect(client1, isNot(same(client2)));
      });

      test('allows setting a new client after reset', () {
        final firstClient = SecureHttpClient.getClient();
        SecureHttpClient.reset();

        final mockClient = MockClient((request) async {
          return http.Response('test', 200);
        });
        SecureHttpClient.setClient(mockClient);

        final newClient = SecureHttpClient.getClient();

        expect(newClient, same(mockClient));
        expect(newClient, isNot(same(firstClient)));
      });

      test('can be called multiple times safely', () {
        SecureHttpClient.getClient();
        SecureHttpClient.reset();
        SecureHttpClient.reset();
        SecureHttpClient.reset();

        final client = SecureHttpClient.getClient();
        expect(client, isNotNull);
      });
    });

    group('close', () {
      test('closes the client and sets it to null', () {
        final client1 = SecureHttpClient.getClient();
        expect(client1, isNotNull);

        SecureHttpClient.close();

        final client2 = SecureHttpClient.getClient();
        expect(client2, isNotNull);
        expect(client1, isNot(same(client2)));
      });

      test('can be called even when client is null', () {
        SecureHttpClient.reset();
        SecureHttpClient.close();

        final client = SecureHttpClient.getClient();
        expect(client, isNotNull);
      });

      test('closes and recreates client properly', () {
        final client1 = SecureHttpClient.getClient();
        SecureHttpClient.close();
        final client2 = SecureHttpClient.getClient();
        SecureHttpClient.close();
        final client3 = SecureHttpClient.getClient();

        expect(client1, isNot(same(client2)));
        expect(client2, isNot(same(client3)));
        expect(client1, isNot(same(client3)));
      });
    });

    group('client lifecycle', () {
      test('maintains singleton pattern', () {
        final client1 = SecureHttpClient.getClient();
        final client2 = SecureHttpClient.getClient();
        final client3 = SecureHttpClient.getClient();

        expect(client1, same(client2));
        expect(client2, same(client3));
      });

      test('creates new instance after reset', () {
        final client1 = SecureHttpClient.getClient();
        SecureHttpClient.reset();
        final client2 = SecureHttpClient.getClient();

        expect(client1, isNot(same(client2)));
      });

      test('custom client persists across multiple getClient calls', () {
        final mockClient = MockClient((request) async {
          return http.Response('test', 200);
        });

        SecureHttpClient.setClient(mockClient);
        final client1 = SecureHttpClient.getClient();
        final client2 = SecureHttpClient.getClient();

        expect(client1, same(mockClient));
        expect(client2, same(mockClient));
      });

      test('reset removes custom client', () {
        final mockClient = MockClient((request) async {
          return http.Response('test', 200);
        });

        SecureHttpClient.setClient(mockClient);
        final client1 = SecureHttpClient.getClient();
        expect(client1, same(mockClient));

        SecureHttpClient.reset();
        final client2 = SecureHttpClient.getClient();

        expect(client2, isNot(same(mockClient)));
      });
    });

    group('HTTP operations with mock client', () {
      test('performs GET request successfully', () async {
        final mockClient = MockClient((request) async {
          expect(request.method, equals('GET'));
          return http.Response('GET response', 200);
        });

        SecureHttpClient.setClient(mockClient);
        final client = SecureHttpClient.getClient();

        final response = await client.get(Uri.parse('http://test.com/api'));

        expect(response.statusCode, equals(200));
        expect(response.body, equals('GET response'));
      });

      test('performs POST request successfully', () async {
        final mockClient = MockClient((request) async {
          expect(request.method, equals('POST'));
          return http.Response('POST response', 201);
        });

        SecureHttpClient.setClient(mockClient);
        final client = SecureHttpClient.getClient();

        final response = await client.post(Uri.parse('http://test.com/api'));

        expect(response.statusCode, equals(201));
        expect(response.body, equals('POST response'));
      });

      test('performs PUT request successfully', () async {
        final mockClient = MockClient((request) async {
          expect(request.method, equals('PUT'));
          return http.Response('PUT response', 200);
        });

        SecureHttpClient.setClient(mockClient);
        final client = SecureHttpClient.getClient();

        final response = await client.put(Uri.parse('http://test.com/api'));

        expect(response.statusCode, equals(200));
        expect(response.body, equals('PUT response'));
      });

      test('performs DELETE request successfully', () async {
        final mockClient = MockClient((request) async {
          expect(request.method, equals('DELETE'));
          return http.Response('', 204);
        });

        SecureHttpClient.setClient(mockClient);
        final client = SecureHttpClient.getClient();

        final response = await client.delete(Uri.parse('http://test.com/api'));

        expect(response.statusCode, equals(204));
      });

      test('handles request with headers', () async {
        final mockClient = MockClient((request) async {
          expect(request.headers['Authorization'], equals('Bearer test-token'));
          expect(request.headers['Content-Type'], contains('application/json'));
          return http.Response('success', 200);
        });

        SecureHttpClient.setClient(mockClient);
        final client = SecureHttpClient.getClient();

        final response = await client.get(
          Uri.parse('http://test.com/api'),
          headers: {'Authorization': 'Bearer test-token', 'Content-Type': 'application/json'},
        );

        expect(response.statusCode, equals(200));
      });

      test('handles error responses', () async {
        final mockClient = MockClient((request) async {
          return http.Response('{"error": "Not found"}', 404);
        });

        SecureHttpClient.setClient(mockClient);
        final client = SecureHttpClient.getClient();

        final response = await client.get(Uri.parse('http://test.com/api'));

        expect(response.statusCode, equals(404));
        expect(response.body, contains('error'));
      });

      test('handles server errors', () async {
        final mockClient = MockClient((request) async {
          return http.Response('{"error": "Internal server error"}', 500);
        });

        SecureHttpClient.setClient(mockClient);
        final client = SecureHttpClient.getClient();

        final response = await client.get(Uri.parse('http://test.com/api'));

        expect(response.statusCode, equals(500));
        expect(response.body, contains('error'));
      });
    });
  });
}
