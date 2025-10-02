import 'package:area/core/constants/app_colors.dart';
import 'package:area/core/utils/color_utils.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/services/secure_storage.dart';
import 'package:area/models/action_models.dart';
import 'package:area/models/reaction_models.dart';
import 'package:area/models/service_models.dart';
import 'package:flutter/material.dart';

class AddAutomationScreen extends StatefulWidget {
  final ActionModel? selectedAction;
  final ServiceModel? selectedService;
  final ReactionModel? selectedReaction;
  final ServiceModel? selectedReactionService;

  const AddAutomationScreen({
    super.key,
    this.selectedAction,
    this.selectedService,
    this.selectedReaction,
    this.selectedReactionService,
  });

  @override
  AddAutomationScreenState createState() => AddAutomationScreenState();
}

class AddAutomationScreenState extends State<AddAutomationScreen> {
  ActionModel? _selectedAction;
  ServiceModel? _selectedService;
  ReactionModel? _selectedReaction;
  ServiceModel? _selectedReactionService;

  @override
  void initState() {
    super.initState();
    _selectedAction = widget.selectedAction;
    _selectedService = widget.selectedService;
    _selectedReaction = widget.selectedReaction;
    _selectedReactionService = widget.selectedReactionService;
  }

  void _addAction() async {
    final jwt = await getJwt();

    if (jwt == null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            AppLocalizations.of(context)!.not_connected,
            style: TextStyle(color: AppColors.areaLightGray, fontSize: 16),
          ),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    if (mounted) {
      Navigator.pushNamed(context, "/action-services");
    }
  }

  Color _getServiceColor() {
    if (_selectedService == null) return AppColors.areaBlue3;
    return ColorUtils.getServiceColor(_selectedService!);
  }

  void _clearAction() {
    setState(() {
      _selectedAction = null;
      _selectedService = null;
    });
  }

  void _addReaction() async {
    final jwt = await getJwt();

    if (jwt == null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            AppLocalizations.of(context)!.not_connected,
            style: TextStyle(color: AppColors.areaLightGray, fontSize: 16),
          ),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    if (mounted) {
      Navigator.pushNamed(context, "/reaction-services");
    }
  }

  Color _getReactionServiceColor() {
    if (_selectedReactionService == null) return AppColors.areaBlue3;
    return ColorUtils.getServiceColor(_selectedReactionService!);
  }

  void _clearReaction() {
    setState(() {
      _selectedReaction = null;
      _selectedReactionService = null;
    });
  }

  Widget _buildActionCard() {
    if (_selectedAction == null || _selectedService == null) {
      return Container();
    }

    final serviceColor = _getServiceColor();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [serviceColor.withValues(alpha: 0.1), serviceColor.withValues(alpha: 0.05)],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: serviceColor.withValues(alpha: 0.3), width: 2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: serviceColor.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.flash_on, color: AppColors.areaBlue3, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Selected Action',
                      style: TextStyle(
                        fontFamily: 'Montserrat',
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: serviceColor,
                      ),
                    ),
                    Text(
                      _selectedAction!.name,
                      style: const TextStyle(
                        fontFamily: 'Montserrat',
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColors.areaBlack,
                      ),
                    ),
                    Text(
                      _selectedService!.name,
                      style: const TextStyle(
                        fontFamily: 'Montserrat',
                        fontSize: 14,
                        color: AppColors.areaDarkGray,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: _clearAction,
                icon: const Icon(Icons.close, color: AppColors.areaDarkGray),
                tooltip: 'Remove action',
              ),
            ],
          ),
          if (_selectedAction!.description.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              _selectedAction!.description,
              style: const TextStyle(
                fontFamily: 'Montserrat',
                fontSize: 14,
                color: AppColors.areaDarkGray,
                height: 1.4,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildReactionCard() {
    if (_selectedReaction == null || _selectedReactionService == null) {
      return Container();
    }

    final serviceColor = _getReactionServiceColor();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [serviceColor.withValues(alpha: 0.1), serviceColor.withValues(alpha: 0.05)],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: serviceColor.withValues(alpha: 0.3), width: 2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: serviceColor.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.replay, color: AppColors.areaBlue3, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Selected Reaction',
                      style: TextStyle(
                        fontFamily: 'Montserrat',
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: serviceColor,
                      ),
                    ),
                    Text(
                      _selectedReaction!.name,
                      style: const TextStyle(
                        fontFamily: 'Montserrat',
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColors.areaBlack,
                      ),
                    ),
                    Text(
                      _selectedReactionService!.name,
                      style: const TextStyle(
                        fontFamily: 'Montserrat',
                        fontSize: 14,
                        color: AppColors.areaDarkGray,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: _clearReaction,
                icon: const Icon(Icons.close, color: AppColors.areaDarkGray),
                tooltip: 'Remove reaction',
              ),
            ],
          ),
          if (_selectedReaction!.description.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              _selectedReaction!.description,
              style: const TextStyle(
                fontFamily: 'Montserrat',
                fontSize: 14,
                color: AppColors.areaDarkGray,
                height: 1.4,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const SizedBox(height: 30),
            SizedBox(
              height: (_selectedAction != null || _selectedReaction != null) ? 120 : 180,
              child: Center(
                child: Image(
                  image: const AssetImage('assets/web-app-manifest-512x512.png'),
                  width: (_selectedAction != null || _selectedReaction != null) ? 100 : 140,
                  height: (_selectedAction != null || _selectedReaction != null) ? 100 : 140,
                ),
              ),
            ),
            if (_selectedAction != null) _buildActionCard(),
            if (_selectedReaction != null) _buildReactionCard(),
            const SizedBox(height: 30),
            Wrap(
              direction: Axis.vertical,
              spacing: 24,
              children: [
                ElevatedButton(
                  onPressed: _addAction,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _selectedAction != null
                        ? _getServiceColor()
                        : AppColors.areaBlue3,
                    padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 40),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
                  ),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(minWidth: 200, maxWidth: 300),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Flexible(
                          child: Text(
                            _selectedAction != null ? "Change Action" : "Action",
                            style: const TextStyle(
                              fontFamily: 'Montserrat',
                              color: AppColors.areaLightGray,
                              fontWeight: FontWeight.w700,
                              fontSize: 24.0,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Icon(
                          _selectedAction != null ? Icons.edit : Icons.add,
                          color: AppColors.areaLightGray,
                          size: 28,
                        ),
                      ],
                    ),
                  ),
                ),
                ElevatedButton(
                  onPressed: _selectedAction != null ? _addReaction : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _selectedAction != null
                        ? (_selectedReaction != null
                              ? _getReactionServiceColor()
                              : AppColors.areaBlue3)
                        : AppColors.areaDarkGray,
                    padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 40),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
                  ),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(minWidth: 200, maxWidth: 300),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Flexible(
                          child: Text(
                            _selectedReaction != null
                                ? "Change REAction"
                                : (_selectedAction != null ? "REAction" : "REAction"),
                            style: const TextStyle(
                              fontFamily: 'Montserrat',
                              color: AppColors.areaLightGray,
                              fontWeight: FontWeight.w700,
                              fontSize: 24.0,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Icon(
                          _selectedReaction != null
                              ? Icons.edit
                              : (_selectedAction != null ? Icons.add : Icons.lock),
                          color: _selectedAction != null
                              ? AppColors.areaLightGray
                              : AppColors.areaLightGray.withValues(alpha: 0.5),
                          size: 28,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 50),
          ],
        ),
      ),
    );
  }
}
