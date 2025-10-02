import 'package:flutter/material.dart';
import 'package:area/models/reaction_models.dart';
import 'package:area/models/service_models.dart';
import 'package:area/core/constants/app_colors.dart';

class ReactionDetailsScreen extends StatelessWidget {
  final ReactionModel reaction;
  final ServiceModel service;

  const ReactionDetailsScreen({super.key, required this.reaction, required this.service});

  Color _getServiceColor() {
    try {
      String colorHex = service.color;
      if (colorHex.startsWith('#')) {
        colorHex = colorHex.substring(1);
      }
      if (colorHex.length == 6) {
        colorHex = 'FF$colorHex';
      }
      return Color(int.parse(colorHex, radix: 16));
    } catch (e) {
      return AppColors.areaBlue3;
    }
  }

  void _selectReaction(BuildContext context) {
    Navigator.of(context).pushNamedAndRemoveUntil(
      '/',
      (Route<dynamic> route) => false,
      arguments: {'selectedReaction': reaction, 'selectedReactionService': service},
    );
  }

  @override
  Widget build(BuildContext context) {
    final serviceColor = _getServiceColor();

    return Scaffold(
      appBar: AppBar(
        title: Text(
          reaction.name,
          style: const TextStyle(fontFamily: 'Montserrat', fontWeight: FontWeight.bold),
        ),
        backgroundColor: serviceColor,
        foregroundColor: AppColors.areaLightGray,
        elevation: 0,
      ),
      body: Column(
        children: [
          Container(
            width: double.infinity,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [serviceColor, serviceColor.withValues(alpha: 0.8)],
              ),
            ),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: AppColors.areaLightGray.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: service.iconUrl != null
                            ? ClipRRect(
                                borderRadius: BorderRadius.circular(6),
                                child: Image.network(
                                  service.iconUrl!,
                                  fit: BoxFit.cover,
                                  errorBuilder: (context, error, stackTrace) {
                                    return const Icon(
                                      Icons.web,
                                      color: AppColors.areaLightGray,
                                      size: 20,
                                    );
                                  },
                                ),
                              )
                            : const Icon(Icons.web, color: AppColors.areaLightGray, size: 20),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        service.name,
                        style: TextStyle(
                          fontFamily: 'Montserrat',
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: AppColors.areaLightGray.withValues(alpha: 0.9),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: AppColors.areaLightGray.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: reaction.iconUrl != null
                            ? ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: Image.network(
                                  reaction.iconUrl!,
                                  fit: BoxFit.cover,
                                  errorBuilder: (context, error, stackTrace) {
                                    return const Icon(
                                      Icons.replay,
                                      color: AppColors.areaLightGray,
                                      size: 28,
                                    );
                                  },
                                ),
                              )
                            : const Icon(
                                Icons.replay,
                                color: AppColors.areaLightGray,
                                size: 28,
                              ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              reaction.name,
                              style: const TextStyle(
                                fontFamily: 'Montserrat',
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: AppColors.areaLightGray,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Reaction',
                              style: TextStyle(
                                fontFamily: 'Montserrat',
                                fontSize: 14,
                                color: AppColors.areaLightGray.withValues(alpha: 0.8),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (reaction.description.isNotEmpty) ...[
                    const Text(
                      'Description',
                      style: TextStyle(
                        fontFamily: 'Montserrat',
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppColors.areaBlack,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.areaLightGray.withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: serviceColor.withValues(alpha: 0.2),
                          width: 1,
                        ),
                      ),
                      child: Text(
                        reaction.description,
                        style: const TextStyle(
                          fontFamily: 'Montserrat',
                          fontSize: 16,
                          color: AppColors.areaBlack,
                          height: 1.5,
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                  if (reaction.parameters != null && reaction.parameters!.isNotEmpty) ...[
                    const Text(
                      'Parameters',
                      style: TextStyle(
                        fontFamily: 'Montserrat',
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppColors.areaBlack,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.areaLightGray.withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: serviceColor.withValues(alpha: 0.2),
                          width: 1,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: reaction.parameters!.entries.map((entry) {
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Icon(Icons.settings, size: 16, color: serviceColor),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        entry.key,
                                        style: const TextStyle(
                                          fontFamily: 'Montserrat',
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                          color: AppColors.areaBlack,
                                        ),
                                      ),
                                      Text(
                                        entry.value.toString(),
                                        style: const TextStyle(
                                          fontFamily: 'Montserrat',
                                          fontSize: 14,
                                          color: AppColors.areaDarkGray,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.grey.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey.withValues(alpha: 0.3), width: 1),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Reaction ID',
                          style: TextStyle(
                            fontFamily: 'Montserrat',
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppColors.areaDarkGray,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          reaction.id,
                          style: const TextStyle(
                            fontFamily: 'monospace',
                            fontSize: 14,
                            color: AppColors.areaDarkGray,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.surface,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.1),
                  offset: const Offset(0, -2),
                  blurRadius: 8,
                ),
              ],
            ),
            child: ElevatedButton(
              onPressed: () => _selectReaction(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: serviceColor,
                foregroundColor: AppColors.areaLightGray,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: 0,
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.check_circle_outline, size: 24),
                  SizedBox(width: 12),
                  Text(
                    'Choose this Reaction',
                    style: TextStyle(
                      fontFamily: 'Montserrat',
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
