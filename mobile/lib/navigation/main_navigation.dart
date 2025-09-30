import 'package:area/core/constants/app_colors.dart';
import 'package:area/core/constants/app_constants.dart';
import 'package:area/l10n/app_localizations.dart';
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
  const MainNavigation({super.key});

  @override
  MainNavigationState createState() => MainNavigationState();
}

class MainNavigationState extends State<MainNavigation> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    late final List<NavigationItem> pages = [
      NavigationItem(
        label: AppLocalizations.of(context)!.label_home,
        icon: Icons.home_outlined,
        screen: HomeScreen(),
        selectedIcon: Icons.home,
      ),
      NavigationItem(
        label: AppLocalizations.of(context)!.label_catalogue,
        icon: Icons.apps,
        screen: CatalogueScreen(),
        selectedIcon: Icons.apps,
      ),
      NavigationItem(
        label: AppLocalizations.of(context)!.label_add,
        icon: Icons.add_circle_outline,
        screen: AddAutomationScreen(),
        selectedIcon: Icons.add_circle,
      ),
      NavigationItem(
        label: AppLocalizations.of(context)!.label_areas,
        icon: Icons.repeat,
        screen: AutomationsScreen(),
        selectedIcon: Icons.repeat,
      ),
      NavigationItem(
        label: AppLocalizations.of(context)!.label_profile,
        icon: Icons.person_outline,
        screen: ProfileScreen(),
        selectedIcon: Icons.person,
      ),
    ];

    return Scaffold(
      body: pages[_currentIndex].screen,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        type: BottomNavigationBarType.fixed,
        selectedIconTheme: IconThemeData(
          color: AppColors.primary,
          size: AppDimensions.iconSizeLG,
        ),
        selectedLabelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
        items: pages
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
