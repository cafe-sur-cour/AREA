import 'package:flutter/material.dart';

class AutomationsScreen extends StatefulWidget {
  const AutomationsScreen({super.key});

  @override
  AutomationsScreenState createState() => AutomationsScreenState();
}

class AutomationsScreenState extends State<AutomationsScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Automations')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [Text("Welcome to Automations page")],
        ),
      ),
    );
  }
}
