import 'dart:convert';

import 'package:area/core/config/app_config.dart';
import 'package:area/core/constants/app_colors.dart';
import 'package:area/core/constants/app_constants.dart';
import 'package:area/core/notifiers/backend_address_notifier.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/services/secure_storage.dart';
import 'package:area/services/secure_http_client.dart';
import 'package:area/widgets/common/app_bar/custom_app_bar.dart';
import 'package:area/widgets/common/buttons/oauth_button.dart';
import 'package:area/widgets/common/buttons/primary_button.dart';
import 'package:area/widgets/common/buttons/secondary_button.dart';
import 'package:area/widgets/common/snackbars/app_snackbar.dart';
import 'package:area/widgets/common/text_fields/email_text_field.dart';
import 'package:area/widgets/common/text_fields/password_text_field.dart';
import 'package:area/widgets/widget_oauth_webview.dart';
import 'package:flutter/material.dart';
import 'package:icons_plus/icons_plus.dart';
import 'package:provider/provider.dart';
import 'package:webview_flutter/webview_flutter.dart';

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
        showErrorSnackbar(context, AppLocalizations.of(context)!.empty_backend_server_address);
        setState(() {
          loading = false;
        });
        return;
      }

      try {
        final address = "${backendAddressNotifier.backendAddress}${AppRoutes.login}";
        final url = Uri.parse(address);

        final client = SecureHttpClient.getClient();
        final response = await client.post(url, body: {'email': email, 'password': password});

        final data = await jsonDecode(response.body);

        if (response.statusCode != 200) {
          throw data['error'];
        }

        await saveJwt(data['token']);

        if (mounted) {
          showSuccessSnackbar(context, AppLocalizations.of(context)!.logged_in);

          Navigator.pop(context, true);
        }
      } catch (e) {
        if (mounted) {
          showErrorSnackbar(context, e.toString());
        }
      }
    }
    setState(() {
      loading = false;
    });
  }

  Future<void> _goToOAuth(String provider, String route) async {
    final backendAddressNotifier = Provider.of<BackendAddressNotifier>(context, listen: false);

    if (backendAddressNotifier.backendAddress == null) {
      showErrorSnackbar(context, AppLocalizations.of(context)!.empty_backend_server_address);
      return;
    }

    String base = backendAddressNotifier.backendAddress!.trim();
    if (!base.startsWith('http://') && !base.startsWith('https://')) {
      base = 'https://$base';
    }
    if (!base.endsWith('/')) {
      base = '$base/';
    }

    final address = "$base$route?is_mobile=true";
    final appLocalizations = AppLocalizations.of(context);
    final navigator = Navigator.of(context);

    final cookieManager = WebViewCookieManager();
    await cookieManager.clearCookies();

    final result = await navigator.push(
      MaterialPageRoute(
        builder: (context) => OAuthWebView(
          oauthUrl: address,
          redirectUrl: AppConfig.callBackUrl,
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
      showSuccessSnackbar(context, appLocalizations!.logged_in);
      navigator.pop(true);
    }
  }

  void _goToGithub() async {
    try {
      await _goToOAuth('GitHub', AppRoutes.githubLogin);
    } catch (e) {
      if (mounted) {
        showErrorSnackbar(
          context,
          AppLocalizations.of(context)!.github_login_failed(e.toString()),
        );
      }
    }
  }

  void _goToMicrosoft() async {
    // await _goToOAuth('Microsoft', AppRoutes.microsoftLogin);
  }

  void _goToGoogle() async {
    try {
      await _goToOAuth('Google', AppRoutes.googleLogin);
    } catch (e) {
      if (mounted) {
        showErrorSnackbar(
          context,
          AppLocalizations.of(context)!.google_login_failed(e.toString()),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: CustomAppBar(title: AppLocalizations.of(context)!.login),
      body: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: <Widget>[
              EmailTextField(controller: _emailController),

              const SizedBox(height: 16),

              AppPasswordTextField(controller: _passwordController),

              const SizedBox(height: 32),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  SecondaryButton(
                    text: AppLocalizations.of(context)!.forgot_password_question,
                    onPressed: () {
                      Navigator.pushNamed(context, '/forgot-password');
                    },
                  ),
                  PrimaryButton(
                    text: AppLocalizations.of(context)!.login,
                    onPressed: _submitForm,
                    isLoading: loading,
                  ),
                ],
              ),

              const SizedBox(height: 16),

              const Divider(),

              const SizedBox(height: 16),

              Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      OAuthButton(
                        providerName: AppLocalizations.of(context)!.github,
                        icon: IonIcons.logo_github,
                        onPressed: _goToGithub,
                        backgroundColor: AppColors.primary,
                        isExpanded: true,
                      ),

                      const SizedBox(width: 8),

                      OAuthButton(
                        providerName: AppLocalizations.of(context)!.google,
                        icon: IonIcons.logo_google,
                        onPressed: _goToGoogle,
                        backgroundColor: Colors.red,
                        isExpanded: true,
                      ),
                    ],
                  ),

                  const SizedBox(height: 12),

                  SizedBox(

                    width: double.infinity,
                    child: OAuthButton(
                      providerName: AppLocalizations.of(context)!.microsoft,
                      icon: IonIcons.logo_microsoft,
                      onPressed: _goToMicrosoft,
                      backgroundColor: Colors.blue,
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
