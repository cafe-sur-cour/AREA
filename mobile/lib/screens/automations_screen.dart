import 'package:flutter/material.dart';

class AutomationsScreen extends StatefulWidget {
    @override
    _AutomationsScreenState createState() => _AutomationsScreenState();
}

class _AutomationsScreenState extends State<AutomationsScreen> {
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
