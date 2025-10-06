import 'package:area/core/constants/app_colors.dart';
import 'package:area/core/constants/app_constants.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/models/action_models.dart';
import 'package:area/models/service_models.dart';
import 'package:area/models/reaction_with_delay_model.dart';
import 'package:area/screens/home_screen.dart';
import 'package:area/screens/catalogue_screen.dart';
import 'package:area/screens/add_automation_screen.dart';
import 'package:area/screens/automations_screen.dart';
import 'package:area/screens/profile_screen.dart';
import 'package:flutter/material.dart';

class NavigationItem {
  final String label;
  final IconData icon;
  final Widget Function()? screenBuilder;
  final Widget? screen;
  final IconData selectedIcon;

  NavigationItem({
    required this.label,
    required this.icon,
    this.screenBuilder,
    this.screen,
    required this.selectedIcon,
  }) : assert(screenBuilder != null || screen != null);
}

class MainNavigation extends StatefulWidget {
  final ActionModel? selectedAction;
  final ServiceModel? selectedService;
  final List<ReactionWithDelayModel>? selectedReactionsWithDelay;

  const MainNavigation({
    super.key,
    this.selectedAction,
    this.selectedService,
    this.selectedReactionsWithDelay,
  });

  @override
  MainNavigationState createState() => MainNavigationState();
}

class MainNavigationState extends State<MainNavigation> {
  int _currentIndex = 2;

  @override
  void initState() {
    super.initState();
    if (widget.selectedAction != null || widget.selectedReactionsWithDelay != null) {
      _currentIndex = 2;
    } else {
      _currentIndex = 0;
    }
  }

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
        screenBuilder: () => AddAutomationScreen(
          selectedAction: widget.selectedAction,
          selectedService: widget.selectedService,
          selectedReactionsWithDelay: widget.selectedReactionsWithDelay,
        ),
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
      body: pages[_currentIndex].screenBuilder?.call() ?? pages[_currentIndex].screen!,
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
