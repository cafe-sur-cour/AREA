import 'package:area/l10n/app_localizations.dart';
import 'package:area/widgets/common/text_fields/app_text_field.dart';
import 'package:flutter/material.dart';

class PasswordTextField extends StatelessWidget {
  final TextEditingController controller;
  final String? labelText;
  final String? Function(String?)? customValidator;
  final VoidCallback? onTapOutside;

  const PasswordTextField({
    super.key,
    required this.controller,
    this.labelText,
    this.customValidator,
    this.onTapOutside,
  });

  @override
  Widget build(BuildContext context) {
    return AppTextField(
      controller: controller,
      labelText: labelText ?? AppLocalizations.of(context)!.password,
      obscureText: true,
      validator:
          customValidator ??
          (value) {
            if (value == null || value.isEmpty) {
              return AppLocalizations.of(context)!.empty_password;
            }
            if (value.length < 6) {
              return AppLocalizations.of(context)!.invalid_password;
            }
            return null;
          },
      onTapOutside: onTapOutside,
    );
  }
}
