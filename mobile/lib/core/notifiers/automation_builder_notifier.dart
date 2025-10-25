import 'package:flutter/foundation.dart';
import 'package:area/models/action_models.dart';
import 'package:area/models/service_models.dart';
import 'package:area/models/reaction_with_delay_model.dart';

class AutomationBuilderNotifier extends ChangeNotifier {
  ActionModel? _selectedAction;
  ServiceModel? _selectedService;
  List<ReactionWithDelayModel> _selectedReactionsWithDelay = [];
  final Map<String, dynamic> _actionConfig = {};

  ActionModel? get selectedAction => _selectedAction;
  ServiceModel? get selectedService => _selectedService;
  List<ReactionWithDelayModel> get selectedReactionsWithDelay =>
      List.unmodifiable(_selectedReactionsWithDelay);
  Map<String, dynamic> get actionConfig => Map.unmodifiable(_actionConfig);

  bool get hasAction => _selectedAction != null;
  bool get hasReactions => _selectedReactionsWithDelay.isNotEmpty;
  bool get isComplete => hasAction && hasReactions;
  bool get isConfigurationComplete => hasAction && hasReactions && _isConfigurationValid();

  bool _isConfigurationValid() {
    if (_selectedAction != null && !_selectedAction!.validateConfig(_actionConfig)) {
      return false;
    }

    for (final reaction in _selectedReactionsWithDelay) {
      if (!reaction.isConfigValid) {
        return false;
      }
    }

    return true;
  }

  void setAction(ActionModel action, ServiceModel service) {
    _selectedAction = action;
    _selectedService = service;
    _actionConfig.clear();

    if (action.configSchema != null) {
      for (final field in action.configSchema!.fields) {
        if (field.defaultValue != null) {
          _actionConfig[field.name] = field.defaultValue;
        }
      }
    }

    notifyListeners();
  }

  void clearAction() {
    _selectedAction = null;
    _selectedService = null;
    _actionConfig.clear();
    notifyListeners();
  }

  void setActionConfigValue(String fieldName, dynamic value) {
    _actionConfig[fieldName] = value;
    notifyListeners();
  }

  dynamic getActionConfigValue(String fieldName) {
    return _actionConfig[fieldName];
  }

  void updateReactionConfig(int index, Map<String, dynamic> config) {
    if (index >= 0 && index < _selectedReactionsWithDelay.length) {
      _selectedReactionsWithDelay[index] = _selectedReactionsWithDelay[index].copyWith(
        config: config,
      );
      notifyListeners();
    }
  }

  void setReactionConfigValue(int reactionIndex, String fieldName, dynamic value) {
    if (reactionIndex >= 0 && reactionIndex < _selectedReactionsWithDelay.length) {
      _selectedReactionsWithDelay[reactionIndex] =
          _selectedReactionsWithDelay[reactionIndex].setConfigValue(fieldName, value);
      notifyListeners();
    }
  }

  void addReaction(ReactionWithDelayModel reaction) {
    _selectedReactionsWithDelay.add(reaction);
    notifyListeners();
  }

  void removeReaction(int index) {
    if (index >= 0 && index < _selectedReactionsWithDelay.length) {
      _selectedReactionsWithDelay.removeAt(index);
      notifyListeners();
    }
  }

  void clearReactions() {
    _selectedReactionsWithDelay.clear();
    notifyListeners();
  }

  void clearAll() {
    _selectedAction = null;
    _selectedService = null;
    _selectedReactionsWithDelay.clear();
    _actionConfig.clear();
    notifyListeners();
  }

  void initialize({
    ActionModel? action,
    ServiceModel? service,
    List<ReactionWithDelayModel>? reactions,
  }) {
    _selectedAction = action;
    _selectedService = service;
    _selectedReactionsWithDelay = reactions ?? [];
    notifyListeners();
  }

  Map<String, dynamic> getState() {
    return {
      'hasAction': hasAction,
      'hasReactions': hasReactions,
      'isComplete': isComplete,
      'isConfigurationComplete': isConfigurationComplete,
      'actionName': _selectedAction?.name,
      'serviceName': _selectedService?.name,
      'reactionsCount': _selectedReactionsWithDelay.length,
      'actionConfigValid': _selectedAction?.validateConfig(_actionConfig) ?? true,
      'actionConfig': _actionConfig,
    };
  }

  Map<String, dynamic> getApiData(String name, String description) {
    if (!isConfigurationComplete) {
      throw StateError('Automation configuration is not complete');
    }

    return {
      'name': name,
      'description': description,
      'action': {'type': _selectedAction!.id, 'config': _actionConfig},
      'reactions': _selectedReactionsWithDelay.map((reactionWithDelay) {
        return {
          'type': reactionWithDelay.reaction.id,
          'config': reactionWithDelay.config,
          'delay': reactionWithDelay.delayInSeconds,
        };
      }).toList(),
      'is_active': true,
    };
  }

  List<String> getValidationErrors() {
    final errors = <String>[];

    if (_selectedAction == null) {
      errors.add('No action selected');
    } else if (!_selectedAction!.validateConfig(_actionConfig)) {
      errors.add('Action configuration is incomplete');
      for (final field in _selectedAction!.requiredConfigFields) {
        if (!_actionConfig.containsKey(field.name) || _actionConfig[field.name] == null) {
          errors.add('Action field "${field.label}" is required');
        }
      }
    }

    if (_selectedReactionsWithDelay.isEmpty) {
      errors.add('No reactions added');
    } else {
      for (int i = 0; i < _selectedReactionsWithDelay.length; i++) {
        final reaction = _selectedReactionsWithDelay[i];
        if (!reaction.isConfigValid) {
          errors.add('Reaction ${i + 1} configuration is incomplete');
          for (final field in reaction.reaction.requiredConfigFields) {
            if (!reaction.config.containsKey(field.name) ||
                reaction.config[field.name] == null) {
              errors.add('Reaction ${i + 1} field "${field.label}" is required');
            }
          }
        }
      }
    }

    return errors;
  }
}
