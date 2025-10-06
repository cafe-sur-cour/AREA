import 'dart:convert';

import 'package:area/core/constants/app_constants.dart';
import 'package:area/models/action_models.dart';
import 'package:area/models/reaction_with_delay_model.dart';
import 'package:area/services/secure_http_client.dart';
import 'package:area/services/secure_storage.dart';

class ApiMappingActionReaction {
  static Future<void> createAutomation(
    String backendAddress,
    String name,
    String description,
    ActionModel action,
    List<ReactionWithDelayModel> reactions, {
    Map<String, dynamic>? actionConfig,
    List<Map<String, dynamic>>? reactionConfigs,
  }) async {
    final jwt = await getJwt();
    final url = Uri.parse("$backendAddress${AppRoutes.createAutomation}");

    final headers = <String, String>{'Content-Type': 'application/json'};

    if (jwt != null) {
      headers['Authorization'] = 'Bearer $jwt';
    }

    final client = SecureHttpClient.getClient();

    final finalActionConfig = actionConfig ?? <String, dynamic>{};

    final reactionsData = <Map<String, dynamic>>[];
    for (int i = 0; i < reactions.length; i++) {
      final reactionWithDelay = reactions[i];
      final reaction = reactionWithDelay.reaction;
      final delay = reactionWithDelay.delayInSeconds;

      final reactionConfig = (reactionConfigs != null && i < reactionConfigs.length)
          ? reactionConfigs[i]
          : <String, dynamic>{};

      reactionsData.add({'type': reaction.id, 'config': reactionConfig, 'delay': delay});
    }

    final data = {
      'name': name,
      'description': description,
      'action': {'type': action.id, 'config': finalActionConfig},
      'reactions': reactionsData,
      'is_active': true,
    };

    final response = await client.post(url, headers: headers, body: jsonEncode(data));

    if (response.statusCode != 200 && response.statusCode != 201) {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Failed to create automation');
    }
  }
}
