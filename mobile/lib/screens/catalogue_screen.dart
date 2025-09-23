import 'package:flutter/material.dart';

class CatalogueScreen extends StatefulWidget {
    @override
    _CatalogueScreenState createState() => _CatalogueScreenState();
}

class _CatalogueScreenState extends State<CatalogueScreen> {
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
