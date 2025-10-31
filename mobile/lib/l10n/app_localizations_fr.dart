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
  String get invalid_password => 'Le mot de passe doit contenir au moins 6 caractères';

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
  String get confirm_password_differs => 'Les mots de passe ne correspondent pas';

  @override
  String get empty_backend_server_address => 'Entrez une adresse du serveur backend';

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
  String get error_loading_catalogue => 'Erreur lors du chargement du catalogue';

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
  String get backend_not_configured => 'L\'adresse du serveur backend n\'est pas configurée';

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
  String get error_loading_reactions => 'Erreur lors du chargement des réactions';

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
  String get no_services_found => 'Aucun service trouvé. Veuillez vérifier votre connexion.';

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
  String get default_automation_description => 'Créée depuis l\'application mobile';

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

  @override
  String get dashboard => 'Tableau de bord';

  @override
  String get manage_areas_performance => 'Gérez vos Areas et surveillez leurs performances';

  @override
  String get quick_actions => 'Actions rapides';

  @override
  String get connect_services => 'Connecter des services';

  @override
  String get link_new_platforms => 'Lier de nouvelles plateformes';

  @override
  String get browse_templates => 'Parcourir les modèles';

  @override
  String get pre_made_areas => 'Areas pré-faites';

  @override
  String get account_settings => 'Paramètres du compte';

  @override
  String get manage_your_profile => 'Gérer votre profil';

  @override
  String get your_areas => 'Vos Areas';

  @override
  String get total_areas => 'Areas totales';

  @override
  String get connected_services => 'Services connectés';

  @override
  String get no_area_yet => 'Aucune Area pour le moment';

  @override
  String get create_first_area => 'Créez votre première Area pour commencer';

  @override
  String trigger_colon(String trigger) {
    return 'Déclencheur : $trigger';
  }

  @override
  String get automate_your_life => 'Automatisez votre vie avec des connexions puissantes';

  @override
  String get connect_favorite_apps =>
      'Connectez vos applications et services préférés pour créer des automatisations puissantes. Gagnez du temps et concentrez-vous sur ce qui compte vraiment.';

  @override
  String get get_started_free => 'Commencer gratuitement';

  @override
  String get sign_in => 'Se connecter';

  @override
  String get go_to_dashboard => 'Aller au tableau de bord';

  @override
  String get active_automations => '10M+';

  @override
  String get connected_services_count => '500+';

  @override
  String get happy_users => '2M+';

  @override
  String get active_automations_label => 'Automatisations actives';

  @override
  String get connected_services_label => 'Services connectés';

  @override
  String get happy_users_label => 'Utilisateurs satisfaits';

  @override
  String get how_it_works => 'Comment ça marche';

  @override
  String get create_powerful_automations =>
      'Créez des automatisations puissantes en trois étapes simples';

  @override
  String get choose_a_trigger => 'Choisissez un déclencheur';

  @override
  String get select_app_event =>
      'Sélectionnez une application et un événement qui démarre votre automatisation';

  @override
  String get add_an_action => 'Ajoutez une action';

  @override
  String get choose_what_happens =>
      'Choisissez ce qui se passe quand votre déclencheur se déclenche';

  @override
  String get activate_relax => 'Activez et détendez-vous';

  @override
  String get automation_runs_automatically =>
      'Votre automatisation fonctionne automatiquement en arrière-plan';

  @override
  String get popular_automations => 'Automatisations populaires';

  @override
  String get get_inspired => 'Inspirez-vous de ce que les autres construisent';

  @override
  String get email_to_slack => 'Push GitHub vers Slack';

  @override
  String get slack_email_notifications =>
      'Soyez notifié dans Slack quand du code est poussé sur votre dépôt GitHub';

  @override
  String get social_media_sync => 'Rappel quotidien Teams';

  @override
  String get post_multiple_networks =>
      'Envoyez des rappels de stand-up quotidiens sur votre canal Microsoft Teams';

  @override
  String get calendar_reminders => 'Notification PR fusionnée';

  @override
  String get sms_calendar_reminders =>
      'Soyez notifié dans Slack quand une pull request est fusionnée sur GitHub';

  @override
  String get file_backup => 'Alerte changement profil';

  @override
  String get automatic_cloud_backup =>
      'Recevez une notification email quand votre photo de profil Microsoft change';

  @override
  String get task_management => 'Événement calendrier programmé';

  @override
  String get create_tasks_from_emails =>
      'Créez automatiquement des événements calendrier aux heures programmées';

  @override
  String get data_collection => 'Réaction Slack vers Issue';

  @override
  String get save_forms_to_spreadsheets =>
      'Créez une issue GitHub quand quelqu\'un réagit à un message Slack';

  @override
  String get lightning_fast => 'Ultra rapide';

  @override
  String get automations_run_instantly =>
      'Vos automatisations s\'exécutent instantanément quand elles sont déclenchées, sans délais ni attente.';

  @override
  String get save_time => 'Gagnez du temps';

  @override
  String get automate_repetitive_tasks =>
      'Automatisez les tâches répétitives et concentrez-vous sur ce qui compte vraiment pour vous.';

  @override
  String get secure_reliable => 'Sécurisé et fiable';

  @override
  String get enterprise_grade_security =>
      'Sécurité de niveau entreprise avec une garantie de disponibilité de 99,9% pour votre tranquillité d\'esprit.';

  @override
  String get ready_to_automate => 'Prêt à automatiser votre flux de travail ?';

  @override
  String get join_millions_users =>
      'Rejoignez des millions d\'utilisateurs qui économisent déjà du temps avec des automatisations puissantes.';

  @override
  String get go_to_my_areas => 'Aller à Mes AREAs';

  @override
  String get start_for_free => 'Commencer gratuitement';

  @override
  String get copyright_notice => '© 2025 Area. Tous droits réservés.';

  @override
  String get not_authenticated => 'Non authentifié';

  @override
  String get about => 'À propos';

  @override
  String get about_hero_title => 'Optimisez votre workflow avec';

  @override
  String get about_hero_title_highlight => 'l\'automation intelligente';

  @override
  String get about_hero_description =>
      'Nous croyons que la technologie doit travailler pour vous. Notre plateforme connecte vos applications et services préférés, créant des workflows fluides qui vous font gagner du temps et augmentent votre productivité.';

  @override
  String get about_mission_title => 'Notre Mission';

  @override
  String get about_mission_description1 =>
      'Chez Area, notre mission est de rendre l\'automatisation accessible à tous. Que vous soyez professionnel, développeur ou simplement quelqu\'un qui cherche à gagner du temps, nous vous fournissons les outils nécessaires pour connecter votre vie numérique.';

  @override
  String get about_mission_description2 =>
      'Nous croyons que la technologie doit s\'adapter à vos besoins, et non l\'inverse. C\'est pourquoi nous innovons constamment et ajoutons de nouvelles intégrations pour vous aider à travailler plus intelligemment, pas plus dur.';

  @override
  String get about_mission_stats_users => 'Utilisateurs Actifs';

  @override
  String get about_mission_stats_automations => 'Automatisations Actives';

  @override
  String get about_mission_stats_integrations => 'Intégrations';

  @override
  String get about_mission_stats_uptime => 'Disponibilité';

  @override
  String get about_values_title => 'Nos Valeurs';

  @override
  String get about_values_subtitle => 'Les principes qui guident tout ce que nous faisons';

  @override
  String get about_values_user_centric_title => 'Centré sur l\'utilisateur';

  @override
  String get about_values_user_centric_description =>
      'Vos besoins guident notre développement. Nous écoutons vos retours et créons des fonctionnalités importantes.';

  @override
  String get about_values_innovation_title => 'Innovation';

  @override
  String get about_values_innovation_description =>
      'Nous repoussons constamment les limites pour vous apporter le meilleur de la technologie d\'automatisation.';

  @override
  String get about_values_security_title => 'Sécurité Prioritaire';

  @override
  String get about_values_security_description =>
      'La sécurité de vos données est notre priorité absolue. Nous utilisons le chiffrement et les pratiques de sécurité de pointe.';

  @override
  String get about_values_global_title => 'Portée Mondiale';

  @override
  String get about_values_global_description =>
      'Disponible en plusieurs langues et régions, au service d\'utilisateurs dans le monde entier.';

  @override
  String get about_values_open_source_title => 'Open Source';

  @override
  String get about_values_open_source_description =>
      'Nous croyons en la transparence et contribuons à la communauté open source.';

  @override
  String get about_values_passion_title => 'Passion';

  @override
  String get about_values_passion_description =>
      'Nous aimons ce que nous faisons, et cela se voit dans chaque fonctionnalité que nous créons.';

  @override
  String get about_story_title => 'Notre Histoire';

  @override
  String get about_story_paragraph1 =>
      'Area est né d\'une idée simple : et si nous pouvions faciliter l\'automatisation de la vie numérique de chacun ? Nous avons vu des gens passer d\'innombrables heures sur des tâches répétitives, basculer entre les applications et transférer manuellement des données.';

  @override
  String get about_story_paragraph2 =>
      'Nous savions qu\'il devait y avoir un meilleur moyen. Nous nous sommes donc lancés dans la construction d\'une plateforme qui connecterait tous les outils et services que les gens utilisent quotidiennement, facilitant la création d\'automatisations puissantes sans écrire une seule ligne de code.';

  @override
  String get about_story_paragraph3 =>
      'Depuis notre lancement, nous avons aidé des millions d\'utilisateurs à gagner du temps et à augmenter leur productivité. Nous sommes passés d\'une petite équipe avec une grande vision à une plateforme mondiale au service d\'utilisateurs dans le monde entier.';

  @override
  String get about_story_paragraph4 =>
      'Mais nous ne faisons que commencer. Chaque jour, nous travaillons sur de nouvelles intégrations, fonctionnalités et améliorations pour rendre Area encore meilleur. Merci de faire partie de notre aventure.';

  @override
  String get about_technology_title => 'Construit avec des Technologies Modernes';

  @override
  String get about_technology_subtitle => 'Propulsé par des outils et frameworks de pointe';

  @override
  String get about_why_choose_title => 'Pourquoi Choisir Area ?';

  @override
  String get about_why_choose_subtitle => 'Voici ce qui nous rend différents';

  @override
  String get about_why_choose_easy_to_use_title => 'Facile à Utiliser';

  @override
  String get about_why_choose_easy_to_use_description =>
      'Aucun code requis. Notre interface intuitive rend la création d\'automatisations simple et amusante.';

  @override
  String get about_why_choose_lightning_fast_title => 'Ultra Rapide';

  @override
  String get about_why_choose_lightning_fast_description =>
      'Vos automatisations s\'exécutent instantanément avec une latence minimale pour des résultats en temps réel.';

  @override
  String get about_why_choose_enterprise_security_title => 'Sécurité d\'Entreprise';

  @override
  String get about_why_choose_enterprise_security_description =>
      'Sécurité de niveau bancaire avec chiffrement, conformité et audits de sécurité réguliers.';

  @override
  String get about_why_choose_amazing_support_title => 'Support Exceptionnel';

  @override
  String get about_why_choose_amazing_support_description =>
      'Notre équipe de support dédiée est là pour vous aider à réussir à chaque étape.';

  @override
  String get about_cta_title => 'Prêt à Transformer Votre Workflow ?';

  @override
  String get about_cta_description =>
      'Rejoignez des milliers d\'utilisateurs qui économisent déjà du temps avec Area. Commencez à automatiser dès aujourd\'hui.';

  @override
  String get about_cta_button_dashboard => 'Aller au Tableau de bord';

  @override
  String get about_cta_button_start => 'Commencer Gratuitement';

  @override
  String get about_cta_button_explore => 'Explorer les Services';

  @override
  String get edit_profile => 'Modifier le profil';

  @override
  String get current_password => 'Mot de passe actuel';

  @override
  String get new_password => 'Nouveau mot de passe';

  @override
  String get empty_current_password => 'Entrez votre mot de passe actuel';

  @override
  String get empty_new_password => 'Entrez un nouveau mot de passe';

  @override
  String get profile_picture_url => 'URL de la photo de profil';

  @override
  String get optional => 'Optionnel';

  @override
  String get save_changes => 'Enregistrer les modifications';

  @override
  String get profile_updated => 'Profil mis à jour avec succès';

  @override
  String failed_update_profile(String error) {
    return 'Échec de la mise à jour du profil : $error';
  }

  @override
  String get updating_profile => 'Mise à jour du profil...';

  @override
  String get fill_at_least_one_field =>
      'Veuillez remplir au moins un champ pour mettre à jour';
}
