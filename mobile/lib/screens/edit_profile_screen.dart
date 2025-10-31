import 'dart:convert';
import 'package:area/core/constants/app_constants.dart';
import 'package:area/core/notifiers/backend_address_notifier.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/services/secure_http_client.dart';
import 'package:area/services/secure_storage.dart';
import 'package:area/widgets/common/buttons/primary_button.dart';
import 'package:area/widgets/common/snackbars/app_snackbar.dart';
import 'package:area/widgets/common/text_fields/app_text_field.dart';
import 'package:area/widgets/common/app_bar/custom_app_bar.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  EditProfileScreenState createState() => EditProfileScreenState();
}

class EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _pictureController = TextEditingController();

  bool _isLoading = true;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _loadCurrentProfile();
  }

  Future<void> _loadCurrentProfile() async {
    final backendAddressNotifier = Provider.of<BackendAddressNotifier>(context, listen: false);

    if (backendAddressNotifier.backendAddress == null) {
      if (mounted) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          showErrorSnackbar(
            context,
            AppLocalizations.of(context)!.empty_backend_server_address,
          );
          Navigator.pop(context);
        });
      }
      return;
    }

    final address = "${backendAddressNotifier.backendAddress}${AppRoutes.me}";
    final url = Uri.parse(address);

    try {
      final jwt = await getJwt();
      if (jwt == null) {
        if (mounted) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            showErrorSnackbar(context, AppLocalizations.of(context)!.not_connected);
            Navigator.pop(context);
          });
        }
        return;
      }

      final client = SecureHttpClient.getClient();
      final response = await client.get(url, headers: {'Authorization': "Bearer $jwt"});
      final data = await jsonDecode(response.body);

      if (response.statusCode != 200) {
        throw data['error'];
      }

      if (mounted) {
        setState(() {
          _nameController.text = data['name'] ?? '';
          _emailController.text = data['email'] ?? '';
          _pictureController.text = data['picture'] ?? '';
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          showErrorSnackbar(context, e.toString());
          Navigator.pop(context);
        });
      }
    }
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    // Check if at least one field is filled
    if (_nameController.text.isEmpty &&
        _emailController.text.isEmpty &&
        _passwordController.text.isEmpty &&
        _pictureController.text.isEmpty) {
      showErrorSnackbar(context, AppLocalizations.of(context)!.fill_at_least_one_field);
      return;
    }

    setState(() {
      _isSaving = true;
    });

    final backendAddressNotifier = Provider.of<BackendAddressNotifier>(context, listen: false);

    if (backendAddressNotifier.backendAddress == null) {
      if (mounted) {
        showErrorSnackbar(context, AppLocalizations.of(context)!.empty_backend_server_address);
        setState(() {
          _isSaving = false;
        });
      }
      return;
    }

    final address = "${backendAddressNotifier.backendAddress}${AppRoutes.me}";
    final url = Uri.parse(address);

    try {
      final jwt = await getJwt();
      if (jwt == null) {
        if (mounted) {
          showErrorSnackbar(context, AppLocalizations.of(context)!.not_connected);
          setState(() {
            _isSaving = false;
          });
        }
        return;
      }

      // Build the request body with only filled fields
      final Map<String, dynamic> requestBody = {};

      if (_nameController.text.isNotEmpty) {
        requestBody['name'] = _nameController.text;
      }

      if (_emailController.text.isNotEmpty) {
        requestBody['email'] = _emailController.text;
      }

      if (_passwordController.text.isNotEmpty) {
        requestBody['password'] = _passwordController.text;
      }

      if (_pictureController.text.isNotEmpty) {
        requestBody['picture'] = _pictureController.text;
      }

      final client = SecureHttpClient.getClient();
      final response = await client.put(
        url,
        headers: {'Authorization': "Bearer $jwt", 'Content-Type': 'application/json'},
        body: jsonEncode(requestBody),
      );

      final data = await jsonDecode(response.body);

      if (response.statusCode != 200) {
        throw data['error'] ?? data['message'] ?? 'Unknown error';
      }

      if (mounted) {
        showSuccessSnackbar(context, AppLocalizations.of(context)!.profile_updated);
        Navigator.pop(context, true); // Return true to indicate successful update
      }
    } catch (e) {
      if (mounted) {
        showErrorSnackbar(
          context,
          AppLocalizations.of(context)!.failed_update_profile(e.toString()),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final appLocalizations = AppLocalizations.of(context);

    return Scaffold(
      appBar: CustomAppBar(title: appLocalizations!.edit_profile),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 20),

                    Text(
                      appLocalizations.edit_profile,
                      style: Theme.of(context).textTheme.headlineMedium,
                      textAlign: TextAlign.center,
                    ),

                    const SizedBox(height: 30),

                    AppTextField(
                      controller: _nameController,
                      labelText: appLocalizations.name,
                      keyboardType: TextInputType.name,
                      validator: (value) {
                        if (value != null && value.isNotEmpty && value.length > 38) {
                          return appLocalizations.invalid_name;
                        }
                        return null;
                      },
                    ),

                    const SizedBox(height: 20),

                    AppTextField(
                      controller: _emailController,
                      labelText: appLocalizations.email,
                      keyboardType: TextInputType.emailAddress,
                      validator: (value) {
                        if (value != null && value.isNotEmpty) {
                          final emailRegex = RegExp(r'^[^@]+@[^@]+\.[^@]+$');
                          if (!emailRegex.hasMatch(value)) {
                            return appLocalizations.invalid_email;
                          }
                        }
                        return null;
                      },
                    ),

                    const SizedBox(height: 20),

                    AppTextField(
                      controller: _passwordController,
                      labelText:
                          "${appLocalizations.new_password} (${appLocalizations.optional})",
                      obscureText: true,
                      keyboardType: TextInputType.visiblePassword,
                      validator: (value) {
                        if (value != null && value.isNotEmpty && value.length < 6) {
                          return appLocalizations.invalid_password;
                        }
                        return null;
                      },
                    ),

                    const SizedBox(height: 20),

                    AppTextField(
                      controller: _pictureController,
                      labelText:
                          "${appLocalizations.profile_picture_url} (${appLocalizations.optional})",
                      keyboardType: TextInputType.url,
                    ),

                    const SizedBox(height: 30),

                    PrimaryButton(
                      text: appLocalizations.save_changes,
                      onPressed: _isSaving ? null : _saveProfile,
                      icon: Icons.save,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),

                    if (_isSaving) ...[
                      const SizedBox(height: 20),
                      Center(
                        child: Text(
                          appLocalizations.updating_profile,
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _pictureController.dispose();
    super.dispose();
  }
}
