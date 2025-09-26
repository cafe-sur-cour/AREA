import 'package:flutter/material.dart';

class BackendAddressNotifier extends ChangeNotifier {
  String? _backendAddress;

  String? get backendAddress => _backendAddress;

  void setBackendAddress(String? newAddress) {
    if (_backendAddress == newAddress) return;
    _backendAddress = newAddress;
    notifyListeners();
  }
}
