import 'package:area/main.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  ProfileScreenState createState() => ProfileScreenState();
}

class ProfileScreenState extends State<ProfileScreen> {
  @override
  Widget build(BuildContext context) {
    final localeNotifier = Provider.of<LocaleNotifier>(context, listen: false);

    return Scaffold(
      appBar: AppBar(title: Text('Profile')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text("Welcome to profile page"),
            ElevatedButton(
              onPressed: () => localeNotifier.setLocale(const Locale('fr')),
              child: Text("Switch to french"),
            ),
            ElevatedButton(
              onPressed: () => localeNotifier.setLocale(const Locale('en')),
              child: Text("Switch to english"),
            ),
          ],
        ),
      ),
    );
  }
}
