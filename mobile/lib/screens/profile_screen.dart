import 'dart:convert';
import 'package:area/core/config/app_config.dart';
import 'package:area/core/constants/app_colors.dart';
import 'package:area/core/constants/app_constants.dart';
import 'package:area/core/notifiers/backend_address_notifier.dart';
import 'package:area/core/notifiers/locale_notifier.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/services/secure_storage.dart';
import 'package:area/services/secure_http_client.dart';
import 'package:area/widgets/common/buttons/primary_button.dart';
import 'package:area/widgets/common/snackbars/app_snackbar.dart';
import 'package:area/widgets/common/state/loading_state.dart';
import 'package:area/widgets/common/text_fields/app_text_field.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  ProfileScreenState createState() => ProfileScreenState();
}

class ProfileScreenState extends State<ProfileScreen> {
  bool _isConnected = false;
  bool _isLoading = true;
  late String _userName;
  late IconData _userProfileIcon;
  final TextEditingController _backendServerController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _backendServerController.text = "";
    _loadProfileIfConnected();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initializeBackendAddress();
    });
  }

  void _initializeBackendAddress() {
    final backendAddressNotifier = Provider.of<BackendAddressNotifier>(context, listen: false);
    if (backendAddressNotifier.backendAddress == null) {
      backendAddressNotifier.setBackendAddress(AppConfig.backendUrl);
    }
    if (backendAddressNotifier.backendAddress != null &&
        !backendAddressNotifier.backendAddress!.endsWith("/")) {
      backendAddressNotifier.setBackendAddress("${backendAddressNotifier.backendAddress!}/");
    }
    _backendServerController.text = backendAddressNotifier.backendAddress ?? "";
  }

  void _loadProfileIfConnected() async {
    final jwt = await getJwt();
    if (jwt != null && jwt.isNotEmpty) {
      await _updateProfile();
    } else {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _testApiAddress(String address) async {
    if (!address.endsWith('/')) {
      address += '/';
    }
    final url = Uri.parse("$address${AppRoutes.healthCheck}");

    late String message;
    late Color color;

    final appLocalizations = AppLocalizations.of(context);
    final backendAddressNotifier = Provider.of<BackendAddressNotifier>(context, listen: false);

    try {
      final client = SecureHttpClient.getClient();
      final response = await client.get(url);

      if (response.statusCode != 200) {
        throw response.body;
      }

      final jsonResponse = jsonDecode(response.body);
      if (jsonResponse['status'] != 'OK') {
        throw jsonResponse['status'];
      }

      message = appLocalizations!.valid_backend_server_address;
      color = AppColors.success;
      backendAddressNotifier.setBackendAddress(address);
    } catch (e) {
      message = appLocalizations!.invalid_backend_server_address;
      color = AppColors.error;
      _backendServerController.text = backendAddressNotifier.backendAddress ?? "";
    }

    if (mounted) {
      if (color == AppColors.success) {
        showSuccessSnackbar(context, message);
      } else {
        showErrorSnackbar(context, message);
      }
    }
  }

  void _logout() async {
    final backendAddressNotifier = Provider.of<BackendAddressNotifier>(context, listen: false);

    if (backendAddressNotifier.backendAddress == null) {
      showErrorSnackbar(context, AppLocalizations.of(context)!.empty_backend_server_address);
      return;
    }
    final address = "${backendAddressNotifier.backendAddress}${AppRoutes.logout}";

    final appLocalizations = AppLocalizations.of(context);

    final jwt = await getJwt();
    if (jwt == null) {
      if (mounted) {
        showErrorSnackbar(context, appLocalizations!.not_connected);
      }
      return;
    }

    final headers = {'Authorization': "Bearer $jwt"};

    final url = Uri.parse(address);
    try {
      final client = SecureHttpClient.getClient();
      final response = await client.post(url, headers: headers);
      final data = await jsonDecode(response.body);

      if (response.statusCode != 200) {
        throw data['error'];
      }

      await deleteJwt();

      setState(() {
        _isConnected = false;
        _isLoading = false;
        _userName = "";
        _userProfileIcon = Icons.account_circle;
      });

      if (mounted) {
        showSuccessSnackbar(context, AppLocalizations.of(context)!.logged_out);
      }
    } catch (e) {
      if (mounted) {
        showErrorSnackbar(context, e.toString());
      }
    }
  }

  Future<void> _updateProfile() async {
    final backendAddressNotifier = Provider.of<BackendAddressNotifier>(context, listen: false);

    if (backendAddressNotifier.backendAddress == null) {
      showErrorSnackbar(context, AppLocalizations.of(context)!.empty_backend_server_address);
      setState(() {
        _isLoading = false;
      });
      return;
    }
    final address = "${backendAddressNotifier.backendAddress}${AppRoutes.me}";
    final url = Uri.parse(address);

    try {
      final jwt = await getJwt();
      final client = SecureHttpClient.getClient();
      final response = await client.get(url, headers: {'Authorization': "Bearer $jwt"});
      final data = await jsonDecode(response.body);

      if (response.statusCode != 200) {
        if (response.statusCode == 401 || response.statusCode == 404) {
          await deleteJwt();
          setState(() {
            _isConnected = false;
            _isLoading = false;
            _userName = "";
            _userProfileIcon = Icons.account_circle;
          });
        }
        throw data['error'];
      }

      setState(() {
        _userName = data['name'];
        _userProfileIcon = Icons.account_circle;
        _isConnected = true;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        showErrorSnackbar(context, e.toString());
      }
    }
  }

  void _showLanguageSelectionDialog(BuildContext context, LocaleNotifier localeNotifier) {
    showDialog(
      context: context,
      builder: (BuildContext dialogContext) {
        return AlertDialog(
          title: const Text('Language'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                title: const Text('English'),
                trailing: localeNotifier.locale.languageCode == 'en'
                    ? const Icon(Icons.check, color: Colors.green)
                    : null,
                onTap: () {
                  Navigator.of(dialogContext).pop();
                  if (localeNotifier.locale.languageCode != 'en') {
                    localeNotifier.setLocale(const Locale('en'));
                  }
                },
              ),
              ListTile(
                title: const Text('Français'),
                trailing: localeNotifier.locale.languageCode == 'fr'
                    ? const Icon(Icons.check, color: Colors.green)
                    : null,
                onTap: () {
                  Navigator.of(dialogContext).pop();
                  if (localeNotifier.locale.languageCode != 'fr') {
                    localeNotifier.setLocale(const Locale('fr'));
                  }
                },
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final localeNotifier = Provider.of<LocaleNotifier>(context);

    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: _isLoading
            ? const LoadingState()
            : Column(
                mainAxisAlignment: MainAxisAlignment.start,
                children: [
                  const SizedBox(height: 30),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      GestureDetector(
                        onTap: () {
                          _showLanguageSelectionDialog(context, localeNotifier);
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 8.0),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(color: Colors.transparent),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                localeNotifier.locale.languageCode.toUpperCase(),
                                style: TextStyle(
                                  fontSize: 16,
                                  color: Theme.of(context).primaryColor,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),

                              const SizedBox(width: 4),

                              Icon(
                                Icons.keyboard_arrow_down,
                                size: 16,
                                color: Theme.of(context).primaryColor,
                              ),
                            ],
                          ),
                        ),
                      ),
                      if (_isConnected) ...[
                        TextButton(
                          onPressed: _logout,
                          child: Text(
                            AppLocalizations.of(context)!.logout,
                            style: TextStyle(
                              fontSize: 18,
                              color: Theme.of(context).primaryColor,
                            ),
                          ),
                        ),
                      ] else ...[
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            TextButton(
                              onPressed: () {
                                Navigator.pushNamed(context, '/login').then((result) {
                                  if (result == true) {
                                    _updateProfile();
                                  }
                                });
                              },
                              child: Text(
                                AppLocalizations.of(context)!.login,
                                style: TextStyle(
                                  fontSize: 18,
                                  color: Theme.of(context).primaryColor,
                                ),
                              ),
                            ),
                            TextButton(
                              onPressed: () {
                                Navigator.pushNamed(context, '/register');
                              },
                              child: Text(
                                AppLocalizations.of(context)!.register,
                                style: TextStyle(
                                  fontSize: 18,
                                  color: Theme.of(context).primaryColor,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),

                  SizedBox(
                    height: 250,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        if (_isConnected) ...[
                          Icon(_userProfileIcon, size: 80),

                          const SizedBox(width: 16),

                          Flexible(
                            child: Text(
                              _userName,
                              style: Theme.of(context).textTheme.headlineLarge,
                              overflow: TextOverflow.visible,
                              softWrap: true,
                            ),
                          ),
                        ] else ...[
                          const Icon(Icons.account_circle, size: 80),

                          const SizedBox(width: 16),

                          Flexible(
                            child: Text(
                              AppLocalizations.of(context)!.not_connected,
                              style: Theme.of(context).textTheme.headlineMedium,
                              overflow: TextOverflow.visible,
                              softWrap: true,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  AppTextField(
                    controller: _backendServerController,
                    labelText: AppLocalizations.of(context)!.backend_server_address,
                    keyboardType: TextInputType.url,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return AppLocalizations.of(context)!.empty_backend_server_address;
                      }
                      if (!value.endsWith("/")) {
                        value += "/";
                      }
                      return null;
                    },
                    onTapOutside: () => _testApiAddress(_backendServerController.text),
                    onFieldSubmitted: (value) => _testApiAddress(value),
                  ),
                  if (_isConnected) ...[
                    const SizedBox(height: 20),

                    SizedBox(
                      width: double.infinity,
                      child: PrimaryButton(
                        text: AppLocalizations.of(context)!.edit_profile,
                        icon: Icons.edit,
                        onPressed: () {
                          Navigator.pushNamed(context, '/edit-profile').then((result) {
                            if (result == true) {
                              _updateProfile();
                            }
                          });
                        },
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                    ),

                    const SizedBox(height: 20),

                    SizedBox(
                      width: double.infinity,
                      child: PrimaryButton(
                        text: 'Dashboard',
                        icon: Icons.dashboard,
                        onPressed: () {
                          Navigator.pushNamed(context, '/dashboard');
                        },
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                    ),

                    const SizedBox(height: 20),

                    SizedBox(
                      width: double.infinity,
                      child: PrimaryButton(
                        text: AppLocalizations.of(context)?.services ?? 'Services',
                        icon: Icons.api,
                        onPressed: () {
                          Navigator.pushNamed(context, '/services');
                        },
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                    ),
                  ],

                  const SizedBox(height: 20),

                  SizedBox(
                    width: double.infinity,
                    child: PrimaryButton(
                      text: AppLocalizations.of(context)?.about ?? 'About',
                      icon: Icons.info,
                      onPressed: () {
                        Navigator.pushNamed(context, '/about');
                      },
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  @override
  void dispose() {
    _backendServerController.dispose();
    super.dispose();
  }
}
