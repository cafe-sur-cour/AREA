import 'package:flutter/material.dart';

Future<bool> showConfirmDialog({
  required BuildContext context,
  required String title,
  required String message,
  required String confirmText,
  required String cancelText,
}) async {
  final result = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: Text(title),
      content: Text(message),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      actions: [
        TextButton(onPressed: () => Navigator.of(context).pop(false), child: Text(cancelText)),
        TextButton(onPressed: () => Navigator.of(context).pop(true), child: Text(confirmText)),
      ],
    ),
  );

  return result ?? false;
}
