import 'package:area/core/constants/app_colors.dart';
import 'package:flutter/material.dart';

class AddAutomationScreen extends StatefulWidget {
  const AddAutomationScreen({super.key});

  @override
  AddAutomationScreenState createState() => AddAutomationScreenState();
}

class AddAutomationScreenState extends State<AddAutomationScreen> {
  bool _actionSelected = false;

  void _setSelected() {
    setState(() {
      _actionSelected = !_actionSelected;
    });
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const SizedBox(height: 50),
            SizedBox(
              height: 250,
              child: Center(
                child: Image(
                  image: const AssetImage('assets/web-app-manifest-512x512.png'),
                  width: 200,
                  height: 200,
                ),
              ),
            ),
            const SizedBox(height: 50),
            Wrap(
              direction: Axis.vertical,
              spacing: 32,
              children: [
                ElevatedButton(
                  onPressed: () => _setSelected(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.areaBlue3,
                    padding: EdgeInsets.symmetric(vertical: 16, horizontal: 40),
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
                            "Action",
                            style: const TextStyle(
                              fontFamily: 'Montserrat',
                              color: AppColors.areaLightGray,
                              fontWeight: FontWeight.w700,
                              fontSize: 28.0,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Icon(Icons.add, color: AppColors.areaLightGray, size: 32),
                      ],
                    ),
                  ),
                ),
                ElevatedButton(
                  onPressed: _actionSelected ? () {} : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.areaBlue3,
                    padding: EdgeInsets.symmetric(vertical: 16, horizontal: 40),
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
                            "REAction",
                            style: const TextStyle(
                              fontFamily: 'Montserrat',
                              color: AppColors.areaLightGray,
                              fontWeight: FontWeight.w700,
                              fontSize: 28.0,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Icon(
                          Icons.add,
                          color: AppColors.areaLightGray,
                          size: _actionSelected ? 32 : 0,
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
