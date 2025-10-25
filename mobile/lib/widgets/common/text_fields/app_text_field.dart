import 'package:flutter/material.dart';

class AppTextField extends StatelessWidget {
  final TextEditingController controller;
  final String labelText;
  final String? Function(String?)? validator;
  final TextInputType? keyboardType;
  final bool obscureText;
  final VoidCallback? onTapOutside;
  final ValueChanged<String>? onFieldSubmitted;
  final int? maxLines;
  final int? minLines;

  const AppTextField({
    super.key,
    required this.controller,
    required this.labelText,
    this.validator,
    this.keyboardType,
    this.obscureText = false,
    this.onTapOutside,
    this.onFieldSubmitted,
    this.maxLines = 1,
    this.minLines,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      decoration: InputDecoration(labelText: labelText, border: const OutlineInputBorder()),
      keyboardType: keyboardType,
      obscureText: obscureText,
      validator: validator,
      maxLines: obscureText ? 1 : maxLines,
      minLines: minLines,
      onFieldSubmitted: onFieldSubmitted,
      onTapOutside: onTapOutside != null
          ? (event) {
              FocusScope.of(context).unfocus();
              onTapOutside!();
            }
          : (event) {
              FocusScope.of(context).unfocus();
            },
    );
  }
}
