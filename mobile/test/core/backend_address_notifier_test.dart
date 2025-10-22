import 'package:flutter_test/flutter_test.dart';
import 'package:area/core/notifiers/backend_address_notifier.dart';

void main() {
  late BackendAddressNotifier notifier;

  setUp(() {
    notifier = BackendAddressNotifier();
  });

  tearDown(() {
    notifier.dispose();
  });

  group('BackendAddressNotifier', () {
    test('initial backendAddress should be null', () {
      expect(notifier.backendAddress, isNull);
    });

    test('setBackendAddress should update backendAddress', () {
      notifier.setBackendAddress('https://test.com');
      expect(notifier.backendAddress, 'https://test.com');
    });

    test('setBackendAddress should not notify when setting same value', () {
      notifier.setBackendAddress('https://test.com');
      notifier.setBackendAddress('https://test.com');
      expect(notifier.backendAddress, 'https://test.com');
    });

    test('setBackendAddress should allow setting null', () {
      notifier.setBackendAddress('https://test.com');
      expect(notifier.backendAddress, 'https://test.com');

      notifier.setBackendAddress(null);
      expect(notifier.backendAddress, isNull);
    });
  });
}
