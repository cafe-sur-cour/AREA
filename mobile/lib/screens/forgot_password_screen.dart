import 'package:area/core/constants/app_colors.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:flutter/material.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ForgotPasswordScreenState createState() => ForgotPasswordScreenState();
}

class ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _confirmEmailController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _confirmEmailController.dispose();
    super.dispose();
  }

  void _submitForm() {
    if (_formKey.currentState!.validate()) {
      String email = _emailController.text;

      print('Email: $email');

      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(AppLocalizations.of(context)!.forgot_password)),
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
          ),
        ),
      ),
    );
  }
}
