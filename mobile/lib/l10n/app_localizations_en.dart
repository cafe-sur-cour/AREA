// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get label_home => 'Home';

  @override
  String get label_catalogue => 'Catalogue';

  @override
  String get label_add => 'Add';

  @override
  String get label_areas => 'AREAs';

  @override
  String get label_profile => 'Profile';

  @override
  String get logout => 'Logout';

  @override
  String get login => 'Login';

  @override
  String get register => 'Register';

  @override
  String get not_connected => 'Not connected';

  @override
  String get backend_server_address => 'Backend Server Address';

  @override
  String get email => 'Email';

  @override
  String get empty_email => 'Please enter your email';

  @override
  String get invalid_email => 'Please enter a valid email';

  @override
  String get password => 'Password';

  @override
  String get empty_password => 'Please enter your password';

  @override
  String get invalid_password => 'Password must be at least 6 characters';

  @override
  String get forgot_password_question => 'Forgot your password ?';

  @override
  String get forgot_password => 'Forgot Password';

  @override
  String get confirm_email => 'Confirm Email';

  @override
  String get confirm_email_differs => 'Emails differ';

  @override
  String get send => 'Send';

  @override
  String get name => 'Name';

  @override
  String get empty_name => 'Please enter your name';

  @override
  String get invalid_name => 'Name must be less than 38 characters';

  @override
  String get confirm_password => 'Confirm Password';

  @override
  String get confirm_password_differs => 'Passwords differ';

  @override
  String get empty_backend_server_address =>
      'Please enter a backend server address';

  @override
  String get invalid_backend_server_address => 'The address is not valid';

  @override
  String get valid_backend_server_address => 'The address is valid';

  @override
  String get user_registered => 'User registered';

  @override
  String get logged_in => 'Logged in successfully';

  @override
  String get logged_out => 'Logged out successfully';

  @override
  String get services => 'Services';
}
