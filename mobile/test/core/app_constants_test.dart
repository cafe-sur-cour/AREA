import 'package:flutter_test/flutter_test.dart';
import 'package:area/core/constants/app_constants.dart';

void main() {
  group('AppRoutes', () {
    test('healthCheck route should be correct', () {
      expect(AppRoutes.healthCheck, 'api/info/health');
    });

    test('login route should be correct', () {
      expect(AppRoutes.login, 'api/auth/login');
    });

    test('register route should be correct', () {
      expect(AppRoutes.register, 'api/auth/register');
    });

    test('logout route should be correct', () {
      expect(AppRoutes.logout, 'api/auth/logout');
    });

    test('forgotPassword route should be correct', () {
      expect(AppRoutes.forgotPassword, 'api/auth/forgot-password');
    });

    test('jwtCheck route should be correct', () {
      expect(AppRoutes.jwtCheck, 'api/auth/login/status');
    });

    test('me route should be correct', () {
      expect(AppRoutes.me, 'api/user/me');
    });

    test('githubLogin route should be correct', () {
      expect(AppRoutes.githubLogin, 'api/auth/github/login');
    });

    test('microsoftLogin route should be correct', () {
      expect(AppRoutes.microsoftLogin, 'api/auth/microsoft/login');
    });

    test('googleLogin route should be correct', () {
      expect(AppRoutes.googleLogin, 'api/auth/google/login');
    });

    test('services route should be correct', () {
      expect(AppRoutes.services, 'api/services');
    });

    test('servicesSubscribed route should be correct', () {
      expect(AppRoutes.servicesSubscribed, 'api/services/subscribed');
    });

    test('servicesWithActions route should be correct', () {
      expect(AppRoutes.servicesWithActions, 'api/services/actions');
    });

    test('servicesWithReactions route should be correct', () {
      expect(AppRoutes.servicesWithReactions, 'api/services/reactions');
    });

    test('actionsFromService should return correct route', () {
      expect(AppRoutes.actionsFromService('service1'), 'api/services/service1/actions');
    });

    test('reactionsFromService should return correct route', () {
      expect(AppRoutes.reactionsFromService('service2'), 'api/services/service2/reactions');
    });

    test('actionById should return correct route', () {
      expect(
        AppRoutes.actionById('service1', 'action1'),
        'api/services/service1/actions/action1',
      );
    });

    test('reactionById should return correct route', () {
      expect(
        AppRoutes.reactionById('service2', 'reaction1'),
        'api/services/service2/reactions/reaction1',
      );
    });

    test('createAutomation route should be correct', () {
      expect(AppRoutes.createAutomation, 'api/mappings');
    });

    test('getAutomations route should be correct', () {
      expect(AppRoutes.getAutomations, 'api/mappings');
    });

    test('deleteAutomation should return correct route', () {
      expect(AppRoutes.deleteAutomation('id1'), 'api/mappings/id1');
    });

    test('activateAutomation should return correct route', () {
      expect(AppRoutes.activateAutomation('id1'), 'api/mappings/id1/activate');
    });

    test('deactivateAutomation should return correct route', () {
      expect(AppRoutes.deactivateAutomation('id1'), 'api/mappings/id1/deactivate');
    });

    test('about route should be correct', () {
      expect(AppRoutes.about, 'about.json');
    });
  });

  group('AppDimensions', () {
    test('paddingXS should be correct', () {
      expect(AppDimensions.paddingXS, 4.0);
    });

    test('paddingSM should be correct', () {
      expect(AppDimensions.paddingSM, 8.0);
    });

    test('paddingMD should be correct', () {
      expect(AppDimensions.paddingMD, 16.0);
    });

    test('paddingLG should be correct', () {
      expect(AppDimensions.paddingLG, 24.0);
    });

    test('paddingXL should be correct', () {
      expect(AppDimensions.paddingXL, 32.0);
    });

    test('borderRadiusXS should be correct', () {
      expect(AppDimensions.borderRadiusXS, 4.0);
    });

    test('borderRadiusSM should be correct', () {
      expect(AppDimensions.borderRadiusSM, 8.0);
    });

    test('borderRadiusMD should be correct', () {
      expect(AppDimensions.borderRadiusMD, 12.0);
    });

    test('borderRadiusLG should be correct', () {
      expect(AppDimensions.borderRadiusLG, 16.0);
    });

    test('borderRadiusXL should be correct', () {
      expect(AppDimensions.borderRadiusXL, 20.0);
    });

    test('iconSizeSM should be correct', () {
      expect(AppDimensions.iconSizeSM, 16.0);
    });

    test('iconSizeMD should be correct', () {
      expect(AppDimensions.iconSizeMD, 24.0);
    });

    test('iconSizeLG should be correct', () {
      expect(AppDimensions.iconSizeLG, 32.0);
    });

    test('iconSizeXL should be correct', () {
      expect(AppDimensions.iconSizeXL, 48.0);
    });

    test('buttonHeightSM should be correct', () {
      expect(AppDimensions.buttonHeightSM, 32.0);
    });

    test('buttonHeightMD should be correct', () {
      expect(AppDimensions.buttonHeightMD, 48.0);
    });

    test('buttonHeightLG should be correct', () {
      expect(AppDimensions.buttonHeightLG, 56.0);
    });

    test('appBarHeight should be correct', () {
      expect(AppDimensions.appBarHeight, 56.0);
    });

    test('appBarElevation should be correct', () {
      expect(AppDimensions.appBarElevation, 4.0);
    });

    test('bottomNavBarHeight should be correct', () {
      expect(AppDimensions.bottomNavBarHeight, 60.0);
    });
  });
}
