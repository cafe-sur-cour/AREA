import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:http/io_client.dart';

class SecureHttpClient {
  static http.Client? _client;

  static http.Client getClient({bool? allowSelfSigned}) {
    allowSelfSigned ??= true;

    if (_client != null) {
      return _client!;
    }

    if (allowSelfSigned) {
      final httpClient = HttpClient()
        ..badCertificateCallback = (X509Certificate cert, String host, int port) {
          return true;
        };

      _client = IOClient(httpClient);
    } else {
      _client = http.Client();
    }

    return _client!;
  }

  static void close() {
    _client?.close();
    _client = null;
  }

  static void reset() {
    close();
  }

  static void setClient(http.Client client) {
    _client = client;
  }
}
