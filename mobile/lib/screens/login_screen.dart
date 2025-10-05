import 'dart:convert';

import 'package:area/core/config/app_config.dart';
import 'package:area/core/constants/app_colors.dart';
import 'package:area/core/constants/app_constants.dart';
import 'package:area/core/notifiers/backend_address_notifier.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/services/secure_storage.dart';
import 'package:area/widgets/widget_oauth_webview.dart';
import 'package:flutter/material.dart';
import 'package:icons_plus/icons_plus.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  LoginScreenState createState() => LoginScreenState();
}

class LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool loading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _submitForm() async {
    setState(() {
      loading = true;
    });
    if (_formKey.currentState!.validate()) {
      String email = _emailController.text;
      String password = _passwordController.text;

      final backendAddressNotifier = Provider.of<BackendAddressNotifier>(
        context,
        listen: false,
      );

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
        setState(() {
          loading = false;
        });
        return;
      }

      try {
        final address = "${backendAddressNotifier.backendAddress}${AppRoutes.login}";
        final url = Uri.parse(address);

        final response = await http.post(url, body: {'email': email, 'password': password});

        final data = await jsonDecode(response.body);

        if (response.statusCode != 200) {
          throw data['error'];
        }

        await saveJwt(data['token']);

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                AppLocalizations.of(context)!.logged_in,
                style: TextStyle(color: AppColors.areaLightGray, fontSize: 16),
              ),
              backgroundColor: AppColors.success,
            ),
          );

          Navigator.pop(context, true);
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
    setState(() {
      loading = false;
    });
  }

  Future<void> _goToOAuth(BuildContext context, String provider, String route) async {
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

    final address = "${backendAddressNotifier.backendAddress}$route";

    final appLocalizations = AppLocalizations.of(context);
    final scaffoldMessenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);

    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => OAuthWebView(
          oauthUrl: address,
          redirectUrl: AppConfig.getOAuthRedirectUrl(),
          providerName: provider,
        ),
      ),
    );

    if (!mounted) return;

    if (result == null || result is! String) {
      return;
    }

    await saveJwt(result);

    if (mounted) {
      scaffoldMessenger.showSnackBar(
        SnackBar(
          content: Text(
            appLocalizations!.logged_in,
            style: TextStyle(color: AppColors.areaLightGray, fontSize: 16),
          ),
          backgroundColor: AppColors.success,
        ),
      );

      navigator.pop(true);
    }
  }

  void _goToGithub(BuildContext context) async {
    await _goToOAuth(context, 'GitHub', AppRoutes.github);
  }

  void _goToMicrosoft(BuildContext context) async {
    // await _goToOAuth(context, 'Microsoft', 'api/auth/microsoft');
  }

  void _goToGoogle(BuildContext context) async {
    // await _goToOAuth(context, 'Google', 'api/auth/google');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(AppLocalizations.of(context)!.login)),
      body: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: <Widget>[
              TextFormField(
                controller: _emailController,
                decoration: InputDecoration(
                  labelText: AppLocalizations.of(context)!.email,
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.emailAddress,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return AppLocalizations.of(context)!.empty_email;
                  }
                  if (!value.contains('@')) {
                    return AppLocalizations.of(context)!.invalid_email;
                  }
                  return null;
                },
                onTapOutside: (event) {
                  FocusScope.of(context).unfocus();
                },
              ),

              const SizedBox(height: 16),

              TextFormField(
                controller: _passwordController,
                decoration: InputDecoration(
                  labelText: AppLocalizations.of(context)!.password,
                  border: OutlineInputBorder(),
                ),
                obscureText: true,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return AppLocalizations.of(context)!.empty_password;
                  }
                  if (value.length < 6) {
                    return AppLocalizations.of(context)!.invalid_password;
                  }
                  return null;
                },
                onTapOutside: (event) {
                  FocusScope.of(context).unfocus();
                },
              ),

              const SizedBox(height: 32),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  ElevatedButton(
                    onPressed: () {
                      Navigator.pushNamed(context, '/forgot-password');
                    },
                    style: ElevatedButton.styleFrom(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    child: Text(AppLocalizations.of(context)!.forgot_password_question),
                  ),
                  if (loading) ...[
                    const CircularProgressIndicator(),
                  ] else ...[
                    ElevatedButton(
                      onPressed: _submitForm,
                      style: ElevatedButton.styleFrom(
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        backgroundColor: AppColors.primary,
                      ),
                      child: Text(
                        AppLocalizations.of(context)!.login,
                        style: TextStyle(color: AppColors.areaLightGray),
                      ),
                    ),
                  ],
                ],
              ),

              const SizedBox(height: 16),

              Divider(),

              const SizedBox(height: 16),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  ElevatedButton(
                    onPressed: () => _goToGithub(context),
                    style: ElevatedButton.styleFrom(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      backgroundColor: AppColors.primary,
                      padding: EdgeInsets.symmetric(horizontal: 16),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(IonIcons.logo_github, color: AppColors.areaLightGray),
                        SizedBox(width: 8),
                        Text('Github', style: TextStyle(color: AppColors.areaLightGray)),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    onPressed: () => _goToMicrosoft(context),
                    style: ElevatedButton.styleFrom(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      backgroundColor: AppColors.primary,
                      padding: EdgeInsets.symmetric(horizontal: 16),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(IonIcons.logo_microsoft, color: AppColors.areaLightGray),
                        SizedBox(width: 8),
                        Text('Microsoft', style: TextStyle(color: AppColors.areaLightGray)),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    onPressed: () => _goToGoogle(context),
                    style: ElevatedButton.styleFrom(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      backgroundColor: AppColors.primary,
                      padding: EdgeInsets.symmetric(horizontal: 16),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(IonIcons.logo_google, color: AppColors.areaLightGray),
                        SizedBox(width: 8),
                        Text('Google', style: TextStyle(color: AppColors.areaLightGray)),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
