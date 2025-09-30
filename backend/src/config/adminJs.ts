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


// Register the TypeORM adapter
AdminJS.registerAdapter({
  Resource: AdminJSTypeorm.Resource,
  Database: AdminJSTypeorm.Database,
});


// For development/testing - hardcoded credentials
export const authenticateAdminSimple = async (email: string, password: string) => {
  console.log("🔑 Simple authenticate function called with:", email);

  if (email === "albane" && password === "admin") {
    console.log("✅ Authentication successful for:", email);
    return { email: "albane", id: 1 };
  }

  console.log("❌ Authentication failed for:", email);
  return null;
};

const AdminRouter = async (AppDataSource: DataSource) => {
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

  // Use buildRouter without authentication
  // We'll handle auth manually in index.ts
  const router = AdminJSExpress.buildRouter(admin);

  return { admin, adminRouter: router };
};

export default AdminRouter;
