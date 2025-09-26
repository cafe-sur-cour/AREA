import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:area/core/notifiers/locale_notifier.dart';

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

  @override
  Widget build(BuildContext context) {
    final localeNotifier = Provider.of<LocaleNotifier>(context);

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
                      "Logout",
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
                          "Login",
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
                          "Register",
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
                        "Not connected",
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
              decoration: const InputDecoration(
                labelText: "Backend Server Address",
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.url,
              onChanged: (value) {
                print("Backend server address: $value");
              },
              onTapOutside: (event) {
                FocusScope.of(context).unfocus();
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
