import 'dart:convert';
import 'package:area/core/constants/app_colors.dart';
import 'package:area/core/constants/app_constants.dart';
import 'package:area/core/notifiers/backend_address_notifier.dart';
import 'package:area/core/notifiers/locale_notifier.dart';
import 'package:area/l10n/app_localizations.dart';
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
  late String _userName;
  late IconData _userProfileIcon;
  final TextEditingController _backendServerController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _backendServerController.text = "";
  }

  Future<bool> _testApiAddress(String address) async {
    final url = Uri.parse("$address${AppRoutes.healthCheck}");

    try {
      final response = await http.get(url);

      if (response.statusCode != 200) {
        throw response.body;
      }

      final jsonResponse = jsonDecode(response.body);
      if (jsonResponse['status'] != 'OK') {
        throw jsonResponse['status'];
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final localeNotifier = Provider.of<LocaleNotifier>(context);
    final backendAddressNotifier = Provider.of<BackendAddressNotifier>(context);

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
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
                    onPressed: () {
                      print("User logs out");
                      setState(() {
                        _isConnected = false;
                      });
                    },
                    child: Text(
                      AppLocalizations.of(context)!.logout,
                      style: TextStyle(fontSize: 18, color: Theme.of(context).primaryColor),
                    ),
                  ),
                ] else ...[
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      TextButton(
                        onPressed: () {
                          Navigator.pushNamed(context, '/login').then((result) {
                            if (result != null &&
                                result is List &&
                                result.isNotEmpty &&
                                result[0] == true) {
                              setState(() {
                                _isConnected = true;
                                _userName = result[1] as String;
                                _userProfileIcon = Icons.account_circle;
                              });
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
                if (!value.endsWith("/")) {
                  value += "/";
                }
                backendAddressNotifier.setBackendAddress(value);
              },
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return AppLocalizations.of(context)!.empty_backend_server_address;
                }
                if (!value.endsWith("/")) {
                  value += "/";
                }
                return null;
              },
              onTapOutside: (event) {
                FocusScope.of(context).unfocus();
              },
              onFieldSubmitted: (value) async {
                if (!value.endsWith("/")) value += "/";

                final ok = await _testApiAddress(value);
                late String message;
                late Color color;
                if (!ok) {
                  message = AppLocalizations.of(context)!.invalid_backend_server_address;
                  color = AppColors.error;
                } else {
                  message = AppLocalizations.of(context)!.valid_backend_server_address;
                  color = AppColors.success;
                }
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      message,
                      style: TextStyle(color: AppColors.areaLightGray, fontSize: 16),
                    ),
                    backgroundColor: color,
                  ),
                );
              },
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
