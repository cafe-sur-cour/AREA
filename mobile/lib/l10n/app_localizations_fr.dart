// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for French (`fr`).
class AppLocalizationsFr extends AppLocalizations {
  AppLocalizationsFr([String locale = 'fr']) : super(locale);

  @override
  String get label_home => 'Accueil';

  @override
  String get label_catalogue => 'Catalogue';

  @override
  String get label_add => 'Créer';

  @override
  String get label_areas => 'AREAs';

  @override
  String get label_profile => 'Profil';

  @override
  String get logout => 'Déconnexion';

  @override
  String get login => 'Connexion';

  @override
  String get register => 'Inscription';

  @override
  String get not_connected => 'Non connecté';

  @override
  String get backend_server_address => 'Adresse du serveur backend';

  @override
  String get email => 'Email';

  @override
  String get empty_email => 'Entrez votre email';

  @override
  String get invalid_email => 'Entrez un email valide';

  @override
  String get password => 'Mot de passe';

  @override
  String get empty_password => 'Entrez votre mot de passe';

  @override
  String get invalid_password =>
      'Le mot de passe doit contenir au moins 6 caractères';

  @override
  String get forgot_password_question => 'Mot de passe oublié ?';

  @override
  String get forgot_password => 'Mot de passe oublié';

  @override
  String get confirm_email => 'Confirmer l\'email';

  @override
  String get confirm_email_differs => 'Les mails ne correspondent pas';

  @override
  String get email_sent => 'Email envoyé';

  @override
  String get send => 'Envoyer';

  @override
  String get name => 'Nom';

  @override
  String get empty_name => 'Entrez votre nom';

  @override
  String get invalid_name => 'Le nom doit contenir moins de 38 caractères';

  @override
  String get confirm_password => 'Confirmer le mot de passe';

  @override
  String get confirm_password_differs =>
      'Les mots de passe ne correspondent pas';

  @override
  String get empty_backend_server_address =>
      'Entrez une adresse du serveur backend';

  @override
  String get invalid_backend_server_address => 'L\'adresse n\'est pas valide';

  @override
  String get valid_backend_server_address => 'L\'adresse est valide';

  @override
  String get user_registered => 'Utilisateur créé';

  @override
  String get logged_in => 'Connexion réussie';

  @override
  String get logged_out => 'Déconnexion réussie';

  @override
  String get services => 'Services';

  @override
  String get cancel => 'Annuler';

  @override
  String get confirm => 'Confirmer';

  @override
  String get delete => 'Supprimer';

  @override
  String get retry => 'Réessayer';

  @override
  String get loading => 'Chargement';

  @override
  String get error => 'Erreur';

  @override
  String get welcome_home => 'Bienvenue sur la page d\'accueil';

  @override
  String get github => 'GitHub';

  @override
  String get google => 'Google';

  @override
  String get microsoft => 'Microsoft';

  @override
  String github_login_failed(String error) {
    return 'Échec de la connexion GitHub : $error';
  }

  @override
  String google_login_failed(String error) {
    return 'Échec de la connexion Google : $error';
  }

  @override
  String failed_open_browser(String error) {
    return 'Impossible d\'ouvrir le navigateur : $error';
  }

  @override
  String connect_service(String serviceName) {
    return 'Connecter $serviceName';
  }

  @override
  String service_login(String providerName) {
    return 'Connexion $providerName';
  }

  @override
  String get loading_authentication => 'Chargement de l\'authentification...';

  @override
  String get authentication_error => 'Erreur d\'authentification';

  @override
  String get set_delay => 'Définir le délai';

  @override
  String set_delay_for(String reactionName) {
    return 'Définir le délai pour\n$reactionName';
  }

  @override
  String get days => 'Jours';

  @override
  String get hours => 'Heures';

  @override
  String get minutes => 'Minutes';

  @override
  String get seconds => 'Secondes';

  @override
  String total_delay(String delay) {
    return 'Délai total : $delay';
  }

  @override
  String get no_delay => 'Aucun délai';

  @override
  String get automation_name => 'Nom';

  @override
  String get automation_description => 'Description';

