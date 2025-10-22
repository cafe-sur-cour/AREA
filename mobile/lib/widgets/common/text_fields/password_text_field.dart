import 'package:area/l10n/app_localizations.dart';
import 'package:flutter/material.dart';

class AppPasswordTextField extends StatefulWidget {
  final TextEditingController controller;
  final String? labelText;
  final String? Function(String?)? customValidator;
  final VoidCallback? onTapOutside;

  const AppPasswordTextField({
    super.key,
    required this.controller,
    this.labelText,
    this.customValidator,
    this.onTapOutside,
  });

  @override
  State<AppPasswordTextField> createState() => _AppPasswordTextFieldState();
}

class _AppPasswordTextFieldState extends State<AppPasswordTextField> {
  bool _obscureText = true;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: widget.controller,
      obscureText: _obscureText,
      decoration: InputDecoration(
        labelText: widget.labelText ?? AppLocalizations.of(context)!.password,
        suffixIcon: IconButton(
          icon: Icon(_obscureText ? Icons.visibility : Icons.visibility_off),
          onPressed: () {
            setState(() {
              _obscureText = !_obscureText;
            });
          },
        ),
        border: const OutlineInputBorder(),
      ),
      validator:
          widget.customValidator ??
          (value) {
            if (value == null || value.isEmpty) {
              return AppLocalizations.of(context)!.empty_password;
            }
            if (value.length < 6) {
              return AppLocalizations.of(context)!.invalid_password;
            }
            return null;
          },
      onTapOutside: widget.onTapOutside != null
          ? (event) {
              FocusScope.of(context).unfocus();
              widget.onTapOutside!();
            }
          : (event) {
              FocusScope.of(context).unfocus();
            },
    );
  }
}
