import 'package:area/core/constants/app_colors.dart';
import 'package:flutter/material.dart';

class LoadingState extends StatelessWidget {
  final String? message;

  const LoadingState({super.key, this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(),
          if (message != null) ...[
            const SizedBox(height: 16),

            Text(
              message!,
              style: const TextStyle(fontSize: 16, color: AppColors.areaDarkGray),
            ),
          ],
        ],
      ),
    );
  }
}
