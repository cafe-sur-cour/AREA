import 'package:flutter/foundation.dart';
import 'package:area/models/action_models.dart';
import 'package:area/models/service_models.dart';
import 'package:area/models/reaction_with_delay_model.dart';

class AutomationBuilderNotifier extends ChangeNotifier {
  ActionModel? _selectedAction;
  ServiceModel? _selectedService;
  List<ReactionWithDelayModel> _selectedReactionsWithDelay = [];

  ActionModel? get selectedAction => _selectedAction;
  ServiceModel? get selectedService => _selectedService;
  List<ReactionWithDelayModel> get selectedReactionsWithDelay =>
      List.unmodifiable(_selectedReactionsWithDelay);

  bool get hasAction => _selectedAction != null;
  bool get hasReactions => _selectedReactionsWithDelay.isNotEmpty;
  bool get isComplete => hasAction && hasReactions;

  void setAction(ActionModel action, ServiceModel service) {
    _selectedAction = action;
    _selectedService = service;
    notifyListeners();
  }

  void clearAction() {
    _selectedAction = null;
    _selectedService = null;
    notifyListeners();
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

  // Get current state summary (useful for debugging)
  Map<String, dynamic> getState() {
    return {
      'hasAction': hasAction,
      'hasReactions': hasReactions,
      'isComplete': isComplete,
      'actionName': _selectedAction?.name,
      'serviceName': _selectedService?.name,
      'reactionsCount': _selectedReactionsWithDelay.length,
    };
  }
}
