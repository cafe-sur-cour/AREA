import 'package:flutter/material.dart';

class CatalogueScreen extends StatefulWidget {
  const CatalogueScreen({super.key});

  @override
  CatalogueScreenState createState() => CatalogueScreenState();
}

class CatalogueScreenState extends State<CatalogueScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Catalogue')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [Text("Welcome to catalogue page")],
        ),
      ),
    );
  }
}
