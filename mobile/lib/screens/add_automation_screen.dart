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
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.center,
        spacing: 75,
        children: [
          SizedBox(
            height: 300,
            child: Wrap(
              direction: Axis.vertical,
              alignment: WrapAlignment.end,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                Image(
                  image: AssetImage('assets/web-app-manifest-512x512.png'),
                  width: 200,
                  height: 200,
                ),
              ],
            ),
          ),
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
                child: SizedBox(
                  width: 250,
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    mainAxisSize: MainAxisSize.max,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        "Action",
                        style: TextStyle(
                          fontFamily: 'Montserrat',
                          color: AppColors.areaLightGray,
                          fontWeight: FontWeight.w700,
                          fontSize: 32.0,
                        ),
                      ),
                      Icon(
                        Icons.add,
                        color: AppColors.areaLightGray,
                        size: 40,
                        fontWeight: FontWeight.w900,
                      ),
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
                child: SizedBox(
                  width: 250,
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    mainAxisSize: MainAxisSize.max,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        "REAction",
                        style: TextStyle(
                          fontFamily: 'Montserrat',
                          color: AppColors.areaLightGray,
                          fontWeight: FontWeight.w700,
                          fontSize: 32.0,
                        ),
                      ),
                      Icon(
                        Icons.add,
                        color: AppColors.areaLightGray,
                        size: _actionSelected ? 40 : 0,
                        fontWeight: FontWeight.w900,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
