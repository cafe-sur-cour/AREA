import 'package:area/l10n/app_localizations.dart';
import 'package:area/widgets/common/text_fields/app_text_field.dart';
import 'package:flutter/material.dart';

class EmailTextField extends StatelessWidget {
  final TextEditingController controller;
  final VoidCallback? onTapOutside;

  const EmailTextField({super.key, required this.controller, this.onTapOutside});

  @override
  Widget build(BuildContext context) {
    return AppTextField(
      controller: controller,
      labelText: AppLocalizations.of(context)!.email,
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
      onTapOutside: onTapOutside,
    );
  }
}
