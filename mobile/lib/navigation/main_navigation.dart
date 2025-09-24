import 'package:area/core/constants/app_colors.dart';
import 'package:area/core/constants/app_constants.dart';
import 'package:flutter/material.dart';
import '../screens/home_screen.dart';
import '../screens/catalogue_screen.dart';
import '../screens/add_automation_screen.dart';
import '../screens/automations_screen.dart';
import '../screens/profile_screen.dart';

class NavigationItem {
  final String label;
  final IconData icon;
  final Widget screen;
  final IconData selectedIcon;

  NavigationItem({
    required this.label,
    required this.icon,
    required this.screen,
    required this.selectedIcon,
  });
}

class MainNavigation extends StatefulWidget {
  @override
  _MainNavigationState createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  int _currentIndex = 0;

  final List<NavigationItem> _pages = [
    NavigationItem(
      label: 'Home',
      icon: Icons.home_outlined,
      screen: HomeScreen(),
      selectedIcon: Icons.home,
    ),
    NavigationItem(
      label: 'Catalogue',
      icon: Icons.apps,
      screen: CatalogueScreen(),
      selectedIcon: Icons.apps,
    ),
    NavigationItem(
      label: 'Add',
      icon: Icons.add_circle_outline,
      screen: AddAutomationScreen(),
      selectedIcon: Icons.add_circle,
    ),
    NavigationItem(
      label: 'AREAs',
      icon: Icons.repeat,
      screen: AutomationsScreen(),
      selectedIcon: Icons.repeat,
    ),
    NavigationItem(
      label: 'Profile',
      icon: Icons.person_outline,
      screen: ProfileScreen(),
      selectedIcon: Icons.person,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _pages[_currentIndex].screen,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        type: BottomNavigationBarType.fixed,
        selectedIconTheme: IconThemeData(
          color: AppColors.primary,
          size: AppDimensions.iconSizeLG,
        ),
        selectedLabelStyle: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
        items: _pages
            .map(
              (item) => BottomNavigationBarItem(
                icon: Icon(item.icon),
                label: item.label,
                activeIcon: Icon(item.selectedIcon),
              ),
            )
            .toList(),
      ),
    );
  }
}
