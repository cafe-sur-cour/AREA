import { User } from './entity/User';
import { UserToken } from './entity/UserToken';
import { UserSessions } from './entity/UserSessions';
import { UserActivityLogs } from './entity/UserActivityLogs';
import { UserServiceConfigs } from './entity/UserServiceConfigs';
import { ExternalWebhooks } from './entity/ExternalWebhooks';
import { WebhookConfigs } from './entity/WebhookConfigs';
import { WebhookEvents } from './entity/WebhookEvents';
import { WebhookFailures } from './entity/WebhookFailures';
import { WebhookReactions } from './entity/WebhookReactions';
import { WebhookStats } from './entity/WebhookStats';

import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import * as AdminJSTypeorm from '@adminjs/typeorm';
import { DataSource } from 'typeorm';
import bcrypt from 'bcryptjs';
import session from 'express-session';

AdminJS.registerAdapter({
  Resource: AdminJSTypeorm.Resource,
  Database: AdminJSTypeorm.Database,
});

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
      UserServiceConfigs,
      ExternalWebhooks,
      WebhookConfigs,
      WebhookEvents,
      WebhookFailures,
      WebhookReactions,
      WebhookStats,
    ],
  });

  const router = AdminJSExpress.buildAuthenticatedRouter(
    admin,
    {
      authenticate: async (email, password) => {
        const userRepo = AppDataSource.getRepository(User);

        const user = await userRepo.findOne({
          where: { email, is_admin: true },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return null;

        return { id: user.id, email: user.email };
      },
      cookieName: 'adminjs',
      cookiePassword: 'super-secret-pass',
    },
    null,
    sessionOptions
  );

  return { admin, adminRouter: router };
};

export default AdminRouter;
