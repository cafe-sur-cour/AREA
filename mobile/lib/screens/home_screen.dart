import 'package:area/widgets/common/app_bar/custom_app_bar.dart';
import 'package:flutter/material.dart';
import 'package:area/l10n/app_localizations.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  HomeScreenState createState() => HomeScreenState();
}

class HomeScreenState extends State<HomeScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: CustomAppBar(title: AppLocalizations.of(context)!.label_home),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [Text(AppLocalizations.of(context)!.welcome_home)],
        ),
      ),
    );
  }
}
