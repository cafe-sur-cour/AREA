import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:area/core/constants/app_colors.dart';
import 'package:area/core/notifiers/automation_builder_notifier.dart';
import 'package:area/core/notifiers/backend_address_notifier.dart';
import 'package:area/services/api_mapping_action_reaction.dart';
import 'package:area/models/action_models.dart';
import 'package:area/l10n/app_localizations.dart';

class AutomationConfigurationScreen extends StatefulWidget {
  const AutomationConfigurationScreen({super.key});

  @override
  State<AutomationConfigurationScreen> createState() => _AutomationConfigurationScreenState();
}

class _AutomationConfigurationScreenState extends State<AutomationConfigurationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  bool _isCreating = false;

  @override
  void initState() {
    super.initState();
    _nameController.text = 'My Automation ${DateTime.now().millisecondsSinceEpoch}';
    _descriptionController.text = 'Created from mobile app';
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Widget _buildConfigField(
    ConfigField field,
    dynamic currentValue,
    Function(dynamic) onChanged,
  ) {
    switch (field.type) {
      case 'text':
      case 'email':
        return _buildTextField(field, currentValue, onChanged);
      case 'textarea':
        return _buildTextAreaField(field, currentValue, onChanged);
      case 'number':
        return _buildNumberField(field, currentValue, onChanged);
      case 'select':
        return _buildSelectField(field, currentValue, onChanged);
      case 'checkbox':
        return _buildCheckboxField(field, currentValue, onChanged);
      default:
        return _buildTextField(field, currentValue, onChanged);
    }
  }

  Widget _buildTextField(
    ConfigField field,
    dynamic currentValue,
    Function(dynamic) onChanged,
  ) {
    final controller = TextEditingController(text: currentValue?.toString() ?? '');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildFieldLabel(field),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          keyboardType: field.type == 'email'
              ? TextInputType.emailAddress
              : TextInputType.text,
          decoration: InputDecoration(
            hintText: field.placeholder,
            border: const OutlineInputBorder(),
            filled: true,
            fillColor: Colors.grey.shade50,
          ),
          validator: (value) {
            if (field.required && (value == null || value.isEmpty)) {
              return '${field.label} is required';
            }
            if (field.type == 'email' && value != null && value.isNotEmpty) {
              if (!RegExp(r'^[^@]+@[^@]+\.[^@]+').hasMatch(value)) {
                return 'Please enter a valid email address';
              }
            }
            return null;
          },
          onChanged: onChanged,
        ),
        if (field.description != null) _buildFieldDescription(field.description!),
      ],
    );
  }

  Widget _buildTextAreaField(
    ConfigField field,
    dynamic currentValue,
    Function(dynamic) onChanged,
  ) {
    final controller = TextEditingController(text: currentValue?.toString() ?? '');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildFieldLabel(field),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          maxLines: 3,
          decoration: InputDecoration(
            hintText: field.placeholder,
            border: const OutlineInputBorder(),
            filled: true,
            fillColor: Colors.grey.shade50,
          ),
          validator: (value) {
            if (field.required && (value == null || value.isEmpty)) {
              return '${field.label} is required';
            }
            return null;
          },
          onChanged: onChanged,
        ),
        if (field.description != null) _buildFieldDescription(field.description!),
      ],
    );
  }

  Widget _buildNumberField(
    ConfigField field,
    dynamic currentValue,
    Function(dynamic) onChanged,
  ) {
    final controller = TextEditingController(text: currentValue?.toString() ?? '');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildFieldLabel(field),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          keyboardType: TextInputType.number,
          decoration: InputDecoration(
            hintText: field.placeholder,
            border: const OutlineInputBorder(),
            filled: true,
            fillColor: Colors.grey.shade50,
          ),
          validator: (value) {
            if (field.required && (value == null || value.isEmpty)) {
              return '${field.label} is required';
            }
            if (value != null && value.isNotEmpty) {
              if (num.tryParse(value) == null) {
                return 'Please enter a valid number';
              }
            }
            return null;
          },
          onChanged: (value) {
            final numValue = num.tryParse(value);
            onChanged(numValue ?? value);
          },
        ),
        if (field.description != null) _buildFieldDescription(field.description!),
      ],
    );
  }

  Widget _buildSelectField(
    ConfigField field,
    dynamic currentValue,
    Function(dynamic) onChanged,
  ) {
    if (field.options == null || field.options!.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.red.shade50,
          border: Border.all(color: Colors.red.shade200),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          'Invalid select field: ${field.label} has no options',
          style: const TextStyle(color: Colors.red),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildFieldLabel(field),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          initialValue: currentValue?.toString(),
          decoration: InputDecoration(
            border: const OutlineInputBorder(),
            filled: true,
            fillColor: Colors.grey.shade50,
          ),
          items: field.options!.map((option) {
            return DropdownMenuItem<String>(value: option.value, child: Text(option.label));
          }).toList(),
          onChanged: onChanged,
          validator: (value) {
            if (field.required && (value == null || value.isEmpty)) {
              return '${field.label} is required';
            }
            return null;
          },
        ),
        if (field.description != null) _buildFieldDescription(field.description!),
      ],
    );
  }

  Widget _buildCheckboxField(
    ConfigField field,
    dynamic currentValue,
    Function(dynamic) onChanged,
  ) {
    final boolValue = currentValue is bool ? currentValue : false;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Checkbox(value: boolValue, onChanged: (value) => onChanged(value ?? false)),
            Expanded(
              child: GestureDetector(
                onTap: () => onChanged(!boolValue),
                child: _buildFieldLabel(field),
              ),
            ),
          ],
        ),
        if (field.description != null) _buildFieldDescription(field.description!),
      ],
    );
  }

  Widget _buildFieldLabel(ConfigField field) {
    return RichText(
      text: TextSpan(
        style: const TextStyle(
          color: Colors.black87,
          fontSize: 16,
          fontWeight: FontWeight.w500,
        ),
        children: [
          TextSpan(text: field.label),
          if (field.required)
            const TextSpan(
              text: ' *',
              style: TextStyle(color: Colors.red),
            ),
        ],
      ),
    );
  }

  Widget _buildFieldDescription(String description) {
    return Padding(
      padding: const EdgeInsets.only(top: 4.0),
      child: Text(description, style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
    );
  }

  Widget _buildActionConfigSection(AutomationBuilderNotifier automationBuilder) {
    final action = automationBuilder.selectedAction!;

    if (!action.hasConfigFields) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Action: ${action.name}',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                'This action requires no additional configuration.',
                style: TextStyle(color: Colors.grey),
              ),
            ],
          ),
        ),
      );
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Action: ${action.name}',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(action.description, style: const TextStyle(color: Colors.grey)),
            const SizedBox(height: 16),
            ...action.configFields.map((field) {
              final currentValue = automationBuilder.getActionConfigValue(field.name);
              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: _buildConfigField(
                  field,
                  currentValue ?? field.defaultValue,
                  (value) => automationBuilder.setActionConfigValue(field.name, value),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  Widget _buildReactionConfigSection(
    AutomationBuilderNotifier automationBuilder,
    int reactionIndex,
  ) {
    final reactionWithDelay = automationBuilder.selectedReactionsWithDelay[reactionIndex];
    final reaction = reactionWithDelay.reaction;

    if (!reaction.hasConfigFields) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Reaction ${reactionIndex + 1}: ${reaction.name}',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                'This reaction requires no additional configuration.',
                style: TextStyle(color: Colors.grey),
              ),
            ],
          ),
        ),
      );
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Reaction ${reactionIndex + 1}: ${reaction.name}',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(reaction.description, style: const TextStyle(color: Colors.grey)),
            const SizedBox(height: 16),
            ...reaction.configFields.map((field) {
              final currentValue = reactionWithDelay.getConfigValue(field.name);
              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: _buildConfigField(
                  field,
                  currentValue ?? field.defaultValue,
                  (value) => automationBuilder.setReactionConfigValue(
                    reactionIndex,
                    field.name,
                    value,
                  ),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  Future<void> _createAutomation() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final automationBuilder = Provider.of<AutomationBuilderNotifier>(context, listen: false);
    final backendAddressNotifier = Provider.of<BackendAddressNotifier>(context, listen: false);

    final validationErrors = automationBuilder.getValidationErrors();
    if (validationErrors.isNotEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            validationErrors.first,
            style: const TextStyle(color: Colors.white, fontSize: 16),
          ),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    if (backendAddressNotifier.backendAddress == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            AppLocalizations.of(context)!.empty_backend_server_address,
            style: const TextStyle(color: Colors.white, fontSize: 16),
          ),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() {
      _isCreating = true;
    });

    try {
      final selectedAction = automationBuilder.selectedAction!;
      final selectedReactionsWithDelay = automationBuilder.selectedReactionsWithDelay;
      final actionConfig = automationBuilder.actionConfig;
      final reactionConfigs = selectedReactionsWithDelay.map((r) => r.config).toList();

      await ApiMappingActionReaction.createAutomation(
        backendAddressNotifier.backendAddress!,
        _nameController.text.trim(),
        _descriptionController.text.trim(),
        selectedAction,
        selectedReactionsWithDelay,
        actionConfig: actionConfig,
        reactionConfigs: reactionConfigs,
      );

      automationBuilder.clearAll();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text(
              'Automation created successfully!',
              style: TextStyle(color: Colors.white, fontSize: 16),
            ),
            backgroundColor: AppColors.areaBlue3,
          ),
        );

        Navigator.of(context).popUntil((route) => route.isFirst);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Failed to create automation: ${e.toString()}',
              style: const TextStyle(color: Colors.white, fontSize: 16),
            ),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isCreating = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.areaLightGray,
      appBar: AppBar(
        title: const Text(
          'Configure Automation',
          style: TextStyle(fontFamily: 'Montserrat', fontWeight: FontWeight.bold),
        ),
        backgroundColor: AppColors.areaBlue3,
        foregroundColor: AppColors.areaLightGray,
        elevation: 0,
      ),
      body: Consumer<AutomationBuilderNotifier>(
        builder: (context, automationBuilder, child) {
          if (!automationBuilder.isComplete) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 64, color: Colors.red),
                  SizedBox(height: 16),
                  Text(
                    'Invalid automation state',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Please go back and select both an action and at least one reaction.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey),
                  ),
                ],
              ),
            );
          }

          return Form(
            key: _formKey,
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Automation Details',
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _nameController,
                            decoration: const InputDecoration(
                              labelText: 'Name *',
                              border: OutlineInputBorder(),
                              filled: true,
                              fillColor: Colors.white,
                            ),
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return 'Name is required';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _descriptionController,
                            maxLines: 2,
                            decoration: const InputDecoration(
                              labelText: 'Description',
                              border: OutlineInputBorder(),
                              filled: true,
                              fillColor: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  _buildActionConfigSection(automationBuilder),

                  const SizedBox(height: 16),

                  ...List.generate(
                    automationBuilder.selectedReactionsWithDelay.length,
                    (index) => Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: _buildReactionConfigSection(automationBuilder, index),
                    ),
                  ),

                  const SizedBox(height: 24),

                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: _isCreating ? null : _createAutomation,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.areaBlue3,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 4,
                      ),
                      child: _isCreating
                          ? const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: CircularProgressIndicator(
                                    color: Colors.white,
                                    strokeWidth: 2,
                                  ),
                                ),
                                SizedBox(width: 16),
                                Text(
                                  'Creating Automation...',
                                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                ),
                              ],
                            )
                          : const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.rocket_launch, size: 24),
                                SizedBox(width: 8),
                                Text(
                                  'Create Automation',
                                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                    ),
                  ),

                  const SizedBox(height: 32),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
