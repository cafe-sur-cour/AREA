import 'package:flutter/material.dart';
import '../screens/home_screen.dart';
import '../screens/catalogue_screen.dart';
import '../screens/add_automation_screen.dart';
import '../screens/automations_screen.dart';
import '../screens/profile_screen.dart';

class MainNavigation extends StatefulWidget {
    @override
    _MainNavigationState createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
    int _currentIndex = 0;

    final List<Widget> _pages = [
        HomeScreen(),
        CatalogueScreen(),
        AddAutomationScreen(),
        AutomationsScreen(),
        ProfileScreen(),
    ];

    @override
    Widget build(BuildContext context) {
        return Scaffold(
            body: _pages[_currentIndex],
            bottomNavigationBar: BottomNavigationBar(
                currentIndex: _currentIndex,
                onTap: (index) => setState(() => _currentIndex = index),
                type: BottomNavigationBarType.fixed,
                selectedIconTheme: const IconThemeData(
                    size: 28,
                ),
                selectedLabelStyle: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                ),
                unselectedLabelStyle: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w400,
                ),
                items: [
                    BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
                    BottomNavigationBarItem(icon: Icon(Icons.apps_sharp), label: 'Catalogue'),
                    BottomNavigationBarItem(icon: Icon(Icons.add), label: 'Add'),
                    BottomNavigationBarItem(icon: Icon(Icons.repeat), label: 'AREAs'),
                    BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
                ],
            ),
        );
    }
}
