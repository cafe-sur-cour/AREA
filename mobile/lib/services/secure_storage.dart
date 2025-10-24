import 'package:flutter_secure_storage/flutter_secure_storage.dart';

FlutterSecureStorage _secureStorage = FlutterSecureStorage();

Future<void> saveJwt(String token) async {
  await _secureStorage.write(key: "jwt", value: token);
}

Future<String?> getJwt() async {
  return await _secureStorage.read(key: "jwt");
}

Future<void> deleteJwt() async {
  await _secureStorage.delete(key: "jwt");
}

void setSecureStorage(FlutterSecureStorage storage) {
  _secureStorage = storage;
}
