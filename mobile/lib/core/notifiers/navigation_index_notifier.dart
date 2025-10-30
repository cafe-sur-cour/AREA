import 'package:flutter/material.dart';

class NavigationIndexNotifier extends ChangeNotifier {
  int _navIndex = 0;

  int get navIndex => _navIndex;

  void setNavIndex(int newIndex) {
    if (_navIndex == newIndex) return;
    _navIndex = newIndex;
    notifyListeners();
  }
}