  @override
  String get name_required => 'Le nom est requis';

  @override
  String failed_create_automation(String error) {
    return 'Échec de création de l\'automatisation : $error';
  }

  @override
  String get delete_automation => 'Supprimer l\'automatisation';

  @override
  String delete_automation_confirm(String automationName) {
    return 'Êtes-vous sûr de vouloir supprimer \"$automationName\" ?';
  }

  @override
  String error_deleting_automation(String error) {
    return 'Erreur lors de la suppression de l\'automatisation : $error';
  }

  @override
  String get active => 'Actif';

  @override
  String get inactive => 'Inactif';

  @override
  String get deactivate_automation => 'Désactiver l\'automatisation';

  @override
  String get activate_automation => 'Activer l\'automatisation';

  @override
  String get delete_automation_tooltip => 'Supprimer l\'automatisation';

  @override
  String get action => 'Action :';

  @override
  String get reaction => 'Réaction :';

  @override
  String get reactions => 'Réactions :';

  @override
  String get error_loading_automations => 'Erreur de chargement';

  @override
  String get no_automations_yet => 'Aucune automatisation';

  @override
  String get connect_to_create => 'Connectez-vous pour créer la première';

  @override
  String get create_first_automation => 'Créez votre première automatisation';

  @override
  String get my_areas => 'Mes AREAs';

  @override
  String get all => 'Tout';

  @override
  String get actions => 'Actions';

  @override
  String get reactions_filter => 'Réactions';

  @override
  String get error_loading_catalogue =>
      'Erreur lors du chargement du catalogue';

  @override
  String get no_items_available => 'Aucun élément disponible';

  @override
  String no_filter_available(String filter) {
    return 'Aucun $filter disponible';
  }

  @override
  String get no_description_available => 'Aucune description disponible';

  @override
  String get use_as_action => 'Utiliser comme action';

  @override
  String get use_as_reaction => 'Utiliser comme réaction';

  @override
  String get backend_not_configured =>
      'L\'adresse du serveur backend n\'est pas configurée';

  @override
  String failed_load_item(String itemType, String error) {
    return 'Échec du chargement de $itemType : $error';
  }

  @override
  String get action_lower => 'l\'action';

  @override
  String get reaction_lower => 'la réaction';

  @override
  String get loading_services => 'Chargement des services...';

  @override
  String failed_load_services(String error) {
    return 'Échec du chargement des services : $error';
  }

  @override
  String connecting_to_service(String serviceName) {
    return 'Connexion à $serviceName...';
  }

  @override
  String failed_connect_service(String serviceName, String error) {
    return 'Échec de connexion à $serviceName : $error';
  }

  @override
  String unsubscribe_confirm(String serviceName) {
    return 'Êtes-vous sûr de vouloir vous désabonner de $serviceName ? Cela arrêtera toutes les automatisations utilisant ce service.';
  }

  @override
  String unsubscribing_from_service(String serviceName) {
    return 'Désabonnement de $serviceName...';
  }

  @override
  String get error_loading_services => 'Erreur lors du chargement des services';

  @override
  String get loading_reactions => 'Chargement des réactions...';

  @override
  String get error_loading_reactions =>
      'Erreur lors du chargement des réactions';

  @override
  String get loading_actions => 'Chargement des actions...';

  @override
  String get error_loading_actions => 'Erreur lors du chargement des actions';

  @override
  String get action_services => 'Services d\'actions';

  @override
  String get reaction_services => 'Services de réactions';

  @override
  String get no_services_available => 'Aucun service disponible';

  @override
  String get no_services_with_actions =>
      'Il n\'y a aucun service avec des actions disponibles pour le moment.';

  @override
  String get no_services_with_reactions =>
      'Il n\'y a aucun service avec des réactions disponibles pour le moment.';

  @override
  String get no_services_available_title => 'Aucun service disponible';

  @override
  String get no_services_found =>
      'Aucun service trouvé. Veuillez vérifier votre connexion.';

  @override
  String get and => 'ET';

  @override
  String get then => 'PUIS';

  @override
  String get action_label => 'Action';

  @override
  String get reaction_label => 'REAction';

