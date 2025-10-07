import { User } from './entity/User';
import { UserToken } from './entity/UserToken';
import { UserSessions } from './entity/UserSessions';
import { UserActivityLogs } from './entity/UserActivityLogs';
import { UserServiceSubscriptions } from './entity/UserServiceSubscriptions';
import { ExternalWebhooks } from './entity/ExternalWebhooks';
import { WebhookConfigs } from './entity/WebhookConfigs';
import { WebhookEvents } from './entity/WebhookEvents';
import { WebhookFailures } from './entity/WebhookFailures';
import { WebhookReactions } from './entity/WebhookReactions';
import { WebhookStats } from './entity/WebhookStats';
import { DashboardService } from './dashboardService';

import { encryption } from '../../index';
import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import { ComponentLoader } from 'adminjs';
import * as AdminJSTypeorm from '@adminjs/typeorm';
import { DataSource } from 'typeorm';
import bcrypt from 'bcryptjs';
import session from 'express-session';

AdminJS.registerAdapter({
  Resource: AdminJSTypeorm.Resource,
  Database: AdminJSTypeorm.Database,
});

const myCustomTheme = {
  id: 'my-custom-theme',
  name: 'My Custom Theme',
  overrides: {
    colors: {
      primary100: '#3e6172',
      primary80: '#57798B',
      primary60: '#648BA0',
      primary40: '#e4e2DD',
      primary20: '#45433E',

      accent: '#3e6172',
      hoverBg: '#648BA0',

      bg: '#ffffff',
      defaultText: '#333333',
    },
  },
};

const componentLoader = new ComponentLoader();

const Components = {
  Dashboard: componentLoader.add('Dashboard', './dashboard'),
};

const AdminRouter = async (
  AppDataSource: DataSource,
  sessionOptions: session.SessionOptions
) => {
  const admin = new AdminJS({
    databases: [AppDataSource],
    rootPath: '/admin',
    resources: [
      User,
      UserToken,
      UserSessions,
      UserActivityLogs,
      UserServiceSubscriptions,
      ExternalWebhooks,
      WebhookConfigs,
      WebhookEvents,
      WebhookFailures,
      WebhookReactions,
      WebhookStats,
    ],
    dashboard: {
      component: Components.Dashboard,
    },
    componentLoader,
    defaultTheme: myCustomTheme.id,
    availableThemes: [myCustomTheme],
  });

  const router = AdminJSExpress.buildAuthenticatedRouter(
    admin,
    {
      authenticate: async (email, password) => {
        console.log('AdminJS login attempt for:', email);
        
        // Get all admin users and decrypt their emails to find a match
        const userRepo = AppDataSource.getRepository(User);
        const adminUsers = await userRepo.find({ where: { is_admin: true } });
        
        let user: User | null = null;
        for (const adminUser of adminUsers) {
          try {
            const decryptedEmail = encryption.decryptFromString(adminUser.email);
            if (decryptedEmail === email) {
              user = adminUser;
              break;
            }
          } catch (error) {
            console.error('Error decrypting email for user:', adminUser.id, error);
            continue;
          }
        }
        
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return null;

        return { id: user.id, email: email };
      },
      cookieName: 'adminjs',
      cookiePassword: 'super-secret-pass',
    },
    null,
    sessionOptions
  );

  const dashboardService = new DashboardService(AppDataSource);

  router.get('/api/dashboard-stats', async (req, res) => {
    try {
      const stats = await dashboardService.getDashboardData();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
  });

  return { admin, adminRouter: router };
};

export default AdminRouter;
