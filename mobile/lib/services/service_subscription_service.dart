import 'dart:convert';
import 'package:area/core/constants/app_constants.dart';
import 'package:area/services/secure_storage.dart';
import 'package:http/http.dart' as http;

class ServiceInfo {
  final String id;
  final String name;
  final String description;
  final String version;
  final String icon;
  final bool isSubscribed;
  final bool oauthConnected;
  final bool canCreateWebhooks;
  final String subscribeEndpoint;
  final String statusEndpoint;
  final String loginStatusEndpoint;
  final String unsubscribeEndpoint;

  ServiceInfo({
    required this.id,
    required this.name,
    required this.description,
    required this.version,
    required this.icon,
    required this.isSubscribed,
    required this.oauthConnected,
    required this.canCreateWebhooks,
    required this.subscribeEndpoint,
    required this.statusEndpoint,
    required this.loginStatusEndpoint,
    required this.unsubscribeEndpoint,
  });

  factory ServiceInfo.fromJson(Map<String, dynamic> json) {
    return ServiceInfo(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      version: json['version'] ?? '',
      icon: json['icon'] ?? '',
      isSubscribed: json['isSubscribed'] ?? false,
      oauthConnected: json['oauthConnected'] ?? false,
      canCreateWebhooks: json['canCreateWebhooks'] ?? false,
      subscribeEndpoint: json['endpoints']?['subscribe'] ?? '',
      statusEndpoint: json['endpoints']?['status'] ?? '',
      loginStatusEndpoint: json['endpoints']?['loginStatus'] ?? '',
      unsubscribeEndpoint: json['endpoints']?['unsubscribe'] ?? '',
    );
  }
}

class ServiceStatus {
  final bool subscribed;
  final bool oauthConnected;
  final bool canCreateWebhooks;
  final DateTime? subscribedAt;
  final String? message;

  ServiceStatus({
    required this.subscribed,
    required this.oauthConnected,
    required this.canCreateWebhooks,
    this.subscribedAt,
    this.message,
  });

  factory ServiceStatus.fromJson(Map<String, dynamic> json) {
    return ServiceStatus(
      subscribed: json['subscribed'] ?? false,
      oauthConnected: json['oauth_connected'] ?? false,
      canCreateWebhooks: json['can_create_webhooks'] ?? false,
      subscribedAt: json['subscribed_at'] != null
          ? DateTime.tryParse(json['subscribed_at'])
          : null,
      message: json['message'],
    );
  }
}

class ServiceSubscriptionService {
  static Map<String, String> _getServiceRoutes(String serviceId) {
    if (serviceId.toLowerCase() == 'timer') {
      return {
        'subscribe': 'api/auth/timer/subscribe',
        'status': 'api/services/timer/subscribe/status',
        'loginStatus': '',
        'unsubscribe': '',
        'login': '',
      };
    }

    return {
      'subscribe': 'api/auth/$serviceId/subscribe',
      'status': 'api/$serviceId/subscribe/status',
      'loginStatus': 'api/$serviceId/login/status',
      'unsubscribe': 'api/$serviceId/unsubscribe',
      'login': 'api/auth/$serviceId/login',
    };
  }

  static Future<List<ServiceInfo>> getAllServices(String backendAddress) async {
    try {
      final jwt = await getJwt();
      if (jwt == null) throw Exception('No JWT token found');

      final response = await http.get(
        Uri.parse('$backendAddress${AppRoutes.services}'),
        headers: {'Authorization': 'Bearer $jwt', 'Content-Type': 'application/json'},
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to fetch services from backend: ${response.statusCode}');
      }

      final data = json.decode(response.body);
      final List<dynamic> services = data['services'] ?? [];

      List<ServiceInfo> serviceInfoList = [];
      for (var service in services) {
        serviceInfoList.add(ServiceInfo.fromJson(service));
      }
      return serviceInfoList;
    } catch (e) {
      throw Exception('Error fetching services: $e');
    }
  }

  static Future<List<ServiceInfo>> getSubscribedServices(String backendAddress) async {
    try {
      final jwt = await getJwt();
      if (jwt == null) throw Exception('No JWT token found');

      final response = await http.get(
        Uri.parse('$backendAddress${AppRoutes.servicesSubscribed}'),
        headers: {'Authorization': 'Bearer $jwt', 'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> services = data['services'] ?? [];
        return services.map((service) => ServiceInfo.fromJson(service)).toList();
      } else {
        throw Exception('Failed to load subscribed services');
      }
    } catch (e) {
      throw Exception('Error loading subscribed services: $e');
    }
  }

  static Future<ServiceStatus> getServiceStatus(
    String backendAddress,
    String serviceId,
  ) async {
    try {
      final jwt = await getJwt();
      if (jwt == null) throw Exception('No JWT token found');

      final routes = _getServiceRoutes(serviceId);
      final statusEndpoint = routes['status']!;

      final response = await http.get(
        Uri.parse('$backendAddress$statusEndpoint'),
        headers: {'Authorization': 'Bearer $jwt', 'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200 || response.statusCode == 404) {
        final data = json.decode(response.body);
        return ServiceStatus.fromJson(data);
      } else {
        throw Exception('Failed to check service status');
      }
    } catch (e) {
      throw Exception('Error checking service status: $e');
    }
  }

  static Future<bool> getOAuthStatus(String backendAddress, String serviceId) async {
    try {
      final jwt = await getJwt();
      if (jwt == null) throw Exception('No JWT token found');

      final routes = _getServiceRoutes(serviceId);
      final loginStatusEndpoint = routes['loginStatus']!;

      if (loginStatusEndpoint.isEmpty) {
        return true;
      }

      final response = await http.get(
        Uri.parse('$backendAddress$loginStatusEndpoint'),
        headers: {'Authorization': 'Bearer $jwt', 'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['connected'] ?? false;
      } else {
        return false;
      }
    } catch (e) {
      return false;
    }
  }

  static String getSubscriptionUrl(String backendAddress, String serviceId) {
    final routes = _getServiceRoutes(serviceId);
    final subscribeEndpoint = routes['subscribe']!;
    return '$backendAddress$subscribeEndpoint?is_mobile=true';
  }

  static Future<bool> unsubscribeFromService(String backendAddress, String serviceId) async {
    try {
      final jwt = await getJwt();
      if (jwt == null) throw Exception('No JWT token found');

      final routes = _getServiceRoutes(serviceId);
      final unsubscribeEndpoint = routes['unsubscribe']!;

      if (unsubscribeEndpoint.isEmpty) {
        throw Exception('Unsubscribe not supported for this service');
      }

      final response = await http.post(
        Uri.parse('$backendAddress$unsubscribeEndpoint'),
        headers: {'Authorization': 'Bearer $jwt', 'Content-Type': 'application/json'},
      );

      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
}
