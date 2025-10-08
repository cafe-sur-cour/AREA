import 'dart:convert';

import 'package:area/core/constants/app_colors.dart';
import 'package:area/core/constants/app_constants.dart';
import 'package:area/core/notifiers/backend_address_notifier.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/services/secure_http_client.dart';
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
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                AppLocalizations.of(context)!.empty_backend_server_address,
                style: TextStyle(color: AppColors.areaLightGray, fontSize: 16),
              ),
              backgroundColor: AppColors.error,
            ),
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
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                AppLocalizations.of(context)!.email_sent,
                style: TextStyle(color: AppColors.areaLightGray, fontSize: 16),
              ),
              backgroundColor: AppColors.success,
            ),
          );

          Navigator.pop(context);
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
    if (mounted) {
      setState(() {
        loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          AppLocalizations.of(context)!.forgot_password,
          style: TextStyle(fontFamily: 'Montserrat', fontWeight: FontWeight.bold),
        ),
        backgroundColor: AppColors.areaBlue3,
        foregroundColor: AppColors.areaLightGray,
      ),
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
                controller: _confirmEmailController,
                decoration: InputDecoration(
                  labelText: AppLocalizations.of(context)!.confirm_email,
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
                  if (value != _emailController.text) {
                    return AppLocalizations.of(context)!.confirm_email_differs;
                  }
                  return null;
                },
                onTapOutside: (event) {
                  FocusScope.of(context).unfocus();
                },
              ),

              const SizedBox(height: 32),

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
                    AppLocalizations.of(context)!.send,
                    style: TextStyle(color: AppColors.areaLightGray),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
