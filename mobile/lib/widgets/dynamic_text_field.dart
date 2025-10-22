import 'package:flutter/material.dart';
import 'package:area/models/action_models.dart';
import 'package:area/core/constants/app_colors.dart';
import 'package:area/l10n/app_localizations.dart';

class DynamicTextField extends StatefulWidget {
  final String? label;
  final String? placeholder;
  final bool required;
  final String? initialValue;
  final Function(String) onChanged;
  final List<PayloadField> payloadFields;
  final int maxLines;
  final String? Function(String?)? validator;
  final TextEditingController? controller;

  const DynamicTextField({
    super.key,
    this.label,
    this.placeholder,
    this.required = false,
    this.initialValue,
    required this.onChanged,
    this.payloadFields = const [],
    this.maxLines = 1,
    this.validator,
    this.controller,
  });

  @override
  State<DynamicTextField> createState() => _DynamicTextFieldState();
}

class _DynamicTextFieldState extends State<DynamicTextField> {
  late TextEditingController _controller;
  final FocusNode _focusNode = FocusNode();
  final LayerLink _layerLink = LayerLink();
  OverlayEntry? _overlayEntry;

  List<PayloadField> _filteredSuggestions = [];
  int _selectedIndex = -1;

  @override
  void initState() {
    super.initState();
    _controller = widget.controller ?? TextEditingController(text: widget.initialValue);
    _focusNode.addListener(_onFocusChange);
  }

  @override
  void dispose() {
    _removeOverlay();
    _focusNode.removeListener(_onFocusChange);
    _focusNode.dispose();
    if (widget.controller == null) {
      _controller.dispose();
    }
    super.dispose();
  }

  void _onFocusChange() {
    if (!_focusNode.hasFocus) {
      _hideOverlay();
    }
  }

  void _onTextChanged(String text) {
    widget.onChanged(text);

    final cursorPosition = _controller.selection.baseOffset;
    if (cursorPosition < 0) return;

    final textBeforeCursor = text.substring(0, cursorPosition);
    final lastOpenBrace = textBeforeCursor.lastIndexOf('{');

    if (lastOpenBrace != -1 && lastOpenBrace == cursorPosition - 1) {
      _filteredSuggestions = widget.payloadFields;
      _selectedIndex = -1;
      _showOverlay();
    } else {
      _hideOverlay();
    }
  }

  void _showOverlay() {
    if (_filteredSuggestions.isEmpty) return;

    _removeOverlay();

    _overlayEntry = _createOverlayEntry();
    Overlay.of(context).insert(_overlayEntry!);
  }

  void _hideOverlay() {
    _removeOverlay();
    setState(() {
      _selectedIndex = -1;
    });
  }

  void _removeOverlay() {
    _overlayEntry?.remove();
    _overlayEntry = null;
  }

  OverlayEntry _createOverlayEntry() {
    final renderBox = context.findRenderObject() as RenderBox;
    final size = renderBox.size;

    return OverlayEntry(
      builder: (context) => Positioned(
        width: size.width,
        child: CompositedTransformFollower(
          link: _layerLink,
          showWhenUnlinked: false,
          offset: Offset(0, size.height + 4),
          child: Material(
            elevation: 8,
            borderRadius: BorderRadius.circular(8),
            child: Container(
              constraints: const BoxConstraints(maxHeight: 200),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: ListView.builder(
                padding: EdgeInsets.zero,
                shrinkWrap: true,
                itemCount: _filteredSuggestions.length,
                itemBuilder: (context, index) {
                  final field = _filteredSuggestions[index];
                  final isSelected = index == _selectedIndex;

                  return InkWell(
                    onTap: () => _insertSuggestion(field),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? AppColors.areaBlue3.withValues(alpha: 0.1)
                            : Colors.transparent,
                        border: Border(
                          bottom: BorderSide(
                            color: index < _filteredSuggestions.length - 1
                                ? Colors.grey.shade200
                                : Colors.transparent,
                          ),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '{{action.payload.${field.path}}}',
                            style: TextStyle(
                              fontFamily: 'monospace',
                              fontSize: 12,
                              color: AppColors.areaBlue3,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            field.description,
                            style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                          ),
                          if (field.example != null) ...[
                            const SizedBox(height: 2),
                            Text(
                              AppLocalizations.of(context)!.example(field.example!),
                              style: TextStyle(
                                fontSize: 10,
                                color: Colors.grey.shade500,
                                fontStyle: FontStyle.italic,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _insertSuggestion(PayloadField field) {
    final currentCursorPos = _controller.selection.baseOffset;
    final text = _controller.text;
    final textBeforeCursor = text.substring(0, currentCursorPos);
    final lastOpenBrace = textBeforeCursor.lastIndexOf('{');

    if (lastOpenBrace != -1 && lastOpenBrace == currentCursorPos - 1) {
      final beforeBrace = text.substring(0, lastOpenBrace);
      final afterBrace = text.substring(currentCursorPos);
      final template = '{{action.payload.${field.path}}}';
      final newText = '$beforeBrace$template$afterBrace';

      _controller.value = TextEditingValue(
        text: newText,
        selection: TextSelection.collapsed(offset: beforeBrace.length + template.length),
      );

      widget.onChanged(newText);
      _hideOverlay();

      _focusNode.requestFocus();
    }
  }

  @override
  Widget build(BuildContext context) {
    return CompositedTransformTarget(
      link: _layerLink,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (widget.label != null) ...[
            RichText(
              text: TextSpan(
                style: const TextStyle(
                  color: Colors.black87,
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
                children: [
                  TextSpan(text: widget.label),
                  if (widget.required)
                    const TextSpan(
                      text: ' *',
                      style: TextStyle(color: Colors.red),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 8),
          ],
          if (widget.payloadFields.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(8),
              margin: const EdgeInsets.only(bottom: 8),
              decoration: BoxDecoration(
                color: AppColors.areaBlue3.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.areaBlue3.withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  Icon(Icons.lightbulb_outline, size: 16, color: AppColors.areaBlue3),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      AppLocalizations.of(context)!.type_brace_for_suggestions('{'),
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.areaBlue3,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          TextFormField(
            controller: _controller,
            focusNode: _focusNode,
            maxLines: widget.maxLines,
            style: const TextStyle(fontFamily: 'monospace', fontSize: 14),
            decoration: InputDecoration(
              hintText: widget.placeholder,
              border: const OutlineInputBorder(),
              filled: true,
              fillColor: AppColors.areaBlue3.withValues(alpha: 0.05),
            ),
            validator: widget.validator,
            onChanged: _onTextChanged,
          ),
        ],
      ),
    );
  }
}
