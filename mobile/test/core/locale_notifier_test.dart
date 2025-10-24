import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:area/core/notifiers/locale_notifier.dart';

void main() {
  late LocaleNotifier notifier;

  setUp(() {
    notifier = LocaleNotifier();
  });

  tearDown(() {
    notifier.dispose();
  });

  group('LocaleNotifier', () {
    test('initial locale should be English', () {
      expect(notifier.locale, const Locale('en'));
    });

    test('setLocale should update locale', () {
      notifier.setLocale(const Locale('fr'));
      expect(notifier.locale, const Locale('fr'));
    });

    test('setLocale should not notify when setting same locale', () {
      notifier.setLocale(const Locale('fr'));
      notifier.setLocale(const Locale('fr'));
      expect(notifier.locale, const Locale('fr'));
    });

    test('setLocale should work with different locales', () {
      notifier.setLocale(const Locale('es'));
      expect(notifier.locale, const Locale('es'));

      notifier.setLocale(const Locale('de'));
      expect(notifier.locale, const Locale('de'));
    });
  });
}
