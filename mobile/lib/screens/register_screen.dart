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
import 'package:area/widgets/common/text_fields/password_text_field.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  RegisterScreenState createState() => RegisterScreenState();
}

class RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool loading = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _submitForm() async {
    setState(() {
      loading = true;
    });
    if (_formKey.currentState!.validate()) {
      String name = _nameController.text;
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

      final address = "${backendAddressNotifier.backendAddress}${AppRoutes.register}";
      final url = Uri.parse(address);

      try {
        final client = SecureHttpClient.getClient();
        final response = await client.post(
          url,
          body: {'name': name, 'email': email, 'password': password},
        );

        final data = await jsonDecode(response.body);

        if (response.statusCode != 201) {
          throw data['error'];
        }

        if (mounted) {
          showSuccessSnackbar(context, AppLocalizations.of(context)!.user_registered);
          Navigator.pop(context);
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: CustomAppBar(title: AppLocalizations.of(context)!.register),
      body: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: <Widget>[
              AppTextField(
                controller: _nameController,
                labelText: AppLocalizations.of(context)!.name,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return AppLocalizations.of(context)!.empty_name;
                  }
                  if (value.length > 38) {
                    return AppLocalizations.of(context)!.invalid_name;
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              EmailTextField(controller: _emailController),
              const SizedBox(height: 16),
              PasswordTextField(controller: _passwordController),
              const SizedBox(height: 16),
              PasswordTextField(
                controller: _confirmPasswordController,
                labelText: AppLocalizations.of(context)!.confirm_password,
                customValidator: (value) {
                  if (value == null || value.isEmpty) {
                    return AppLocalizations.of(context)!.empty_password;
                  }
                  if (value != _passwordController.text) {
                    return AppLocalizations.of(context)!.confirm_password_differs;
                  }
                  return null;
                },
              ),
              const SizedBox(height: 32),
              PrimaryButton(
                text: AppLocalizations.of(context)!.register,
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
