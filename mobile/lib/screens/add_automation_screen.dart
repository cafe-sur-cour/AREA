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
      appBar: AppBar(title: Text('Add Automation')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [Text("Welcome to Add Automation page")],
        ),
      ),
    );
  }
}
