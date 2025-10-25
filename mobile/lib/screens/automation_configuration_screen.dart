import 'package:area/widgets/common/app_bar/custom_app_bar.dart';
import 'package:area/widgets/common/snackbars/app_snackbar.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:area/core/constants/app_colors.dart';
import 'package:area/core/notifiers/automation_builder_notifier.dart';
import 'package:area/core/notifiers/backend_address_notifier.dart';
import 'package:area/services/api_mapping_action_reaction.dart';
import 'package:area/models/action_models.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/widgets/dynamic_text_field.dart';

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
  bool _isInitialized = false;

  final Map<String, TextEditingController> _configControllers = {};

  @override
  void initState() {
    super.initState();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_isInitialized) {
      _nameController.text = AppLocalizations.of(
        context,
      )!.default_automation_name(DateTime.now().millisecondsSinceEpoch.toString());
      _descriptionController.text = AppLocalizations.of(
        context,
      )!.default_automation_description;
      _isInitialized = true;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    for (final controller in _configControllers.values) {
      controller.dispose();
    }
    _configControllers.clear();
    super.dispose();
  }

  TextEditingController _getOrCreateController(String fieldKey, String? initialValue) {
    if (!_configControllers.containsKey(fieldKey)) {
      _configControllers[fieldKey] = TextEditingController(text: initialValue ?? '');
    } else {
      final currentText = _configControllers[fieldKey]!.text;
      final newText = initialValue ?? '';
      if (currentText != newText) {
        _configControllers[fieldKey]!.text = newText;
      }
    }
    return _configControllers[fieldKey]!;
  }

  Widget _buildConfigField(
    ConfigField field,
    dynamic currentValue,
    Function(dynamic) onChanged, {
    String? contextPrefix,
    List<PayloadField>? payloadFields,
  }) {
    if (field.isDynamic && (field.type == 'text' || field.type == 'textarea')) {
      return _buildDynamicTextField(
        field,
        currentValue,
        onChanged,
        contextPrefix: contextPrefix,
        payloadFields: payloadFields ?? [],
      );
    }

    switch (field.type) {
      case 'text':
      case 'email':
        return _buildTextField(field, currentValue, onChanged, contextPrefix: contextPrefix);
      case 'textarea':
        return _buildTextAreaField(
          field,
          currentValue,
          onChanged,
          contextPrefix: contextPrefix,
        );
      case 'number':
        return _buildNumberField(field, currentValue, onChanged, contextPrefix: contextPrefix);
      case 'select':
        return _buildSelectField(field, currentValue, onChanged);
      case 'checkbox':
        return _buildCheckboxField(field, currentValue, onChanged);
      default:
        return _buildTextField(field, currentValue, onChanged, contextPrefix: contextPrefix);
    }
  }

  Widget _buildDynamicTextField(
    ConfigField field,
    dynamic currentValue,
    Function(dynamic) onChanged, {
    String? contextPrefix,
    required List<PayloadField> payloadFields,
  }) {
    final fieldKey = '${contextPrefix ?? 'dynamic'}_${field.name}';
    final controller = _getOrCreateController(fieldKey, currentValue?.toString());

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        DynamicTextField(
          label: field.label,
          placeholder: field.placeholder,
          required: field.required,
          controller: controller,
          onChanged: onChanged,
          payloadFields: payloadFields,
          maxLines: field.type == 'textarea' ? 3 : 1,
          validator: (value) {
            if (field.required && (value == null || value.isEmpty)) {
              return AppLocalizations.of(context)!.field_required(field.label);
            }
            return null;
          },
        ),
        if (field.description != null) _buildFieldDescription(field.description!),
      ],
    );
  }

  Widget _buildTextField(
    ConfigField field,
    dynamic currentValue,
    Function(dynamic) onChanged, {
    String? contextPrefix,
  }) {
    final fieldKey = '${contextPrefix ?? 'text'}_${field.name}';
    final controller = _getOrCreateController(fieldKey, currentValue?.toString());

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
              return AppLocalizations.of(context)!.field_required(field.label);
            }
            if (field.type == 'email' && value != null && value.isNotEmpty) {
              if (!RegExp(r'^[^@]+@[^@]+\.[^@]+').hasMatch(value)) {
                return AppLocalizations.of(context)!.valid_email_required;
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
    Function(dynamic) onChanged, {
    String? contextPrefix,
  }) {
    final fieldKey = '${contextPrefix ?? 'textarea'}_${field.name}';
    final controller = _getOrCreateController(fieldKey, currentValue?.toString());

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
              return AppLocalizations.of(context)!.field_required(field.label);
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
    Function(dynamic) onChanged, {
    String? contextPrefix,
  }) {
    final fieldKey = '${contextPrefix ?? 'number'}_${field.name}';
    final controller = _getOrCreateController(fieldKey, currentValue?.toString());

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
              return AppLocalizations.of(context)!.field_required(field.label);
            }
            if (value != null && value.isNotEmpty) {
              if (num.tryParse(value) == null) {
                return AppLocalizations.of(context)!.valid_number_required;
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
          AppLocalizations.of(context)!.invalid_select_field(field.label),
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
              return AppLocalizations.of(context)!.field_required(field.label);
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
                AppLocalizations.of(context)!.action_colon(action.name),
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),

              const SizedBox(height: 8),

              Text(
                AppLocalizations.of(context)!.no_additional_config,
                style: const TextStyle(color: Colors.grey),
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
              AppLocalizations.of(context)!.action_colon(action.name),
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
                  contextPrefix: 'action_${field.type}',
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
    final action = automationBuilder.selectedAction;

    if (!reaction.hasConfigFields) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                AppLocalizations.of(
                  context,
                )!.reaction_number(reactionIndex + 1, reaction.name),
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),

              const SizedBox(height: 8),

              Text(
                AppLocalizations.of(context)!.no_additional_config_reaction,
                style: const TextStyle(color: Colors.grey),
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
              AppLocalizations.of(context)!.reaction_number(reactionIndex + 1, reaction.name),
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
                  contextPrefix: 'reaction_${reactionIndex}_${field.type}',
                  payloadFields: action?.payloadFields,
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
      showErrorSnackbar(context, validationErrors.first);
      return;
    }

    if (backendAddressNotifier.backendAddress == null) {
      showErrorSnackbar(context, AppLocalizations.of(context)!.empty_backend_server_address);
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
        showInfoSnackbar(context, 'Automation created successfully!');

        Navigator.of(context).popUntil((route) => route.isFirst);
      }
    } catch (e) {
      if (mounted) {
        showErrorSnackbar(
          context,
          AppLocalizations.of(
            context,
          )!.failed_create_automation(e.toString().replaceAll("Exception: ", "")),
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
      appBar: CustomAppBar(title: AppLocalizations.of(context)!.configure_automation),
      body: Consumer<AutomationBuilderNotifier>(
        builder: (context, automationBuilder, child) {
          if (!automationBuilder.isComplete) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 64, color: Colors.red),

                  SizedBox(height: 16),

                  Text(
                    AppLocalizations.of(context)!.invalid_automation_state,
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),

                  SizedBox(height: 8),

                  Text(
                    AppLocalizations.of(context)!.go_back_select_action_reaction,
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
                          Text(
                            AppLocalizations.of(context)!.automation_details,
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                          ),

                          const SizedBox(height: 16),

                          TextFormField(
                            controller: _nameController,
                            decoration: InputDecoration(
                              labelText: "${AppLocalizations.of(context)!.automation_name}  *",
                              border: OutlineInputBorder(),
                              filled: true,
                              fillColor: Colors.white,
                            ),
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return AppLocalizations.of(context)!.name_required;
                              }
                              return null;
                            },
                          ),

                          const SizedBox(height: 16),

                          TextFormField(
                            controller: _descriptionController,
                            maxLines: 2,
                            decoration: InputDecoration(
                              labelText: AppLocalizations.of(context)!.automation_description,
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
                        foregroundColor: AppColors.areaLightGray,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 4,
                      ),
                      child: _isCreating
                          ? Row(
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
                                  AppLocalizations.of(context)!.creating_automation,
                                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                ),
                              ],
                            )
                          : Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.rocket_launch, size: 24),

                                SizedBox(width: 8),

                                Text(
                                  AppLocalizations.of(context)!.create_automation,
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