  @override
  String clear_all_reactions(int count) {
    return 'Effacer toutes les réactions ($count)';
  }

  @override
  String get create_automation => 'Créer l\'automatisation';

  @override
  String get please_add_action_and_reaction =>
      'Veuillez ajouter une action et au moins une réaction';

  @override
  String get configure_automation => 'Configurer l\'automatisation';

  @override
  String get invalid_automation_state => 'État d\'automatisation invalide';

  @override
  String get go_back_select_action_reaction =>
      'Veuillez revenir en arrière et sélectionner une action et au moins une réaction.';

  @override
  String get automation_details => 'Détails de l\'automatisation';

  @override
  String action_colon(String actionName) {
    return 'Action : $actionName';
  }

  @override
  String reaction_number(int number, String reactionName) {
    return 'Réaction $number : $reactionName';
  }

  @override
  String get no_additional_config =>
      'Cette action ne nécessite aucune configuration supplémentaire.';

  @override
  String get no_additional_config_reaction =>
      'Cette réaction ne nécessite aucune configuration supplémentaire.';

  @override
  String get creating_automation => 'Création de l\'automatisation...';

  @override
  String get automation_created_success => 'Automatisation créée avec succès !';

  @override
  String field_required(String fieldName) {
    return '$fieldName est requis';
  }

  @override
  String get valid_email_required => 'Veuillez entrer une adresse email valide';

  @override
  String get valid_number_required => 'Veuillez entrer un nombre valide';

  @override
  String invalid_select_field(String fieldName) {
    return 'Champ de sélection invalide : $fieldName n\'a pas d\'options';
  }

  @override
  String type_brace_for_suggestions(String character) {
    return 'Tapez $character pour voir les suggestions de données d\'action';
  }

  @override
  String example(String example) {
    return 'Exemple : $example';
  }

  @override
  String get edit => 'Modifier';

  @override
  String get set => 'Définir';

  @override
  String default_automation_name(String timestamp) {
    return 'Mon automatisation $timestamp';
  }

  @override
  String get default_automation_description =>
      'Créée depuis l\'application mobile';

  @override
  String get backend_server_not_configured =>
      'L\'adresse du serveur backend n\'est pas configurée';

  @override
  String action_failed(String error) {
    return 'Action échouée : $error';
  }

  @override
  String successfully_connected_to(String serviceName) {
    return 'Connecté avec succès à $serviceName';
  }

  @override
  String unsubscribe_from(String serviceName) {
    return 'Se désabonner de $serviceName';
  }

  @override
  String unsubscribed_from(String serviceName) {
    return 'Désabonné de $serviceName';
  }

  @override
  String unsubscribe_failed(String error) {
    return 'Échec du désabonnement : $error';
  }

  @override
  String get connected => 'Connecté';

  @override
  String get not_subscribed => 'Non abonné';

  @override
  String get unsubscribe => 'Se désabonner';

  @override
  String get subscribe => 'S\'abonner';

  @override
  String get connect_and_subscribe => 'Connecter et s\'abonner';

  @override
  String get retry_failed => 'Nouvelle tentative échouée. Veuillez réessayer.';

  @override
  String retrying(int count, int max) {
    return 'Nouvelle tentative... ($count/$max)';
  }

  @override
  String get max_retries_reached => 'Nombre maximum de tentatives atteint';

  @override
  String get failed_to_load_authentication =>
      'Échec du chargement de la page d\'authentification';

  @override
  String retrying_count(int count, int max) {
    return 'Nouvelle tentative... ($count/$max)';
  }

  @override
  String get description => 'Description';

  @override
  String get parameters => 'Paramètres';

  @override
  String get required_lowercase => 'requis';

  @override
  String get choose_this_action => 'Choisir cette action';

  @override
  String get choose_this_reaction => 'Choisir cette réaction';

  @override
  String service_subscription_failed(String error) {
    return 'Échec d\'abonnement au service : $error';
  }

  @override
  String complete_service_setup(String serviceName) {
    return 'Terminez la configuration de $serviceName dans votre navigateur, puis revenez à l\'application.';
  }
}
