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
  String get empty_backend_server_address => 'L\'adresse ne peut pas être vide';

  @override
  String get invalid_backend_server_address => 'L\'adresse n\'est pas valide';

  @override
  String get valid_backend_server_address => 'L\'adresse est valide';
}
