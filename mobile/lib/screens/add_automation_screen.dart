import 'package:area/core/constants/app_colors.dart';
import 'package:flutter/material.dart';

class AddAutomationScreen extends StatefulWidget {
  const AddAutomationScreen({super.key});

  @override
  AddAutomationScreenState createState() => AddAutomationScreenState();
}

class AddAutomationScreenState extends State<AddAutomationScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Create your automation'),
        backgroundColor: AppColors.areaBlue1,
        foregroundColor: AppColors.areaLightGray,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          spacing: 32,
          children: [
            Text(
              "Select the Action and REAction.",
              style: TextStyle(fontWeight: FontWeight.w500, color: AppColors.areaDarkGray),
            ),
            Wrap(
              direction: Axis.vertical,
              spacing: 8,
              children: [
                ElevatedButton(
                  onPressed: () => print("added action"),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.areaBlue1,
                    padding: EdgeInsets.symmetric(vertical: 8, horizontal: 32),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
                  ),
                  child: RichText(
                    text: TextSpan(
                      style: TextStyle(
                        color: AppColors.areaLightGray,
                        fontSize: 32,
                        fontFamily: 'Montserrat',
                        fontWeight: FontWeight.w400,
                      ),
                      children: <TextSpan>[
                        TextSpan(
                          text: 'A',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 64),
                        ),
                        TextSpan(text: 'CTION'),
                      ],
                    ),
                  ),
                ),
                ElevatedButton(
                  onPressed: () => print("added reaction"),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.areaBlue3,
                    padding: EdgeInsets.symmetric(vertical: 8, horizontal: 32),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
                  ),
                  child: RichText(
                    text: TextSpan(
                      style: TextStyle(
                        color: AppColors.areaLightGray,
                        fontSize: 32,
                        fontFamily: 'Montserrat',
                        fontWeight: FontWeight.w400,
                      ),
                      children: <TextSpan>[
                        TextSpan(
                          text: 'REA',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 64),
                        ),
                        TextSpan(text: 'CTION'),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
