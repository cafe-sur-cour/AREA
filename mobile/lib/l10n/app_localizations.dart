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

  /// No description provided for @services.
  ///
  /// In en, this message translates to:
  /// **'Services'**
  String get services;

  /// No description provided for @cancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancel;

  /// No description provided for @confirm.
  ///
  /// In en, this message translates to:
  /// **'Confirm'**
  String get confirm;

  /// No description provided for @delete.
  ///
  /// In en, this message translates to:
  /// **'Delete'**
  String get delete;

  /// No description provided for @retry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get retry;

  /// No description provided for @loading.
  ///
  /// In en, this message translates to:
  /// **'Loading'**
  String get loading;

  /// No description provided for @error.
  ///
  /// In en, this message translates to:
  /// **'Error'**
  String get error;

  /// No description provided for @welcome_home.
  ///
  /// In en, this message translates to:
  /// **'Welcome to home page'**
  String get welcome_home;

  /// No description provided for @github.
  ///
  /// In en, this message translates to:
  /// **'GitHub'**
  String get github;

  /// No description provided for @google.
  ///
  /// In en, this message translates to:
  /// **'Google'**
  String get google;

  /// No description provided for @microsoft.
  ///
  /// In en, this message translates to:
  /// **'Microsoft'**
  String get microsoft;

  /// No description provided for @github_login_failed.
  ///
  /// In en, this message translates to:
  /// **'GitHub login failed: {error}'**
  String github_login_failed(String error);

  /// No description provided for @google_login_failed.
  ///
  /// In en, this message translates to:
  /// **'Google login failed: {error}'**
  String google_login_failed(String error);

  /// No description provided for @failed_open_browser.
  ///
  /// In en, this message translates to:
  /// **'Failed to open browser: {error}'**
  String failed_open_browser(String error);

  /// No description provided for @connect_service.
  ///
  /// In en, this message translates to:
  /// **'Connect {serviceName}'**
  String connect_service(String serviceName);

  /// No description provided for @service_login.
  ///
  /// In en, this message translates to:
  /// **'{providerName} Login'**
  String service_login(String providerName);

  /// No description provided for @loading_authentication.
  ///
  /// In en, this message translates to:
  /// **'Loading authentication...'**
  String get loading_authentication;

  /// No description provided for @authentication_error.
  ///
  /// In en, this message translates to:
  /// **'Authentication Error'**
  String get authentication_error;

  /// No description provided for @set_delay.
  ///
  /// In en, this message translates to:
  /// **'Set Delay'**
  String get set_delay;

  /// No description provided for @set_delay_for.
  ///
  /// In en, this message translates to:
  /// **'Set Delay for\n{reactionName}'**
  String set_delay_for(String reactionName);

  /// No description provided for @days.
  ///
  /// In en, this message translates to:
  /// **'Days'**
  String get days;

  /// No description provided for @hours.
  ///
  /// In en, this message translates to:
  /// **'Hours'**
  String get hours;

  /// No description provided for @minutes.
  ///
  /// In en, this message translates to:
  /// **'Minutes'**
  String get minutes;

  /// No description provided for @seconds.
  ///
  /// In en, this message translates to:
  /// **'Seconds'**
  String get seconds;

  /// No description provided for @total_delay.
  ///
  /// In en, this message translates to:
  /// **'Total delay: {delay}'**
  String total_delay(String delay);

  /// No description provided for @no_delay.
  ///
  /// In en, this message translates to:
  /// **'No delay'**
  String get no_delay;

  /// No description provided for @automation_name.
  ///
  /// In en, this message translates to:
  /// **'Name'**
  String get automation_name;

  /// No description provided for @automation_description.
  ///
  /// In en, this message translates to:
  /// **'Description'**
  String get automation_description;

  /// No description provided for @name_required.
  ///
  /// In en, this message translates to:
  /// **'Name is required'**
  String get name_required;

  /// No description provided for @failed_create_automation.
  ///
  /// In en, this message translates to:
  /// **'Failed to create automation: {error}'**
  String failed_create_automation(String error);

  /// No description provided for @delete_automation.
  ///
  /// In en, this message translates to:
  /// **'Delete Automation'**
  String get delete_automation;

  /// No description provided for @delete_automation_confirm.
  ///
  /// In en, this message translates to:
  /// **'Are you sure you want to delete \"{automationName}\"?'**
  String delete_automation_confirm(String automationName);

  /// No description provided for @error_deleting_automation.
  ///
  /// In en, this message translates to:
  /// **'Error deleting automation: {error}'**
  String error_deleting_automation(String error);

  /// No description provided for @active.
  ///
  /// In en, this message translates to:
  /// **'Active'**
  String get active;

  /// No description provided for @inactive.
  ///
  /// In en, this message translates to:
  /// **'Inactive'**
  String get inactive;

  /// No description provided for @deactivate_automation.
  ///
  /// In en, this message translates to:
  /// **'Deactivate automation'**
  String get deactivate_automation;

  /// No description provided for @activate_automation.
  ///
  /// In en, this message translates to:
  /// **'Activate automation'**
  String get activate_automation;

  /// No description provided for @delete_automation_tooltip.
  ///
  /// In en, this message translates to:
  /// **'Delete automation'**
  String get delete_automation_tooltip;

  /// No description provided for @action.
  ///
  /// In en, this message translates to:
  /// **'Action:'**
  String get action;

  /// No description provided for @reaction.
  ///
  /// In en, this message translates to:
  /// **'Reaction:'**
  String get reaction;

  /// No description provided for @reactions.
  ///
  /// In en, this message translates to:
  /// **'Reactions:'**
  String get reactions;

  /// No description provided for @error_loading_automations.
  ///
  /// In en, this message translates to:
  /// **'Error loading automations'**
  String get error_loading_automations;

  /// No description provided for @no_automations_yet.
  ///
  /// In en, this message translates to:
  /// **'No automations yet'**
  String get no_automations_yet;

  /// No description provided for @connect_to_create.
  ///
  /// In en, this message translates to:
  /// **'Connect to create your first automation'**
  String get connect_to_create;

  /// No description provided for @create_first_automation.
  ///
  /// In en, this message translates to:
  /// **'Create your first automation to get started'**
  String get create_first_automation;

  /// No description provided for @my_areas.
  ///
  /// In en, this message translates to:
  /// **'My AREAs'**
  String get my_areas;

  /// No description provided for @all.
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get all;

  /// No description provided for @actions.
  ///
  /// In en, this message translates to:
  /// **'Actions'**
  String get actions;

  /// No description provided for @reactions_filter.
  ///
  /// In en, this message translates to:
  /// **'Reactions'**
  String get reactions_filter;

  /// No description provided for @error_loading_catalogue.
  ///
  /// In en, this message translates to:
  /// **'Error loading catalogue'**
  String get error_loading_catalogue;

  /// No description provided for @no_items_available.
  ///
  /// In en, this message translates to:
  /// **'No items available'**
  String get no_items_available;

  /// No description provided for @no_filter_available.
  ///
  /// In en, this message translates to:
  /// **'No {filter} available'**
  String no_filter_available(String filter);

  /// No description provided for @no_description_available.
  ///
  /// In en, this message translates to:
  /// **'No description available'**
  String get no_description_available;

  /// No description provided for @use_as_action.
  ///
  /// In en, this message translates to:
  /// **'Use as Action'**
  String get use_as_action;

  /// No description provided for @use_as_reaction.
  ///
  /// In en, this message translates to:
  /// **'Use as Reaction'**
  String get use_as_reaction;

  /// No description provided for @backend_not_configured.
  ///
  /// In en, this message translates to:
  /// **'Backend server address is not configured'**
  String get backend_not_configured;

  /// No description provided for @failed_load_item.
  ///
  /// In en, this message translates to:
  /// **'Failed to load {itemType}: {error}'**
  String failed_load_item(String itemType, String error);

  /// No description provided for @action_lower.
  ///
  /// In en, this message translates to:
  /// **'action'**
  String get action_lower;

  /// No description provided for @reaction_lower.
  ///
  /// In en, this message translates to:
  /// **'reaction'**
  String get reaction_lower;

  /// No description provided for @loading_services.
  ///
  /// In en, this message translates to:
  /// **'Loading services...'**
  String get loading_services;

  /// No description provided for @failed_load_services.
  ///
  /// In en, this message translates to:
  /// **'Failed to load services: {error}'**
  String failed_load_services(String error);

  /// No description provided for @connecting_to_service.
  ///
  /// In en, this message translates to:
  /// **'Connecting to {serviceName}...'**
  String connecting_to_service(String serviceName);

  /// No description provided for @failed_connect_service.
  ///
  /// In en, this message translates to:
  /// **'Failed to connect to {serviceName}: {error}'**
  String failed_connect_service(String serviceName, String error);

  /// No description provided for @unsubscribe_confirm.
  ///
  /// In en, this message translates to:
  /// **'Are you sure you want to unsubscribe from {serviceName}? This will stop all automations using this service.'**
  String unsubscribe_confirm(String serviceName);

  /// No description provided for @unsubscribing_from_service.
  ///
  /// In en, this message translates to:
  /// **'Unsubscribing from {serviceName}...'**
  String unsubscribing_from_service(String serviceName);

  /// No description provided for @error_loading_services.
  ///
  /// In en, this message translates to:
  /// **'Error loading services'**
  String get error_loading_services;

  /// No description provided for @loading_reactions.
  ///
  /// In en, this message translates to:
  /// **'Loading reactions...'**
  String get loading_reactions;

  /// No description provided for @error_loading_reactions.
  ///
  /// In en, this message translates to:
  /// **'Error loading reactions'**
  String get error_loading_reactions;

  /// No description provided for @loading_actions.
  ///
  /// In en, this message translates to:
  /// **'Loading actions...'**
  String get loading_actions;

  /// No description provided for @error_loading_actions.
  ///
  /// In en, this message translates to:
  /// **'Error loading actions'**
  String get error_loading_actions;

  /// No description provided for @action_services.
  ///
  /// In en, this message translates to:
  /// **'Action Services'**
  String get action_services;

  /// No description provided for @reaction_services.
  ///
  /// In en, this message translates to:
  /// **'Reaction Services'**
  String get reaction_services;

  /// No description provided for @no_services_available.
  ///
  /// In en, this message translates to:
  /// **'No services available'**
  String get no_services_available;

  /// No description provided for @no_services_with_actions.
  ///
  /// In en, this message translates to:
  /// **'There are no services with actions available at the moment.'**
  String get no_services_with_actions;

  /// No description provided for @no_services_with_reactions.
  ///
  /// In en, this message translates to:
  /// **'There are no services with reactions available at the moment.'**
  String get no_services_with_reactions;

  /// No description provided for @no_services_available_title.
  ///
  /// In en, this message translates to:
  /// **'No Services Available'**
  String get no_services_available_title;

  /// No description provided for @no_services_found.
  ///
  /// In en, this message translates to:
  /// **'No services found. Please check your connection.'**
  String get no_services_found;

  /// No description provided for @and.
  ///
  /// In en, this message translates to:
  /// **'AND'**
  String get and;

  /// No description provided for @then.
  ///
  /// In en, this message translates to:
  /// **'THEN'**
  String get then;

  /// No description provided for @action_label.
  ///
  /// In en, this message translates to:
  /// **'Action'**
  String get action_label;

  /// No description provided for @reaction_label.
  ///
  /// In en, this message translates to:
  /// **'REAction'**
  String get reaction_label;

  /// No description provided for @clear_all_reactions.
  ///
  /// In en, this message translates to:
  /// **'Clear All Reactions ({count})'**
  String clear_all_reactions(int count);

  /// No description provided for @create_automation.
  ///
  /// In en, this message translates to:
  /// **'Create Automation'**
  String get create_automation;

  /// No description provided for @please_add_action_and_reaction.
  ///
  /// In en, this message translates to:
  /// **'Please add both an action and at least one reaction'**
  String get please_add_action_and_reaction;

  /// No description provided for @configure_automation.
  ///
  /// In en, this message translates to:
  /// **'Configure Automation'**
  String get configure_automation;

  /// No description provided for @invalid_automation_state.
  ///
  /// In en, this message translates to:
  /// **'Invalid automation state'**
  String get invalid_automation_state;

  /// No description provided for @go_back_select_action_reaction.
  ///
  /// In en, this message translates to:
  /// **'Please go back and select both an action and at least one reaction.'**
  String get go_back_select_action_reaction;

  /// No description provided for @automation_details.
  ///
  /// In en, this message translates to:
  /// **'Automation Details'**
  String get automation_details;

  /// No description provided for @action_colon.
  ///
  /// In en, this message translates to:
  /// **'Action: {actionName}'**
  String action_colon(String actionName);

  /// No description provided for @reaction_number.
  ///
  /// In en, this message translates to:
  /// **'Reaction {number}: {reactionName}'**
  String reaction_number(int number, String reactionName);

  /// No description provided for @no_additional_config.
  ///
  /// In en, this message translates to:
  /// **'This action requires no additional configuration.'**
  String get no_additional_config;

  /// No description provided for @no_additional_config_reaction.
  ///
  /// In en, this message translates to:
  /// **'This reaction requires no additional configuration.'**
  String get no_additional_config_reaction;

  /// No description provided for @creating_automation.
  ///
  /// In en, this message translates to:
  /// **'Creating Automation...'**
  String get creating_automation;

  /// No description provided for @automation_created_success.
  ///
  /// In en, this message translates to:
  /// **'Automation created successfully!'**
  String get automation_created_success;

  /// No description provided for @field_required.
  ///
  /// In en, this message translates to:
  /// **'{fieldName} is required'**
  String field_required(String fieldName);

  /// No description provided for @valid_email_required.
  ///
  /// In en, this message translates to:
  /// **'Please enter a valid email address'**
  String get valid_email_required;

  /// No description provided for @valid_number_required.
  ///
  /// In en, this message translates to:
  /// **'Please enter a valid number'**
  String get valid_number_required;

  /// No description provided for @invalid_select_field.
  ///
  /// In en, this message translates to:
  /// **'Invalid select field: {fieldName} has no options'**
  String invalid_select_field(String fieldName);

  /// No description provided for @type_brace_for_suggestions.
  ///
  /// In en, this message translates to:
  /// **'Type {character} to see action data suggestions'**
  String type_brace_for_suggestions(String character);

  /// No description provided for @example.
  ///
  /// In en, this message translates to:
  /// **'Example: {example}'**
  String example(String example);

  /// No description provided for @edit.
  ///
  /// In en, this message translates to:
  /// **'Edit'**
  String get edit;

  /// No description provided for @set.
  ///
  /// In en, this message translates to:
  /// **'Set'**
  String get set;

  /// No description provided for @default_automation_name.
  ///
  /// In en, this message translates to:
  /// **'My Automation {timestamp}'**
  String default_automation_name(String timestamp);

  /// No description provided for @default_automation_description.
  ///
  /// In en, this message translates to:
  /// **'Created from mobile app'**
  String get default_automation_description;

  /// No description provided for @backend_server_not_configured.
  ///
  /// In en, this message translates to:
  /// **'Backend server address not configured'**
  String get backend_server_not_configured;

  /// No description provided for @action_failed.
  ///
  /// In en, this message translates to:
  /// **'Action failed: {error}'**
  String action_failed(String error);

  /// No description provided for @successfully_connected_to.
  ///
  /// In en, this message translates to:
  /// **'Successfully connected to {serviceName}'**
  String successfully_connected_to(String serviceName);

  /// No description provided for @unsubscribe_from.
  ///
  /// In en, this message translates to:
  /// **'Unsubscribe from {serviceName}'**
  String unsubscribe_from(String serviceName);

  /// No description provided for @unsubscribed_from.
  ///
  /// In en, this message translates to:
  /// **'Unsubscribed from {serviceName}'**
  String unsubscribed_from(String serviceName);

  /// No description provided for @unsubscribe_failed.
  ///
  /// In en, this message translates to:
  /// **'Unsubscribe failed: {error}'**
  String unsubscribe_failed(String error);

  /// No description provided for @connected.
  ///
  /// In en, this message translates to:
  /// **'Connected'**
  String get connected;

  /// No description provided for @not_subscribed.
  ///
  /// In en, this message translates to:
  /// **'Not Subscribed'**
  String get not_subscribed;

  /// No description provided for @unsubscribe.
  ///
  /// In en, this message translates to:
  /// **'Unsubscribe'**
  String get unsubscribe;

  /// No description provided for @subscribe.
  ///
  /// In en, this message translates to:
  /// **'Subscribe'**
  String get subscribe;

  /// No description provided for @connect_and_subscribe.
  ///
  /// In en, this message translates to:
  /// **'Connect & Subscribe'**
  String get connect_and_subscribe;

  /// No description provided for @retry_failed.
  ///
  /// In en, this message translates to:
  /// **'Retry failed. Please try again.'**
  String get retry_failed;

  /// No description provided for @retrying.
  ///
  /// In en, this message translates to:
  /// **'Retrying... ({count}/{max})'**
  String retrying(int count, int max);

  /// No description provided for @max_retries_reached.
  ///
  /// In en, this message translates to:
  /// **'Max retries reached'**
  String get max_retries_reached;

  /// No description provided for @failed_to_load_authentication.
  ///
  /// In en, this message translates to:
  /// **'Failed to load authentication page'**
  String get failed_to_load_authentication;

  /// No description provided for @retrying_count.
  ///
  /// In en, this message translates to:
  /// **'Retrying... ({count}/{max})'**
  String retrying_count(int count, int max);

  /// No description provided for @description.
  ///
  /// In en, this message translates to:
  /// **'Description'**
  String get description;

  /// No description provided for @parameters.
  ///
  /// In en, this message translates to:
  /// **'Parameters'**
  String get parameters;

  /// No description provided for @required_lowercase.
  ///
  /// In en, this message translates to:
  /// **'required'**
  String get required_lowercase;

  /// No description provided for @choose_this_action.
  ///
  /// In en, this message translates to:
  /// **'Choose this Action'**
  String get choose_this_action;

  /// No description provided for @choose_this_reaction.
  ///
  /// In en, this message translates to:
  /// **'Choose this Reaction'**
  String get choose_this_reaction;

  /// No description provided for @service_subscription_failed.
  ///
  /// In en, this message translates to:
  /// **'Service subscription failed: {error}'**
  String service_subscription_failed(String error);

  /// No description provided for @complete_service_setup.
  ///
  /// In en, this message translates to:
  /// **'Complete {serviceName} setup in your browser, then return to the app.'**
  String complete_service_setup(String serviceName);
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
