import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_fr.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate = _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[Locale('en'), Locale('fr')];

  /// No description provided for @label_home.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get label_home;

  /// No description provided for @label_catalogue.
  ///
  /// In en, this message translates to:
  /// **'Catalogue'**
  String get label_catalogue;

  /// No description provided for @label_add.
  ///
  /// In en, this message translates to:
  /// **'Add'**
  String get label_add;

  /// No description provided for @label_areas.
  ///
  /// In en, this message translates to:
  /// **'AREAs'**
  String get label_areas;

  /// No description provided for @label_profile.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get label_profile;

  /// No description provided for @logout.
  ///
  /// In en, this message translates to:
  /// **'Logout'**
  String get logout;

  /// No description provided for @login.
  ///
  /// In en, this message translates to:
  /// **'Login'**
  String get login;

  /// No description provided for @register.
  ///
  /// In en, this message translates to:
  /// **'Register'**
  String get register;

  /// No description provided for @not_connected.
  ///
  /// In en, this message translates to:
  /// **'Not connected'**
  String get not_connected;

  /// No description provided for @backend_server_address.
  ///
  /// In en, this message translates to:
  /// **'Backend Server Address'**
  String get backend_server_address;

  /// No description provided for @email.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get email;

  /// No description provided for @empty_email.
  ///
  /// In en, this message translates to:
  /// **'Please enter your email'**
  String get empty_email;

  /// No description provided for @invalid_email.
  ///
  /// In en, this message translates to:
  /// **'Please enter a valid email'**
  String get invalid_email;

  /// No description provided for @password.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get password;

  /// No description provided for @empty_password.
  ///
  /// In en, this message translates to:
  /// **'Please enter your password'**
  String get empty_password;

  /// No description provided for @invalid_password.
  ///
  /// In en, this message translates to:
  /// **'Password must be at least 6 characters'**
  String get invalid_password;

  /// No description provided for @forgot_password_question.
  ///
  /// In en, this message translates to:
  /// **'Forgot your password ?'**
  String get forgot_password_question;

  /// No description provided for @forgot_password.
  ///
  /// In en, this message translates to:
  /// **'Forgot Password'**
  String get forgot_password;

  /// No description provided for @confirm_email.
  ///
  /// In en, this message translates to:
  /// **'Confirm Email'**
  String get confirm_email;

  /// No description provided for @confirm_email_differs.
  ///
  /// In en, this message translates to:
  /// **'Emails differ'**
  String get confirm_email_differs;

  /// No description provided for @email_sent.
  ///
  /// In en, this message translates to:
  /// **'Email sent'**
  String get email_sent;

  /// No description provided for @send.
  ///
  /// In en, this message translates to:
  /// **'Send'**
  String get send;

  /// No description provided for @name.
  ///
  /// In en, this message translates to:
  /// **'Name'**
  String get name;

  /// No description provided for @empty_name.
  ///
  /// In en, this message translates to:
  /// **'Please enter your name'**
  String get empty_name;

  /// No description provided for @invalid_name.
  ///
  /// In en, this message translates to:
  /// **'Name must be less than 38 characters'**
  String get invalid_name;

  /// No description provided for @confirm_password.
  ///
  /// In en, this message translates to:
  /// **'Confirm Password'**
  String get confirm_password;

  /// No description provided for @confirm_password_differs.
  ///
  /// In en, this message translates to:
  /// **'Passwords differ'**
  String get confirm_password_differs;

  /// No description provided for @empty_backend_server_address.
  ///
  /// In en, this message translates to:
  /// **'Please enter a backend server address'**
  String get empty_backend_server_address;

  /// No description provided for @invalid_backend_server_address.
  ///
  /// In en, this message translates to:
  /// **'The address is not valid'**
  String get invalid_backend_server_address;

  /// No description provided for @valid_backend_server_address.
  ///
  /// In en, this message translates to:
  /// **'The address is valid'**
  String get valid_backend_server_address;

  /// No description provided for @user_registered.
  ///
  /// In en, this message translates to:
  /// **'User registered'**
  String get user_registered;

  /// No description provided for @logged_in.
  ///
  /// In en, this message translates to:
  /// **'Logged in successfully'**
  String get logged_in;

  /// No description provided for @logged_out.
  ///
  /// In en, this message translates to:
  /// **'Logged out successfully'**
  String get logged_out;
}

class _AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) => <String>['en', 'fr'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'fr':
      return AppLocalizationsFr();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
