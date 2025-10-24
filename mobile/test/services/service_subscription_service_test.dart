import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:area/services/service_subscription_service.dart';
import 'package:area/services/secure_http_client.dart';
import 'package:area/services/secure_storage.dart';

class MockFlutterSecureStorage extends Mock implements FlutterSecureStorage {}

void main() {
  group('ServiceSubscriptionService', () {
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

    group('ServiceInfo', () {
      test('creates ServiceInfo from JSON', () {
        final json = {
          'id': 'service1',
          'name': 'Test Service',
          'description': 'A test service',
          'version': '1.0',
          'icon': 'icon.png',
          'isSubscribed': true,
          'oauthConnected': true,
          'canCreateWebhooks': false,
          'endpoints': {
            'auth': '/auth',
            'status': '/status',
            'loginStatus': '/login-status',
            'subscribe': '/subscribe',
            'unsubscribe': '/unsubscribe',
          },
        };

        final serviceInfo = ServiceInfo.fromJson(json);

        expect(serviceInfo.id, equals('service1'));
        expect(serviceInfo.name, equals('Test Service'));
        expect(serviceInfo.description, equals('A test service'));
        expect(serviceInfo.version, equals('1.0'));
        expect(serviceInfo.icon, equals('icon.png'));
        expect(serviceInfo.isSubscribed, isTrue);
        expect(serviceInfo.oauthConnected, isTrue);
        expect(serviceInfo.canCreateWebhooks, isFalse);
        expect(serviceInfo.authEndpoint, equals('/auth'));
        expect(serviceInfo.statusEndpoint, equals('/status'));
        expect(serviceInfo.loginStatusEndpoint, equals('/login-status'));
        expect(serviceInfo.subscribeEndpoint, equals('/subscribe'));
        expect(serviceInfo.unsubscribeEndpoint, equals('/unsubscribe'));
      });

      test('creates ServiceInfo with default values', () {
        final json = <String, dynamic>{};

        final serviceInfo = ServiceInfo.fromJson(json);

        expect(serviceInfo.id, equals(''));
        expect(serviceInfo.name, equals(''));
        expect(serviceInfo.description, equals(''));
        expect(serviceInfo.version, equals(''));
        expect(serviceInfo.icon, equals(''));
        expect(serviceInfo.isSubscribed, isFalse);
        expect(serviceInfo.oauthConnected, isFalse);
        expect(serviceInfo.canCreateWebhooks, isFalse);
      });
    });

    group('ServiceStatus', () {
      test('creates ServiceStatus from JSON', () {
        final json = {
          'subscribed': true,
          'oauth_connected': true,
          'can_create_webhooks': true,
          'subscribed_at': '2024-01-01T00:00:00Z',
          'message': 'Success',
        };

        final status = ServiceStatus.fromJson(json);

        expect(status.subscribed, isTrue);
        expect(status.oauthConnected, isTrue);
        expect(status.canCreateWebhooks, isTrue);
        expect(status.subscribedAt, isNotNull);
        expect(status.message, equals('Success'));
      });

      test('creates ServiceStatus with default values', () {
        final json = <String, dynamic>{};

        final status = ServiceStatus.fromJson(json);

        expect(status.subscribed, isFalse);
        expect(status.oauthConnected, isFalse);
        expect(status.canCreateWebhooks, isFalse);
        expect(status.subscribedAt, isNull);
        expect(status.message, isNull);
      });

      test('handles invalid date in ServiceStatus', () {
        final json = {
          'subscribed': true,
          'oauth_connected': false,
          'can_create_webhooks': false,
          'subscribed_at': 'invalid-date',
        };

        final status = ServiceStatus.fromJson(json);

        expect(status.subscribedAt, isNull);
      });
    });

    group('getAllServices', () {
      test('fetches all services successfully', () async {
        final mockResponse = {
          'services': [
            {
              'id': 'service1',
              'name': 'Service 1',
              'description': 'First service',
              'version': '1.0',
              'icon': 'icon1.png',
              'isSubscribed': true,
              'oauthConnected': true,
              'canCreateWebhooks': false,
              'endpoints': {
                'auth': '/auth1',
                'status': '/status1',
                'loginStatus': '/login-status1',
                'subscribe': '/subscribe1',
                'unsubscribe': '/unsubscribe1',
              },
            },
            {
              'id': 'service2',
              'name': 'Service 2',
              'description': 'Second service',
              'version': '2.0',
              'icon': 'icon2.png',
              'isSubscribed': false,
              'oauthConnected': false,
              'canCreateWebhooks': true,
              'endpoints': {
                'auth': '/auth2',
                'status': '/status2',
                'loginStatus': '/login-status2',
                'subscribe': '/subscribe2',
                'unsubscribe': '/unsubscribe2',
              },
            },
          ],
        };

        SecureHttpClient.setClient(
          MockClient((request) async {
            expect(request.url.toString(), contains('api/services'));
            expect(request.method, equals('GET'));
            expect(request.headers['Authorization'], equals('Bearer test-jwt-token'));
            return http.Response(jsonEncode(mockResponse), 200);
          }),
        );

        final services = await ServiceSubscriptionService.getAllServices(testBackendAddress);

        expect(services, isA<List<ServiceInfo>>());
        expect(services.length, equals(2));
        expect(services[0].id, equals('service1'));
        expect(services[1].id, equals('service2'));
      });

      test('handles empty services list', () async {
        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response(jsonEncode({'services': []}), 200);
          }),
        );

        final services = await ServiceSubscriptionService.getAllServices(testBackendAddress);

        expect(services, isEmpty);
      });

      test('fetches services without JWT token', () async {
        when(() => mockSecureStorage.read(key: 'jwt')).thenAnswer((_) async => null);

        SecureHttpClient.setClient(
          MockClient((request) async {
            expect(request.headers.containsKey('Authorization'), isFalse);
            return http.Response(jsonEncode({'services': []}), 200);
          }),
        );

        final services = await ServiceSubscriptionService.getAllServices(testBackendAddress);

        expect(services, isEmpty);
      });

      test('throws exception on error response', () async {
        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response(jsonEncode({'error': 'Failed to fetch services'}), 500);
          }),
        );

        expect(
          () => ServiceSubscriptionService.getAllServices(testBackendAddress),
          throwsA(isA<Exception>()),
        );
      });
    });

    group('getSubscribedServices', () {
      test('fetches subscribed services successfully', () async {
        final mockResponse = {
          'services': [
            {
              'id': 'service1',
              'name': 'Service 1',
              'description': 'First service',
              'version': '1.0',
              'icon': 'icon1.png',
              'isSubscribed': true,
              'oauthConnected': true,
              'canCreateWebhooks': false,
              'endpoints': {
                'auth': '/auth1',
                'status': '/status1',
                'loginStatus': '/login-status1',
                'subscribe': '/subscribe1',
                'unsubscribe': '/unsubscribe1',
              },
            },
          ],
        };

        SecureHttpClient.setClient(
          MockClient((request) async {
            expect(request.url.toString(), contains('api/services/subscribed'));
            expect(request.method, equals('GET'));
            expect(request.headers['Authorization'], equals('Bearer test-jwt-token'));
            return http.Response(jsonEncode(mockResponse), 200);
          }),
        );

        final services = await ServiceSubscriptionService.getSubscribedServices(
          testBackendAddress,
        );

        expect(services, isA<List<ServiceInfo>>());
        expect(services.length, equals(1));
        expect(services[0].isSubscribed, isTrue);
      });

      test('handles empty subscribed services list', () async {
        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response(jsonEncode({'services': []}), 200);
          }),
        );

        final services = await ServiceSubscriptionService.getSubscribedServices(
          testBackendAddress,
        );

        expect(services, isEmpty);
      });

      test('throws exception on error response', () async {
        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response(jsonEncode({'error': 'Failed to fetch'}), 500);
          }),
        );

        expect(
          () => ServiceSubscriptionService.getSubscribedServices(testBackendAddress),
          throwsA(isA<Exception>()),
        );
      });
    });

    group('unsubscribeFromService', () {
      test('unsubscribes from service successfully', () async {
        final service = ServiceInfo(
          id: 'service1',
          name: 'Test Service',
          description: 'A test service',
          version: '1.0',
          icon: 'icon.png',
          isSubscribed: true,
          oauthConnected: true,
          canCreateWebhooks: false,
          authEndpoint: '/auth',
          statusEndpoint: '/status',
          loginStatusEndpoint: '/login-status',
          subscribeEndpoint: '/subscribe',
          unsubscribeEndpoint: '/unsubscribe',
        );

        SecureHttpClient.setClient(
          MockClient((request) async {
            expect(request.url.toString(), contains('api/unsubscribe'));
            expect(request.method, equals('POST'));
            expect(request.headers['Authorization'], equals('Bearer test-jwt-token'));
            return http.Response(jsonEncode({'message': 'Success'}), 200);
          }),
        );

        await ServiceSubscriptionService.unsubscribeFromService(testBackendAddress, service);
      });

      test('throws exception when unsubscribe fails', () async {
        final service = ServiceInfo(
          id: 'service1',
          name: 'Test Service',
          description: 'A test service',
          version: '1.0',
          icon: 'icon.png',
          isSubscribed: true,
          oauthConnected: true,
          canCreateWebhooks: false,
          authEndpoint: '/auth',
          statusEndpoint: '/status',
          loginStatusEndpoint: '/login-status',
          subscribeEndpoint: '/subscribe',
          unsubscribeEndpoint: '/unsubscribe',
        );

        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response(jsonEncode({'error': 'Unsubscribe failed'}), 400);
          }),
        );

        expect(
          () => ServiceSubscriptionService.unsubscribeFromService(testBackendAddress, service),
          throwsA(isA<Exception>()),
        );
      });
    });

    group('getServiceStatus', () {
      test('fetches service status successfully', () async {
        final service = ServiceInfo(
          id: 'service1',
          name: 'Test Service',
          description: 'A test service',
          version: '1.0',
          icon: 'icon.png',
          isSubscribed: true,
          oauthConnected: true,
          canCreateWebhooks: false,
          authEndpoint: '/auth',
          statusEndpoint: '/status',
          loginStatusEndpoint: '/login-status',
          subscribeEndpoint: '/subscribe',
          unsubscribeEndpoint: '/unsubscribe',
        );

        final mockResponse = {
          'subscribed': true,
          'oauth_connected': true,
          'can_create_webhooks': false,
          'subscribed_at': '2024-01-01T00:00:00Z',
        };

        SecureHttpClient.setClient(
          MockClient((request) async {
            expect(request.url.toString(), contains('api/status'));
            expect(request.method, equals('GET'));
            expect(request.headers['Authorization'], equals('Bearer test-jwt-token'));
            return http.Response(jsonEncode(mockResponse), 200);
          }),
        );

        final status = await ServiceSubscriptionService.getServiceStatus(
          testBackendAddress,
          service,
        );

        expect(status, isA<ServiceStatus>());
        expect(status.subscribed, isTrue);
        expect(status.oauthConnected, isTrue);
      });

      test('handles 404 response for service status', () async {
        final service = ServiceInfo(
          id: 'service1',
          name: 'Test Service',
          description: 'A test service',
          version: '1.0',
          icon: 'icon.png',
          isSubscribed: false,
          oauthConnected: false,
          canCreateWebhooks: false,
          authEndpoint: '/auth',
          statusEndpoint: '/status',
          loginStatusEndpoint: '/login-status',
          subscribeEndpoint: '/subscribe',
          unsubscribeEndpoint: '/unsubscribe',
        );

        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response(
              jsonEncode({
                'subscribed': false,
                'oauth_connected': false,
                'can_create_webhooks': false,
              }),
              404,
            );
          }),
        );

        final status = await ServiceSubscriptionService.getServiceStatus(
          testBackendAddress,
          service,
        );

        expect(status, isA<ServiceStatus>());
        expect(status.subscribed, isFalse);
      });

      test('throws exception on other error responses', () async {
        final service = ServiceInfo(
          id: 'service1',
          name: 'Test Service',
          description: 'A test service',
          version: '1.0',
          icon: 'icon.png',
          isSubscribed: false,
          oauthConnected: false,
          canCreateWebhooks: false,
          authEndpoint: '/auth',
          statusEndpoint: '/status',
          loginStatusEndpoint: '/login-status',
          subscribeEndpoint: '/subscribe',
          unsubscribeEndpoint: '/unsubscribe',
        );

        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response(jsonEncode({'error': 'Server error'}), 500);
          }),
        );

        expect(
          () => ServiceSubscriptionService.getServiceStatus(testBackendAddress, service),
          throwsA(isA<Exception>()),
        );
      });
    });

    group('getOAuthStatus', () {
      test('fetches OAuth status successfully', () async {
        final service = ServiceInfo(
          id: 'service1',
          name: 'Test Service',
          description: 'A test service',
          version: '1.0',
          icon: 'icon.png',
          isSubscribed: true,
          oauthConnected: true,
          canCreateWebhooks: false,
          authEndpoint: '/auth',
          statusEndpoint: '/status',
          loginStatusEndpoint: '/login-status',
          subscribeEndpoint: '/subscribe',
          unsubscribeEndpoint: '/unsubscribe',
        );

        SecureHttpClient.setClient(
          MockClient((request) async {
            expect(request.url.toString(), contains('api/login-status'));
            expect(request.method, equals('GET'));
            return http.Response(jsonEncode({'connected': true}), 200);
          }),
        );

        final status = await ServiceSubscriptionService.getOAuthStatus(
          testBackendAddress,
          service,
        );

        expect(status, isTrue);
      });

      test('returns true when login status endpoint is empty', () async {
        final service = ServiceInfo(
          id: 'service1',
          name: 'Test Service',
          description: 'A test service',
          version: '1.0',
          icon: 'icon.png',
          isSubscribed: true,
          oauthConnected: true,
          canCreateWebhooks: false,
          authEndpoint: '/auth',
          statusEndpoint: '/status',
          loginStatusEndpoint: '',
          subscribeEndpoint: '/subscribe',
          unsubscribeEndpoint: '/unsubscribe',
        );

        final status = await ServiceSubscriptionService.getOAuthStatus(
          testBackendAddress,
          service,
        );

        expect(status, isTrue);
      });

      test('returns false when OAuth is not connected', () async {
        final service = ServiceInfo(
          id: 'service1',
          name: 'Test Service',
          description: 'A test service',
          version: '1.0',
          icon: 'icon.png',
          isSubscribed: true,
          oauthConnected: false,
          canCreateWebhooks: false,
          authEndpoint: '/auth',
          statusEndpoint: '/status',
          loginStatusEndpoint: '/login-status',
          subscribeEndpoint: '/subscribe',
          unsubscribeEndpoint: '/unsubscribe',
        );

        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response(jsonEncode({'connected': false}), 200);
          }),
        );

        final status = await ServiceSubscriptionService.getOAuthStatus(
          testBackendAddress,
          service,
        );

        expect(status, isFalse);
      });

      test('returns false on error response', () async {
        final service = ServiceInfo(
          id: 'service1',
          name: 'Test Service',
          description: 'A test service',
          version: '1.0',
          icon: 'icon.png',
          isSubscribed: true,
          oauthConnected: true,
          canCreateWebhooks: false,
          authEndpoint: '/auth',
          statusEndpoint: '/status',
          loginStatusEndpoint: '/login-status',
          subscribeEndpoint: '/subscribe',
          unsubscribeEndpoint: '/unsubscribe',
        );

        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response(jsonEncode({'error': 'Failed'}), 500);
          }),
        );

        final status = await ServiceSubscriptionService.getOAuthStatus(
          testBackendAddress,
          service,
        );

        expect(status, isFalse);
      });
    });

    group('getSubscriptionUrl', () {
      test('returns correct subscription URL', () {
        final service = ServiceInfo(
          id: 'service1',
          name: 'Test Service',
          description: 'A test service',
          version: '1.0',
          icon: 'icon.png',
          isSubscribed: false,
          oauthConnected: false,
          canCreateWebhooks: false,
          authEndpoint: '/auth',
          statusEndpoint: '/status',
          loginStatusEndpoint: '/login-status',
          subscribeEndpoint: '/services/service1/subscribe',
          unsubscribeEndpoint: '/unsubscribe',
        );

        final url = ServiceSubscriptionService.getSubscriptionUrl(testBackendAddress, service);

        expect(
          url,
          equals('${testBackendAddress}api/services/service1/subscribe?is_mobile=true'),
        );
      });

      test('handles different subscribe endpoints', () {
        final service = ServiceInfo(
          id: 'service2',
          name: 'Another Service',
          description: 'Another test service',
          version: '2.0',
          icon: 'icon2.png',
          isSubscribed: false,
          oauthConnected: false,
          canCreateWebhooks: true,
          authEndpoint: '/auth',
          statusEndpoint: '/status',
          loginStatusEndpoint: '/login-status',
          subscribeEndpoint: '/custom/subscribe',
          unsubscribeEndpoint: '/unsubscribe',
        );

        final url = ServiceSubscriptionService.getSubscriptionUrl(testBackendAddress, service);

        expect(url, equals('${testBackendAddress}api/custom/subscribe?is_mobile=true'));
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
          () => ServiceSubscriptionService.getAllServices(testBackendAddress),
          throwsA(isA<Exception>()),
        );
      });

      test('handles malformed JSON response', () async {
        SecureHttpClient.setClient(
          MockClient((request) async {
            return http.Response('Invalid JSON', 200);
          }),
        );

        expect(
          () => ServiceSubscriptionService.getAllServices(testBackendAddress),
          throwsA(isA<FormatException>()),
        );
      });
    });
  });
}
