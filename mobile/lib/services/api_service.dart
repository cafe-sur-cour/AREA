import 'dart:convert';
import 'package:area/models/service_models.dart';
import 'package:area/models/action_models.dart';
import 'package:area/models/reaction_models.dart';
import 'package:area/core/constants/app_constants.dart';
import 'package:area/services/secure_storage.dart';
import 'package:area/services/secure_http_client.dart';

class ApiService {
  static Future<List<ServiceModel>> fetchServicesWithActions(String backendAddress) async {
    final jwt = await getJwt();
    final url = Uri.parse("$backendAddress${AppRoutes.servicesWithActions}");

    final headers = <String, String>{'Content-Type': 'application/json'};

    if (jwt != null) {
      headers['Authorization'] = 'Bearer $jwt';
    }

    final client = SecureHttpClient.getClient();
    final response = await client.get(url, headers: headers);

    if (response.statusCode != 200) {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to fetch services');
    }

    final data = jsonDecode(response.body);
    final List<dynamic> servicesJson = data['services'] ?? data ?? [];

    return servicesJson.map((json) => ServiceModel.fromJson(json)).toList();
  }

  static Future<List<ActionModel>> fetchServiceActions(
    String backendAddress,
    String serviceId,
  ) async {
    final jwt = await getJwt();
    final url = Uri.parse("$backendAddress${AppRoutes.actionsFromService(serviceId)}");

    final headers = <String, String>{'Content-Type': 'application/json'};
    if (jwt != null) {
      headers['Authorization'] = 'Bearer $jwt';
    }

    final client = SecureHttpClient.getClient();
    final response = await client.get(url, headers: headers);

    if (response.statusCode != 200) {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to fetch actions');
    }

    final data = jsonDecode(response.body);
    final List<dynamic> actionsJson = data['actions'] ?? data ?? [];

    return actionsJson.map((json) => ActionModel.fromJson(json)).toList();
  }

  static Future<List<ServiceModel>> fetchServicesWithReactions(String backendAddress) async {
    final jwt = await getJwt();
    final url = Uri.parse("$backendAddress${AppRoutes.servicesWithReactions}");

    final headers = <String, String>{'Content-Type': 'application/json'};

    if (jwt != null) {
      headers['Authorization'] = 'Bearer $jwt';
    }

    final client = SecureHttpClient.getClient();
    final response = await client.get(url, headers: headers);

    if (response.statusCode != 200) {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to fetch services');
    }

    final data = jsonDecode(response.body);
    final List<dynamic> servicesJson = data['services'] ?? data ?? [];

    return servicesJson.map((json) => ServiceModel.fromJson(json)).toList();
  }

  static Future<List<ReactionModel>> fetchServiceReactions(
    String backendAddress,
    String serviceId,
  ) async {
    final jwt = await getJwt();
    final url = Uri.parse("$backendAddress${AppRoutes.reactionsFromService(serviceId)}");

    final headers = <String, String>{'Content-Type': 'application/json'};

    if (jwt != null) {
      headers['Authorization'] = 'Bearer $jwt';
    }

    final client = SecureHttpClient.getClient();
    final response = await client.get(url, headers: headers);

    if (response.statusCode != 200) {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to fetch reactions');
    }

    final data = jsonDecode(response.body);
    final List<dynamic> reactionsJson = data['reactions'] ?? data ?? [];

    return reactionsJson.map((json) => ReactionModel.fromJson(json)).toList();
  }
}
