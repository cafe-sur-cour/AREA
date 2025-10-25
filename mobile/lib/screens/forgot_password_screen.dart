import 'dart:convert';

import 'package:area/core/constants/app_constants.dart';
import 'package:area/core/notifiers/backend_address_notifier.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/services/secure_http_client.dart';
import 'package:area/widgets/common/app_bar/custom_app_bar.dart';
import 'package:area/widgets/common/buttons/primary_button.dart';
import 'package:area/widgets/common/snackbars/app_snackbar.dart';
import 'package:area/widgets/common/text_fields/app_text_field.dart';
import 'package:area/widgets/common/text_fields/email_text_field.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ForgotPasswordScreenState createState() => ForgotPasswordScreenState();
}

class ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _confirmEmailController = TextEditingController();

  bool loading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _confirmEmailController.dispose();
    super.dispose();
  }

  void _submitForm() async {
    setState(() {
      loading = true;
    });
    if (_formKey.currentState!.validate()) {
      String email = _emailController.text;

      final backendAddressNotifier = Provider.of<BackendAddressNotifier>(
        context,
        listen: false,
      );

      if (backendAddressNotifier.backendAddress == null) {
        if (mounted) {
          showErrorSnackbar(
            context,
            AppLocalizations.of(context)!.empty_backend_server_address,
          );
        }
        setState(() {
          loading = false;
        });
        return;
      }

      try {
        final address = "${backendAddressNotifier.backendAddress}${AppRoutes.forgotPassword}";
        final url = Uri.parse(address);

        final client = SecureHttpClient.getClient();
        final response = await client.post(url, body: {'email': email});

        final data = await jsonDecode(response.body);

        if (response.statusCode != 200) {
          throw data['error'];
        }

        if (mounted) {
          showSuccessSnackbar(context, AppLocalizations.of(context)!.email_sent);
          Navigator.pop(context);
        }
      } catch (e) {
        if (mounted) {
          showErrorSnackbar(context, e.toString());
        }
      }
    }
    if (mounted) {
      setState(() {
        loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: CustomAppBar(title: AppLocalizations.of(context)!.forgot_password),
      body: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: <Widget>[
              EmailTextField(controller: _emailController),

              const SizedBox(height: 16),

              AppTextField(
                controller: _confirmEmailController,
                labelText: AppLocalizations.of(context)!.confirm_email,
                keyboardType: TextInputType.emailAddress,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return AppLocalizations.of(context)!.empty_email;
                  }
                  if (!value.contains('@')) {
                    return AppLocalizations.of(context)!.invalid_email;
                  }
                  if (value != _emailController.text) {
                    return AppLocalizations.of(context)!.confirm_email_differs;
                  }
                  return null;
                },
              ),

              const SizedBox(height: 32),

              PrimaryButton(
                text: AppLocalizations.of(context)!.send,
                onPressed: _submitForm,
                isLoading: loading,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
