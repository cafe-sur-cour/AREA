import 'dart:convert';
import 'package:area/core/constants/app_colors.dart';
import 'package:area/core/constants/app_constants.dart';
import 'package:area/core/notifiers/backend_address_notifier.dart';
import 'package:area/core/notifiers/locale_notifier.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/screens/services_screen.dart';
import 'package:area/services/secure_storage.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;

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

  bool _justInitialized = false;

  @override
  void initState() {
    super.initState();
    _backendServerController.text = "";
    _loadProfileIfConnected();
    _justInitialized = true;
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

    try {
      final response = await http.get(url);

      if (response.statusCode != 200) {
        throw response.body;
      }

      final jsonResponse = jsonDecode(response.body);
      if (jsonResponse['status'] != 'OK') {
        throw jsonResponse['status'];
      }

      message = appLocalizations!.valid_backend_server_address;
      color = AppColors.success;
    } catch (e) {
      message = appLocalizations!.invalid_backend_server_address;
      color = AppColors.error;
    }

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            message,
            style: TextStyle(color: AppColors.areaLightGray, fontSize: 16),
          ),
          backgroundColor: color,
        ),
      );
    }
  }

  void _logout() async {
    final backendAddressNotifier = Provider.of<BackendAddressNotifier>(context, listen: false);

    if (backendAddressNotifier.backendAddress == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            AppLocalizations.of(context)!.empty_backend_server_address,
            style: TextStyle(color: AppColors.areaLightGray, fontSize: 16),
          ),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }
    final address = "${backendAddressNotifier.backendAddress}${AppRoutes.logout}";

    final jwt = await getJwt();
    if (jwt == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            AppLocalizations.of(context)!.not_connected,
            style: TextStyle(color: AppColors.areaLightGray, fontSize: 16),
          ),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    final headers = {'Authorization': "Bearer $jwt"};

    final url = Uri.parse(address);
    try {
      final response = await http.post(url, headers: headers);
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
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              AppLocalizations.of(context)!.logged_out,
              style: TextStyle(color: AppColors.areaLightGray, fontSize: 16),
            ),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              e.toString(),
              style: TextStyle(color: AppColors.areaLightGray, fontSize: 16),
            ),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<void> _updateProfile() async {
    final backendAddressNotifier = Provider.of<BackendAddressNotifier>(context, listen: false);

    if (backendAddressNotifier.backendAddress == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            AppLocalizations.of(context)!.empty_backend_server_address,
            style: TextStyle(color: AppColors.areaLightGray, fontSize: 16),
          ),
          backgroundColor: AppColors.error,
        ),
      );
      // Ensure loading flag is cleared so the UI doesn't stay stuck on initial load
      setState(() {
        _isLoading = false;
      });
      return;
    }
    final address = "${backendAddressNotifier.backendAddress}${AppRoutes.me}";
    final url = Uri.parse(address);

    try {
      final jwt = await getJwt();
      final response = await http.get(url, headers: {'Authorization': "Bearer $jwt"});
      final data = await jsonDecode(response.body);

      if (response.statusCode != 200) {
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
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              e.toString(),
              style: TextStyle(color: AppColors.areaLightGray, fontSize: 16),
            ),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final localeNotifier = Provider.of<LocaleNotifier>(context);
    final backendAddressNotifier = Provider.of<BackendAddressNotifier>(context);

    if (_justInitialized) {
      _backendServerController.text = backendAddressNotifier.backendAddress ?? "";
      _justInitialized = false;
    }
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: _isLoading
            ? Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [const CircularProgressIndicator()],
              )
            : Column(
                mainAxisAlignment: MainAxisAlignment.start,
                children: [
                  const SizedBox(height: 30),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      PopupMenuButton<Locale>(
                        onSelected: (Locale locale) {
                          localeNotifier.setLocale(locale);
                          FocusScope.of(context).unfocus();
                        },
                        itemBuilder: (BuildContext context) => <PopupMenuEntry<Locale>>[
                          const PopupMenuItem<Locale>(value: Locale('en'), child: Text('EN')),
                          const PopupMenuItem<Locale>(value: Locale('fr'), child: Text('FR')),
                        ],
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 8.0),
                          child: Text(
                            localeNotifier.locale.languageCode.toUpperCase(),
                            style: TextStyle(
                              fontSize: 16,
                              color: Theme.of(context).primaryColor,
                              fontWeight: FontWeight.bold,
                            ),
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

                  TextFormField(
                    controller: _backendServerController,
                    decoration: InputDecoration(
                      labelText: AppLocalizations.of(context)!.backend_server_address,
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.url,
                    onChanged: (value) {
                      String normalized = value.trim();
                      if (normalized.isEmpty) {
                        backendAddressNotifier.setBackendAddress(null);
                        return;
                      }
                      if (!normalized.startsWith('http://') &&
                          !normalized.startsWith('https://')) {
                        normalized = 'https://$normalized';
                      }
                      if (!normalized.endsWith('/')) {
                        normalized = '$normalized/';
                      }
                      backendAddressNotifier.setBackendAddress(normalized);
                    },
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return AppLocalizations.of(context)!.empty_backend_server_address;
                      }
                      return null;
                    },
                    onTapOutside: (event) {
                      FocusScope.of(context).unfocus();
                      _testApiAddress(_backendServerController.text);
                    },
                    onFieldSubmitted: (value) async {
                      await _testApiAddress(value);
                    },
                  ),

                  if (_isConnected) ...[
                    const SizedBox(height: 20),

                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(builder: (context) => const ServicesScreen()),
                          );
                        },
                        icon: const Icon(Icons.api),
                        label: Text(AppLocalizations.of(context)?.services ?? 'Services'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                      ),
                    ),
                  ],
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
