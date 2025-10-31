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

  /// No description provided for @dashboard.
  ///
  /// In en, this message translates to:
  /// **'Dashboard'**
  String get dashboard;

  /// No description provided for @manage_areas_performance.
  ///
  /// In en, this message translates to:
  /// **'Manage your Areas and monitor their performance'**
  String get manage_areas_performance;

  /// No description provided for @quick_actions.
  ///
  /// In en, this message translates to:
  /// **'Quick actions'**
  String get quick_actions;

  /// No description provided for @connect_services.
  ///
  /// In en, this message translates to:
  /// **'Connect Services'**
  String get connect_services;

  /// No description provided for @link_new_platforms.
  ///
  /// In en, this message translates to:
  /// **'Link new platforms'**
  String get link_new_platforms;

  /// No description provided for @browse_templates.
  ///
  /// In en, this message translates to:
  /// **'Browse Templates'**
  String get browse_templates;

  /// No description provided for @pre_made_areas.
  ///
  /// In en, this message translates to:
  /// **'Pre-made Areas'**
  String get pre_made_areas;

  /// No description provided for @account_settings.
  ///
  /// In en, this message translates to:
  /// **'Account Settings'**
  String get account_settings;

  /// No description provided for @manage_your_profile.
  ///
  /// In en, this message translates to:
  /// **'Manage your profile'**
  String get manage_your_profile;

  /// No description provided for @your_areas.
  ///
  /// In en, this message translates to:
  /// **'Your Areas'**
  String get your_areas;

  /// No description provided for @total_areas.
  ///
  /// In en, this message translates to:
  /// **'Total Areas'**
  String get total_areas;

  /// No description provided for @connected_services.
  ///
  /// In en, this message translates to:
  /// **'Connected Services'**
  String get connected_services;

  /// No description provided for @no_area_yet.
  ///
  /// In en, this message translates to:
  /// **'No Area yet'**
  String get no_area_yet;

  /// No description provided for @create_first_area.
  ///
  /// In en, this message translates to:
  /// **'Create your first Area to get started'**
  String get create_first_area;

  /// No description provided for @trigger_colon.
  ///
  /// In en, this message translates to:
  /// **'Trigger: {trigger}'**
  String trigger_colon(String trigger);

  /// No description provided for @automate_your_life.
  ///
  /// In en, this message translates to:
  /// **'Automate your life with powerful connections'**
  String get automate_your_life;

  /// No description provided for @connect_favorite_apps.
  ///
  /// In en, this message translates to:
  /// **'Connect your favorite apps and services to create powerful automations. Save time and focus on what matters most.'**
  String get connect_favorite_apps;

  /// No description provided for @get_started_free.
  ///
  /// In en, this message translates to:
  /// **'Get started free'**
  String get get_started_free;

  /// No description provided for @sign_in.
  ///
  /// In en, this message translates to:
  /// **'Sign in'**
  String get sign_in;

  /// No description provided for @go_to_dashboard.
  ///
  /// In en, this message translates to:
  /// **'Go to Dashboard'**
  String get go_to_dashboard;

  /// No description provided for @active_automations.
  ///
  /// In en, this message translates to:
  /// **'10M+'**
  String get active_automations;

  /// No description provided for @connected_services_count.
  ///
  /// In en, this message translates to:
  /// **'500+'**
  String get connected_services_count;

  /// No description provided for @happy_users.
  ///
  /// In en, this message translates to:
  /// **'2M+'**
  String get happy_users;

  /// No description provided for @active_automations_label.
  ///
  /// In en, this message translates to:
  /// **'Active automations'**
  String get active_automations_label;

  /// No description provided for @connected_services_label.
  ///
  /// In en, this message translates to:
  /// **'Connected services'**
  String get connected_services_label;

  /// No description provided for @happy_users_label.
  ///
  /// In en, this message translates to:
  /// **'Happy users'**
  String get happy_users_label;

  /// No description provided for @how_it_works.
  ///
  /// In en, this message translates to:
  /// **'How it works'**
  String get how_it_works;

  /// No description provided for @create_powerful_automations.
  ///
  /// In en, this message translates to:
  /// **'Create powerful automations in three simple steps'**
  String get create_powerful_automations;

  /// No description provided for @choose_a_trigger.
  ///
  /// In en, this message translates to:
  /// **'Choose a trigger'**
  String get choose_a_trigger;

  /// No description provided for @select_app_event.
  ///
  /// In en, this message translates to:
  /// **'Select an app and event that starts your automation'**
  String get select_app_event;

  /// No description provided for @add_an_action.
  ///
  /// In en, this message translates to:
  /// **'Add an action'**
  String get add_an_action;

  /// No description provided for @choose_what_happens.
  ///
  /// In en, this message translates to:
  /// **'Choose what happens when your trigger fires'**
  String get choose_what_happens;

  /// No description provided for @activate_relax.
  ///
  /// In en, this message translates to:
  /// **'Activate & relax'**
  String get activate_relax;

  /// No description provided for @automation_runs_automatically.
  ///
  /// In en, this message translates to:
  /// **'Your automation runs automatically in the background'**
  String get automation_runs_automatically;

  /// No description provided for @popular_automations.
  ///
  /// In en, this message translates to:
  /// **'Popular automations'**
  String get popular_automations;

  /// No description provided for @get_inspired.
  ///
  /// In en, this message translates to:
  /// **'Get inspired by what others are building'**
  String get get_inspired;

  /// No description provided for @email_to_slack.
  ///
  /// In en, this message translates to:
  /// **'GitHub Push to Slack'**
  String get email_to_slack;

  /// No description provided for @slack_email_notifications.
  ///
  /// In en, this message translates to:
  /// **'Get notified in Slack when code is pushed to your GitHub repository'**
  String get slack_email_notifications;

  /// No description provided for @social_media_sync.
  ///
  /// In en, this message translates to:
  /// **'Daily Teams Reminder'**
  String get social_media_sync;

  /// No description provided for @post_multiple_networks.
  ///
  /// In en, this message translates to:
  /// **'Send daily standup reminders to your Microsoft Teams channel'**
  String get post_multiple_networks;

  /// No description provided for @calendar_reminders.
  ///
  /// In en, this message translates to:
  /// **'PR Merged Notification'**
  String get calendar_reminders;

  /// No description provided for @sms_calendar_reminders.
  ///
  /// In en, this message translates to:
  /// **'Get notified in Slack when a pull request is merged on GitHub'**
  String get sms_calendar_reminders;

  /// No description provided for @file_backup.
  ///
  /// In en, this message translates to:
  /// **'Profile Change Alert'**
  String get file_backup;

  /// No description provided for @automatic_cloud_backup.
  ///
  /// In en, this message translates to:
  /// **'Receive an email notification when your Microsoft profile picture changes'**
  String get automatic_cloud_backup;

  /// No description provided for @task_management.
  ///
  /// In en, this message translates to:
  /// **'Scheduled Calendar Event'**
  String get task_management;

  /// No description provided for @create_tasks_from_emails.
  ///
  /// In en, this message translates to:
  /// **'Automatically create calendar events at scheduled times'**
  String get create_tasks_from_emails;

  /// No description provided for @data_collection.
  ///
  /// In en, this message translates to:
  /// **'Slack Reaction to Issue'**
  String get data_collection;

  /// No description provided for @save_forms_to_spreadsheets.
  ///
  /// In en, this message translates to:
  /// **'Create a GitHub issue when someone reacts to a Slack message'**
  String get save_forms_to_spreadsheets;

  /// No description provided for @lightning_fast.
  ///
  /// In en, this message translates to:
  /// **'Lightning fast'**
  String get lightning_fast;

  /// No description provided for @automations_run_instantly.
  ///
  /// In en, this message translates to:
  /// **'Your automations run instantly when triggered, with no delays or waiting.'**
  String get automations_run_instantly;

  /// No description provided for @save_time.
  ///
  /// In en, this message translates to:
  /// **'Save time'**
  String get save_time;

  /// No description provided for @automate_repetitive_tasks.
  ///
  /// In en, this message translates to:
  /// **'Automate repetitive tasks and focus on what really matters to you.'**
  String get automate_repetitive_tasks;

  /// No description provided for @secure_reliable.
  ///
  /// In en, this message translates to:
  /// **'Secure & reliable'**
  String get secure_reliable;

  /// No description provided for @enterprise_grade_security.
  ///
  /// In en, this message translates to:
  /// **'Enterprise-grade security with 99.9% uptime guarantee for your peace of mind.'**
  String get enterprise_grade_security;

  /// No description provided for @ready_to_automate.
  ///
  /// In en, this message translates to:
  /// **'Ready to automate your workflow?'**
  String get ready_to_automate;

  /// No description provided for @join_millions_users.
  ///
  /// In en, this message translates to:
  /// **'Join millions of users who are already saving time with powerful automations.'**
  String get join_millions_users;

  /// No description provided for @go_to_my_areas.
  ///
  /// In en, this message translates to:
  /// **'Go to My AREAs'**
  String get go_to_my_areas;

  /// No description provided for @start_for_free.
  ///
  /// In en, this message translates to:
  /// **'Start for free'**
  String get start_for_free;

  /// No description provided for @copyright_notice.
  ///
  /// In en, this message translates to:
  /// **'© 2025 Area. All rights reserved.'**
  String get copyright_notice;

  /// No description provided for @not_authenticated.
  ///
  /// In en, this message translates to:
  /// **'Not authenticated'**
  String get not_authenticated;

  /// No description provided for @about.
  ///
  /// In en, this message translates to:
  /// **'About'**
  String get about;

  /// No description provided for @about_hero_title.
  ///
  /// In en, this message translates to:
  /// **'Empowering your workflow with'**
  String get about_hero_title;

  /// No description provided for @about_hero_title_highlight.
  ///
  /// In en, this message translates to:
  /// **'intelligent automation'**
  String get about_hero_title_highlight;

  /// No description provided for @about_hero_description.
  ///
  /// In en, this message translates to:
  /// **'We believe in making technology work for you. Our platform connects your favorite apps and services, creating seamless workflows that save time and boost productivity.'**
  String get about_hero_description;

  /// No description provided for @about_mission_title.
  ///
  /// In en, this message translates to:
  /// **'Our Mission'**
  String get about_mission_title;

  /// No description provided for @about_mission_description1.
  ///
  /// In en, this message translates to:
  /// **'At Area, we\'re on a mission to make automation accessible to everyone. Whether you\'re a business professional, developer, or just someone looking to save time, we provide the tools you need to connect your digital life.'**
  String get about_mission_description1;

  /// No description provided for @about_mission_description2.
  ///
  /// In en, this message translates to:
  /// **'We believe that technology should adapt to your needs, not the other way around. That\'s why we\'re constantly innovating and adding new integrations to help you work smarter, not harder.'**
  String get about_mission_description2;

  /// No description provided for @about_mission_stats_users.
  ///
  /// In en, this message translates to:
  /// **'Active Users'**
  String get about_mission_stats_users;

  /// No description provided for @about_mission_stats_automations.
  ///
  /// In en, this message translates to:
  /// **'Automations Running'**
  String get about_mission_stats_automations;

  /// No description provided for @about_mission_stats_integrations.
  ///
  /// In en, this message translates to:
  /// **'Integrations'**
  String get about_mission_stats_integrations;

  /// No description provided for @about_mission_stats_uptime.
  ///
  /// In en, this message translates to:
  /// **'Uptime'**
  String get about_mission_stats_uptime;

  /// No description provided for @about_values_title.
  ///
  /// In en, this message translates to:
  /// **'Our Values'**
  String get about_values_title;

  /// No description provided for @about_values_subtitle.
  ///
  /// In en, this message translates to:
  /// **'The principles that guide everything we do'**
  String get about_values_subtitle;

  /// No description provided for @about_values_user_centric_title.
  ///
  /// In en, this message translates to:
  /// **'User-Centric'**
  String get about_values_user_centric_title;

  /// No description provided for @about_values_user_centric_description.
  ///
  /// In en, this message translates to:
  /// **'Your needs drive our development. We listen to feedback and build features that matter.'**
  String get about_values_user_centric_description;

  /// No description provided for @about_values_innovation_title.
  ///
  /// In en, this message translates to:
  /// **'Innovation'**
  String get about_values_innovation_title;

  /// No description provided for @about_values_innovation_description.
  ///
  /// In en, this message translates to:
  /// **'We\'re always pushing boundaries to bring you the latest in automation technology.'**
  String get about_values_innovation_description;

  /// No description provided for @about_values_security_title.
  ///
  /// In en, this message translates to:
  /// **'Security First'**
  String get about_values_security_title;

  /// No description provided for @about_values_security_description.
  ///
  /// In en, this message translates to:
  /// **'Your data security is our top priority. We use industry-leading encryption and security practices.'**
  String get about_values_security_description;

  /// No description provided for @about_values_global_title.
  ///
  /// In en, this message translates to:
  /// **'Global Reach'**
  String get about_values_global_title;

  /// No description provided for @about_values_global_description.
  ///
  /// In en, this message translates to:
  /// **'Available in multiple languages and regions, serving users worldwide.'**
  String get about_values_global_description;

  /// No description provided for @about_values_open_source_title.
  ///
  /// In en, this message translates to:
  /// **'Open Source'**
  String get about_values_open_source_title;

  /// No description provided for @about_values_open_source_description.
  ///
  /// In en, this message translates to:
  /// **'We believe in transparency and contributing to the open-source community.'**
  String get about_values_open_source_description;

  /// No description provided for @about_values_passion_title.
  ///
  /// In en, this message translates to:
  /// **'Passion'**
  String get about_values_passion_title;

  /// No description provided for @about_values_passion_description.
  ///
  /// In en, this message translates to:
  /// **'We love what we do, and it shows in every feature we build.'**
  String get about_values_passion_description;

  /// No description provided for @about_story_title.
  ///
  /// In en, this message translates to:
  /// **'Our Story'**
  String get about_story_title;

  /// No description provided for @about_story_paragraph1.
  ///
  /// In en, this message translates to:
  /// **'Area was born from a simple idea: what if we could make it easy for anyone to automate their digital life? We saw people spending countless hours on repetitive tasks, switching between apps, and manually transferring data.'**
  String get about_story_paragraph1;

  /// No description provided for @about_story_paragraph2.
  ///
  /// In en, this message translates to:
  /// **'We knew there had to be a better way. So we set out to build a platform that would connect all the tools and services people use every day, making it easy to create powerful automations without writing a single line of code.'**
  String get about_story_paragraph2;

  /// No description provided for @about_story_paragraph3.
  ///
  /// In en, this message translates to:
  /// **'Since our launch, we\'ve helped millions of users save time and increase productivity. We\'ve grown from a small team with a big vision to a global platform serving users across the world.'**
  String get about_story_paragraph3;

  /// No description provided for @about_story_paragraph4.
  ///
  /// In en, this message translates to:
  /// **'But we\'re just getting started. Every day, we\'re working on new integrations, features, and improvements to make Area even better. Thank you for being part of our journey.'**
  String get about_story_paragraph4;

  /// No description provided for @about_technology_title.
  ///
  /// In en, this message translates to:
  /// **'Built with Modern Technology'**
  String get about_technology_title;

  /// No description provided for @about_technology_subtitle.
  ///
  /// In en, this message translates to:
  /// **'Powered by cutting-edge tools and frameworks'**
  String get about_technology_subtitle;

  /// No description provided for @about_why_choose_title.
  ///
  /// In en, this message translates to:
  /// **'Why Choose Area?'**
  String get about_why_choose_title;

  /// No description provided for @about_why_choose_subtitle.
  ///
  /// In en, this message translates to:
  /// **'Here\'s what makes us different'**
  String get about_why_choose_subtitle;

  /// No description provided for @about_why_choose_easy_to_use_title.
  ///
  /// In en, this message translates to:
  /// **'Easy to Use'**
  String get about_why_choose_easy_to_use_title;

  /// No description provided for @about_why_choose_easy_to_use_description.
  ///
  /// In en, this message translates to:
  /// **'No coding required. Our intuitive interface makes creating automations simple and fun.'**
  String get about_why_choose_easy_to_use_description;

  /// No description provided for @about_why_choose_lightning_fast_title.
  ///
  /// In en, this message translates to:
  /// **'Lightning Fast'**
  String get about_why_choose_lightning_fast_title;

  /// No description provided for @about_why_choose_lightning_fast_description.
  ///
  /// In en, this message translates to:
  /// **'Your automations execute instantly with minimal latency for real-time results.'**
  String get about_why_choose_lightning_fast_description;

  /// No description provided for @about_why_choose_enterprise_security_title.
  ///
  /// In en, this message translates to:
  /// **'Enterprise Security'**
  String get about_why_choose_enterprise_security_title;

  /// No description provided for @about_why_choose_enterprise_security_description.
  ///
  /// In en, this message translates to:
  /// **'Bank-level security with encryption, compliance, and regular security audits.'**
  String get about_why_choose_enterprise_security_description;

  /// No description provided for @about_why_choose_amazing_support_title.
  ///
  /// In en, this message translates to:
  /// **'Amazing Support'**
  String get about_why_choose_amazing_support_title;

  /// No description provided for @about_why_choose_amazing_support_description.
  ///
  /// In en, this message translates to:
  /// **'Our dedicated support team is here to help you succeed every step of the way.'**
  String get about_why_choose_amazing_support_description;

  /// No description provided for @about_cta_title.
  ///
  /// In en, this message translates to:
  /// **'Ready to Transform Your Workflow?'**
  String get about_cta_title;

  /// No description provided for @about_cta_description.
  ///
  /// In en, this message translates to:
  /// **'Join thousands of users who are already saving time with Area. Start automating today.'**
  String get about_cta_description;

  /// No description provided for @about_cta_button_dashboard.
  ///
  /// In en, this message translates to:
  /// **'Go to Dashboard'**
  String get about_cta_button_dashboard;

  /// No description provided for @about_cta_button_start.
  ///
  /// In en, this message translates to:
  /// **'Start Free'**
  String get about_cta_button_start;

  /// No description provided for @about_cta_button_explore.
  ///
  /// In en, this message translates to:
  /// **'Explore Services'**
  String get about_cta_button_explore;

  /// No description provided for @edit_profile.
  ///
  /// In en, this message translates to:
  /// **'Edit Profile'**
  String get edit_profile;

  /// No description provided for @current_password.
  ///
  /// In en, this message translates to:
  /// **'Current Password'**
  String get current_password;

  /// No description provided for @new_password.
  ///
  /// In en, this message translates to:
  /// **'New Password'**
  String get new_password;

  /// No description provided for @empty_current_password.
  ///
  /// In en, this message translates to:
  /// **'Please enter your current password'**
  String get empty_current_password;

  /// No description provided for @empty_new_password.
  ///
  /// In en, this message translates to:
  /// **'Please enter a new password'**
  String get empty_new_password;

  /// No description provided for @profile_picture_url.
  ///
  /// In en, this message translates to:
  /// **'Profile Picture URL'**
  String get profile_picture_url;

  /// No description provided for @optional.
  ///
  /// In en, this message translates to:
  /// **'Optional'**
  String get optional;

  /// No description provided for @save_changes.
  ///
  /// In en, this message translates to:
  /// **'Save Changes'**
  String get save_changes;

  /// No description provided for @profile_updated.
  ///
  /// In en, this message translates to:
  /// **'Profile updated successfully'**
  String get profile_updated;

  /// No description provided for @failed_update_profile.
  ///
  /// In en, this message translates to:
  /// **'Failed to update profile: {error}'**
  String failed_update_profile(String error);

  /// No description provided for @updating_profile.
  ///
  /// In en, this message translates to:
  /// **'Updating profile...'**
  String get updating_profile;

  /// No description provided for @fill_at_least_one_field.
  ///
  /// In en, this message translates to:
  /// **'Please fill at least one field to update'**
  String get fill_at_least_one_field;
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
