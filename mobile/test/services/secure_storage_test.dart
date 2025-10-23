import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:area/services/secure_storage.dart';

class MockFlutterSecureStorage extends Mock implements FlutterSecureStorage {}

void main() {
  group('SecureStorage', () {
    late MockFlutterSecureStorage mockSecureStorage;

    setUp(() {
      mockSecureStorage = MockFlutterSecureStorage();
      setSecureStorage(mockSecureStorage);
    });

    group('saveJwt', () {
      test('saves JWT token successfully', () async {
        when(
          () => mockSecureStorage.write(key: 'jwt', value: 'test-token'),
        ).thenAnswer((_) async => {});

        await saveJwt('test-token');

        verify(() => mockSecureStorage.write(key: 'jwt', value: 'test-token')).called(1);
      });

      test('saves empty JWT token', () async {
        when(() => mockSecureStorage.write(key: 'jwt', value: '')).thenAnswer((_) async => {});

        await saveJwt('');

        verify(() => mockSecureStorage.write(key: 'jwt', value: '')).called(1);
      });

      test('saves JWT token with special characters', () async {
        const specialToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
        when(
          () => mockSecureStorage.write(key: 'jwt', value: specialToken),
        ).thenAnswer((_) async => {});

        await saveJwt(specialToken);

        verify(() => mockSecureStorage.write(key: 'jwt', value: specialToken)).called(1);
      });
    });

    group('getJwt', () {
      test('retrieves JWT token successfully', () async {
        when(() => mockSecureStorage.read(key: 'jwt')).thenAnswer((_) async => 'test-token');

        final result = await getJwt();

        expect(result, equals('test-token'));
        verify(() => mockSecureStorage.read(key: 'jwt')).called(1);
      });

      test('returns null when JWT token does not exist', () async {
        when(() => mockSecureStorage.read(key: 'jwt')).thenAnswer((_) async => null);

        final result = await getJwt();

        expect(result, isNull);
        verify(() => mockSecureStorage.read(key: 'jwt')).called(1);
      });

      test('retrieves JWT token with special characters', () async {
        const specialToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
        when(() => mockSecureStorage.read(key: 'jwt')).thenAnswer((_) async => specialToken);

        final result = await getJwt();

        expect(result, equals(specialToken));
      });

      test('retrieves empty JWT token', () async {
        when(() => mockSecureStorage.read(key: 'jwt')).thenAnswer((_) async => '');

        final result = await getJwt();

        expect(result, equals(''));
      });
    });

    group('deleteJwt', () {
      test('deletes JWT token successfully', () async {
        when(() => mockSecureStorage.delete(key: 'jwt')).thenAnswer((_) async => {});

        await deleteJwt();

        verify(() => mockSecureStorage.delete(key: 'jwt')).called(1);
      });

      test('deletes JWT token even when it does not exist', () async {
        when(() => mockSecureStorage.delete(key: 'jwt')).thenAnswer((_) async => {});

        await deleteJwt();

        verify(() => mockSecureStorage.delete(key: 'jwt')).called(1);
      });

      test('deletes JWT token multiple times', () async {
        when(() => mockSecureStorage.delete(key: 'jwt')).thenAnswer((_) async => {});

        await deleteJwt();
        await deleteJwt();
        await deleteJwt();

        verify(() => mockSecureStorage.delete(key: 'jwt')).called(3);
      });
    });

    group('setSecureStorage', () {
      test('changes the secure storage instance', () async {
        final newMockStorage = MockFlutterSecureStorage();
        when(() => newMockStorage.read(key: 'jwt')).thenAnswer((_) async => 'new-token');

        setSecureStorage(newMockStorage);

        final result = await getJwt();

        expect(result, equals('new-token'));
        verify(() => newMockStorage.read(key: 'jwt')).called(1);
        verifyNever(() => mockSecureStorage.read(key: 'jwt'));
      });
    });

    group('JWT token workflow', () {
      test('saves, retrieves, and deletes JWT token', () async {
        when(
          () => mockSecureStorage.write(key: 'jwt', value: 'workflow-token'),
        ).thenAnswer((_) async => {});
        when(
          () => mockSecureStorage.read(key: 'jwt'),
        ).thenAnswer((_) async => 'workflow-token');
        when(() => mockSecureStorage.delete(key: 'jwt')).thenAnswer((_) async => {});

        // Save
        await saveJwt('workflow-token');
        verify(() => mockSecureStorage.write(key: 'jwt', value: 'workflow-token')).called(1);

        // Retrieve
        final token = await getJwt();
        expect(token, equals('workflow-token'));
        verify(() => mockSecureStorage.read(key: 'jwt')).called(1);

        // Delete
        await deleteJwt();
        verify(() => mockSecureStorage.delete(key: 'jwt')).called(1);
      });

      test('overwrites existing JWT token', () async {
        when(
          () => mockSecureStorage.write(
            key: 'jwt',
            value: any(named: 'value'),
          ),
        ).thenAnswer((_) async => {});

        await saveJwt('old-token');
        await saveJwt('new-token');

        verify(() => mockSecureStorage.write(key: 'jwt', value: 'old-token')).called(1);
        verify(() => mockSecureStorage.write(key: 'jwt', value: 'new-token')).called(1);
      });

      test('retrieves null after deleting JWT token', () async {
        when(
          () => mockSecureStorage.write(key: 'jwt', value: 'token'),
        ).thenAnswer((_) async => {});
        when(() => mockSecureStorage.delete(key: 'jwt')).thenAnswer((_) async => {});

        await saveJwt('token');
        await deleteJwt();

        when(() => mockSecureStorage.read(key: 'jwt')).thenAnswer((_) async => null);
        final result = await getJwt();

        expect(result, isNull);
      });
    });
  });
}
