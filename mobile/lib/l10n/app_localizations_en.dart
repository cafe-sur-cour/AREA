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
  String get email_sent => 'Email sent';

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

  @override
  String get cancel => 'Cancel';

  @override
  String get confirm => 'Confirm';

  @override
  String get delete => 'Delete';

  @override
  String get retry => 'Retry';

  @override
  String get loading => 'Loading';

  @override
  String get error => 'Error';

  @override
  String get welcome_home => 'Welcome to home page';

  @override
  String get github => 'GitHub';

  @override
  String get google => 'Google';

  @override
  String get microsoft => 'Microsoft';

  @override
  String github_login_failed(String error) {
    return 'GitHub login failed: $error';
  }

  @override
  String google_login_failed(String error) {
    return 'Google login failed: $error';
  }

  @override
  String failed_open_browser(String error) {
    return 'Failed to open browser: $error';
  }

  @override
  String connect_service(String serviceName) {
    return 'Connect $serviceName';
  }

  @override
  String service_login(String providerName) {
    return '$providerName Login';
  }

  @override
  String get loading_authentication => 'Loading authentication...';

  @override
  String get authentication_error => 'Authentication Error';

  @override
  String get set_delay => 'Set Delay';

  @override
  String set_delay_for(String reactionName) {
    return 'Set Delay for\n$reactionName';
  }

  @override
  String get days => 'Days';

  @override
  String get hours => 'Hours';

  @override
  String get minutes => 'Minutes';

  @override
  String get seconds => 'Seconds';

  @override
  String total_delay(String delay) {
    return 'Total delay: $delay';
  }

  @override
  String get no_delay => 'No delay';

  @override
  String get automation_name => 'Name';

  @override
  String get automation_description => 'Description';

  @override
  String get name_required => 'Name is required';

  @override
  String failed_create_automation(String error) {
    return 'Failed to create automation: $error';
  }

  @override
  String get delete_automation => 'Delete Automation';

  @override
  String delete_automation_confirm(String automationName) {
    return 'Are you sure you want to delete \"$automationName\"?';
  }

  @override
  String error_deleting_automation(String error) {
    return 'Error deleting automation: $error';
  }

  @override
  String get active => 'Active';

  @override
  String get inactive => 'Inactive';

  @override
  String get deactivate_automation => 'Deactivate automation';

  @override
  String get activate_automation => 'Activate automation';

  @override
  String get delete_automation_tooltip => 'Delete automation';

  @override
  String get action => 'Action:';

  @override
  String get reaction => 'Reaction:';

  @override
  String get reactions => 'Reactions:';

  @override
  String get error_loading_automations => 'Error loading automations';

  @override
  String get no_automations_yet => 'No automations yet';

  @override
  String get connect_to_create => 'Connect to create your first automation';

  @override
  String get create_first_automation =>
      'Create your first automation to get started';

  @override
  String get my_areas => 'My AREAs';

  @override
  String get all => 'All';

  @override
  String get actions => 'Actions';

  @override
  String get reactions_filter => 'Reactions';

  @override
  String get error_loading_catalogue => 'Error loading catalogue';

  @override
  String get no_items_available => 'No items available';

  @override
  String no_filter_available(String filter) {
    return 'No $filter available';
  }

  @override
  String get no_description_available => 'No description available';

  @override
  String get use_as_action => 'Use as Action';

  @override
  String get use_as_reaction => 'Use as Reaction';

  @override
  String get backend_not_configured =>
      'Backend server address is not configured';

  @override
  String failed_load_item(String itemType, String error) {
    return 'Failed to load $itemType: $error';
  }

  @override
  String get action_lower => 'action';

  @override
  String get reaction_lower => 'reaction';

  @override
  String get loading_services => 'Loading services...';

  @override
  String failed_load_services(String error) {
    return 'Failed to load services: $error';
  }

  @override
  String connecting_to_service(String serviceName) {
    return 'Connecting to $serviceName...';
  }

  @override
  String failed_connect_service(String serviceName, String error) {
    return 'Failed to connect to $serviceName: $error';
  }

  @override
  String unsubscribe_confirm(String serviceName) {
    return 'Are you sure you want to unsubscribe from $serviceName? This will stop all automations using this service.';
  }

  @override
  String unsubscribing_from_service(String serviceName) {
    return 'Unsubscribing from $serviceName...';
  }

  @override
  String get error_loading_services => 'Error loading services';

  @override
  String get loading_reactions => 'Loading reactions...';

  @override
  String get error_loading_reactions => 'Error loading reactions';

  @override
  String get loading_actions => 'Loading actions...';

  @override
  String get error_loading_actions => 'Error loading actions';

  @override
  String get action_services => 'Action Services';

  @override
  String get reaction_services => 'Reaction Services';

  @override
  String get no_services_available => 'No services available';

  @override
  String get no_services_with_actions =>
      'There are no services with actions available at the moment.';

  @override
  String get no_services_with_reactions =>
      'There are no services with reactions available at the moment.';

  @override
  String get no_services_available_title => 'No Services Available';

  @override
  String get no_services_found =>
      'No services found. Please check your connection.';

  @override
  String get and => 'AND';

  @override
  String get then => 'THEN';

  @override
  String get action_label => 'Action';

  @override
  String get reaction_label => 'REAction';

  @override
  String clear_all_reactions(int count) {
    return 'Clear All Reactions ($count)';
  }

  @override
  String get create_automation => 'Create Automation';

  @override
  String get please_add_action_and_reaction =>
      'Please add both an action and at least one reaction';

  @override
  String get configure_automation => 'Configure Automation';

  @override
  String get invalid_automation_state => 'Invalid automation state';

  @override
  String get go_back_select_action_reaction =>
      'Please go back and select both an action and at least one reaction.';

  @override
  String get automation_details => 'Automation Details';

  @override
  String action_colon(String actionName) {
    return 'Action: $actionName';
  }

  @override
  String reaction_number(int number, String reactionName) {
    return 'Reaction $number: $reactionName';
  }

  @override
  String get no_additional_config =>
      'This action requires no additional configuration.';

  @override
  String get no_additional_config_reaction =>
      'This reaction requires no additional configuration.';

  @override
  String get creating_automation => 'Creating Automation...';

  @override
  String get automation_created_success => 'Automation created successfully!';

  @override
  String field_required(String fieldName) {
    return '$fieldName is required';
  }

  @override
  String get valid_email_required => 'Please enter a valid email address';

  @override
  String get valid_number_required => 'Please enter a valid number';

  @override
  String invalid_select_field(String fieldName) {
    return 'Invalid select field: $fieldName has no options';
  }

  @override
  String type_brace_for_suggestions(String character) {
    return 'Type $character to see action data suggestions';
  }

  @override
  String example(String example) {
    return 'Example: $example';
  }

  @override
  String get edit => 'Edit';

  @override
  String get set => 'Set';

  @override
  String default_automation_name(String timestamp) {
    return 'My Automation $timestamp';
  }

  @override
  String get default_automation_description => 'Created from mobile app';

  @override
  String get backend_server_not_configured =>
      'Backend server address not configured';

  @override
  String action_failed(String error) {
    return 'Action failed: $error';
  }

  @override
  String successfully_connected_to(String serviceName) {
    return 'Successfully connected to $serviceName';
  }

  @override
  String unsubscribe_from(String serviceName) {
    return 'Unsubscribe from $serviceName';
  }

  @override
  String unsubscribed_from(String serviceName) {
    return 'Unsubscribed from $serviceName';
  }

  @override
  String unsubscribe_failed(String error) {
    return 'Unsubscribe failed: $error';
  }

  @override
  String get connected => 'Connected';

  @override
  String get not_subscribed => 'Not Subscribed';

  @override
  String get unsubscribe => 'Unsubscribe';

  @override
  String get subscribe => 'Subscribe';

  @override
  String get connect_and_subscribe => 'Connect & Subscribe';

  @override
  String get retry_failed => 'Retry failed. Please try again.';

  @override
  String retrying(int count, int max) {
    return 'Retrying... ($count/$max)';
  }

  @override
  String get max_retries_reached => 'Max retries reached';

  @override
  String get failed_to_load_authentication =>
      'Failed to load authentication page';

  @override
  String retrying_count(int count, int max) {
    return 'Retrying... ($count/$max)';
  }

  @override
  String get description => 'Description';

  @override
  String get parameters => 'Parameters';

  @override
  String get required_lowercase => 'required';

  @override
  String get choose_this_action => 'Choose this Action';

  @override
  String get choose_this_reaction => 'Choose this Reaction';

  @override
  String service_subscription_failed(String error) {
    return 'Service subscription failed: $error';
  }

  @override
  String complete_service_setup(String serviceName) {
    return 'Complete $serviceName setup in your browser, then return to the app.';
  }

  @override
  String get dashboard => 'Dashboard';

  @override
  String get manage_areas_performance =>
      'Manage your Areas and monitor their performance';

  @override
  String get quick_actions => 'Quick actions';

  @override
  String get connect_services => 'Connect Services';

  @override
  String get link_new_platforms => 'Link new platforms';

  @override
  String get browse_templates => 'Browse Templates';

  @override
  String get pre_made_areas => 'Pre-made Areas';

  @override
  String get account_settings => 'Account Settings';

  @override
  String get manage_your_profile => 'Manage your profile';

  @override
  String get your_areas => 'Your Areas';

  @override
  String get total_areas => 'Total Areas';

  @override
  String get connected_services => 'Connected Services';

  @override
  String get no_area_yet => 'No Area yet';

  @override
  String get create_first_area => 'Create your first Area to get started';

  @override
  String trigger_colon(String trigger) {
    return 'Trigger: $trigger';
  }

  @override
  String get automate_your_life =>
      'Automate your life with powerful connections';

  @override
  String get connect_favorite_apps =>
      'Connect your favorite apps and services to create powerful automations. Save time and focus on what matters most.';

  @override
  String get get_started_free => 'Get started free';

  @override
  String get sign_in => 'Sign in';

  @override
  String get go_to_dashboard => 'Go to Dashboard';

  @override
  String get active_automations => '10M+';

  @override
  String get connected_services_count => '500+';

  @override
  String get happy_users => '2M+';

  @override
  String get active_automations_label => 'Active automations';

  @override
  String get connected_services_label => 'Connected services';

  @override
  String get happy_users_label => 'Happy users';

  @override
  String get how_it_works => 'How it works';

  @override
  String get create_powerful_automations =>
      'Create powerful automations in three simple steps';

  @override
  String get choose_a_trigger => 'Choose a trigger';

  @override
  String get select_app_event =>
      'Select an app and event that starts your automation';

  @override
  String get add_an_action => 'Add an action';

  @override
  String get choose_what_happens =>
      'Choose what happens when your trigger fires';

  @override
  String get activate_relax => 'Activate & relax';

  @override
  String get automation_runs_automatically =>
      'Your automation runs automatically in the background';

  @override
  String get popular_automations => 'Popular automations';

  @override
  String get get_inspired => 'Get inspired by what others are building';

  @override
  String get email_to_slack => 'Email to Slack';

  @override
  String get slack_email_notifications =>
      'Get notified in Slack when you receive important emails';

  @override
  String get social_media_sync => 'Social Media Sync';

  @override
  String get post_multiple_networks =>
      'Post to multiple social networks at once';

  @override
  String get calendar_reminders => 'Calendar Reminders';

  @override
  String get sms_calendar_reminders =>
      'Send SMS reminders before calendar events';

  @override
  String get file_backup => 'File Backup';

  @override
  String get automatic_cloud_backup =>
      'Automatically backup files to cloud storage';

  @override
  String get task_management => 'Task Management';

  @override
  String get create_tasks_from_emails => 'Create tasks from emails or messages';

  @override
  String get data_collection => 'Data Collection';

  @override
  String get save_forms_to_spreadsheets =>
      'Save form responses to spreadsheets';

  @override
  String get lightning_fast => 'Lightning fast';

  @override
  String get automations_run_instantly =>
      'Your automations run instantly when triggered, with no delays or waiting.';

  @override
  String get save_time => 'Save time';

  @override
  String get automate_repetitive_tasks =>
      'Automate repetitive tasks and focus on what really matters to you.';

  @override
  String get secure_reliable => 'Secure & reliable';

  @override
  String get enterprise_grade_security =>
      'Enterprise-grade security with 99.9% uptime guarantee for your peace of mind.';

  @override
  String get ready_to_automate => 'Ready to automate your workflow?';

  @override
  String get join_millions_users =>
      'Join millions of users who are already saving time with powerful automations.';

  @override
  String get go_to_my_areas => 'Go to My AREAs';

  @override
  String get start_for_free => 'Start for free';

  @override
  String get copyright_notice => '© 2025 Area. All rights reserved.';

  @override
  String get not_authenticated => 'Not authenticated';
}
