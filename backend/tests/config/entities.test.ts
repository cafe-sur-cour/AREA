import { getMetadataArgsStorage } from 'typeorm';
import { User } from '../../src/config/entity/User';
import { UserOAuthProvider } from '../../src/config/entity/UserOAuthProvider';
import { UserToken } from '../../src/config/entity/UserToken';
import { UserActivityLogs } from '../../src/config/entity/UserActivityLogs';
import { UserServiceSubscriptions } from '../../src/config/entity/UserServiceSubscriptions';
import { ExternalWebhooks } from '../../src/config/entity/ExternalWebhooks';
import { WebhookConfigs } from '../../src/config/entity/WebhookConfigs';
import { WebhookEvents } from '../../src/config/entity/WebhookEvents';
import { WebhookFailures } from '../../src/config/entity/WebhookFailures';
import { WebhookReactions } from '../../src/config/entity/WebhookReactions';
import { WebhookStats } from '../../src/config/entity/WebhookStats';
import { Session } from '../../src/config/entity/Session';
import { Logger } from '../../src/config/entity/Logger';

describe('Entity Metadata Coverage', () => {
  beforeAll(() => {
    // Ensure all entities are loaded
    [User, UserOAuthProvider, UserToken, UserActivityLogs, UserServiceSubscriptions,
     ExternalWebhooks, WebhookConfigs, WebhookEvents, WebhookFailures, WebhookReactions,
     WebhookStats, Session, Logger].forEach(entity => {
      // Force entity registration by accessing metadata
      getMetadataArgsStorage().tables.find(table => table.target === entity);
    });
  });

  describe('User Entity', () => {
    it('should have correct column metadata', () => {
      const metadata = getMetadataArgsStorage();
      const table = metadata.tables.find(t => t.target === User);
      expect(table).toBeDefined();
      expect(table?.name).toBe('users');

      const columns = metadata.columns.filter(c => c.target === User);

      // Test specific column configurations that weren't covered
      const emailColumn = columns.find(c => c.propertyName === 'email');
      expect(emailColumn?.options.unique).toBe(true);

      const isAdminColumn = columns.find(c => c.propertyName === 'is_admin');
      expect(isAdminColumn?.options.default).toBe(false);

      const emailVerifiedColumn = columns.find(c => c.propertyName === 'email_verified');
      expect(emailVerifiedColumn?.options.default).toBe(false);

      const failedLoginAttemptsColumn = columns.find(c => c.propertyName === 'failed_login_attempts');
      expect(failedLoginAttemptsColumn?.options.default).toBe(0);

      const timezoneColumn = columns.find(c => c.propertyName === 'timezone');
      expect(timezoneColumn?.options.default).toBe('UTC');

      const languageColumn = columns.find(c => c.propertyName === 'language');
      expect(languageColumn?.options.default).toBe('en');

      const themeColumn = columns.find(c => c.propertyName === 'theme');
      expect(themeColumn?.options.default).toBe('light');

      const isActiveColumn = columns.find(c => c.propertyName === 'is_active');
      expect(isActiveColumn?.options.default).toBe(true);
    });
  });

  describe('UserOAuthProvider Entity', () => {
    it('should have correct column metadata', () => {
      const metadata = getMetadataArgsStorage();
      const columns = metadata.columns.filter(c => c.target === UserOAuthProvider);

      const connectionTypeColumn = columns.find(c => c.propertyName === 'connection_type');
      expect(connectionTypeColumn?.options.length).toBe(50);

      const providerColumn = columns.find(c => c.propertyName === 'provider');
      expect(providerColumn?.options.length).toBe(255);

      const providerIdColumn = columns.find(c => c.propertyName === 'provider_id');
      expect(providerIdColumn?.options.length).toBe(255);
    });
  });

  describe('UserToken Entity', () => {
    it('should have correct column metadata', () => {
      const metadata = getMetadataArgsStorage();
      const columns = metadata.columns.filter(c => c.target === UserToken);

      const tokenTypeColumn = columns.find(c => c.propertyName === 'token_type');
      expect(tokenTypeColumn?.options.length).toBe(50);

      const tokenValueColumn = columns.find(c => c.propertyName === 'token_value');
      expect(tokenValueColumn?.options.unique).toBe(true);

      const isRevokedColumn = columns.find(c => c.propertyName === 'is_revoked');
      expect(isRevokedColumn?.options.default).toBe(false);
    });
  });

  describe('UserActivityLogs Entity', () => {
    it('should have correct column metadata', () => {
      const metadata = getMetadataArgsStorage();
      const columns = metadata.columns.filter(c => c.target === UserActivityLogs);

      const actionColumn = columns.find(c => c.propertyName === 'action');
      expect(actionColumn?.options.length).toBe(100);
    });
  });

  describe('UserServiceSubscriptions Entity', () => {
    it('should have correct table and column metadata', () => {
      const metadata = getMetadataArgsStorage();
      const table = metadata.tables.find(t => t.target === UserServiceSubscriptions);
      expect(table?.name).toBe('user_service_subscriptions');

      const uniques = metadata.uniques.filter(u => u.target === UserServiceSubscriptions);
      expect(uniques.length).toBeGreaterThan(0);
      expect(uniques[0].columns).toEqual(['user_id', 'service']);

      const columns = metadata.columns.filter(c => c.target === UserServiceSubscriptions);

      const serviceColumn = columns.find(c => c.propertyName === 'service');
      expect(serviceColumn?.options.length).toBe(50);

      const subscribedColumn = columns.find(c => c.propertyName === 'subscribed');
      expect(subscribedColumn?.options.default).toBe(false);

      const stateDataColumn = columns.find(c => c.propertyName === 'state_data');
      expect(stateDataColumn?.options.default).toEqual({});
    });
  });

  describe('ExternalWebhooks Entity', () => {
    it('should have correct column metadata', () => {
      const metadata = getMetadataArgsStorage();
      const columns = metadata.columns.filter(c => c.target === ExternalWebhooks);

      const serviceColumn = columns.find(c => c.propertyName === 'service');
      expect(serviceColumn?.options.length).toBe(100);

      const urlColumn = columns.find(c => c.propertyName === 'url');
      expect(urlColumn?.options.length).toBe(500);

      const isActiveColumn = columns.find(c => c.propertyName === 'is_active');
      expect(isActiveColumn?.options.default).toBe(true);
    });
  });

  describe('WebhookConfigs Entity', () => {
    it('should have correct column metadata', () => {
      const metadata = getMetadataArgsStorage();
      const columns = metadata.columns.filter(c => c.target === WebhookConfigs);

      const nameColumn = columns.find(c => c.propertyName === 'name');
      expect(nameColumn?.options.length).toBe(100);

      const isActiveColumn = columns.find(c => c.propertyName === 'is_active');
      expect(isActiveColumn?.options.default).toBe(true);
    });
  });

  describe('WebhookEvents Entity', () => {
    it('should have correct column metadata', () => {
      const metadata = getMetadataArgsStorage();
      const columns = metadata.columns.filter(c => c.target === WebhookEvents);

      const actionTypeColumn = columns.find(c => c.propertyName === 'action_type');
      expect(actionTypeColumn?.options.length).toBe(100);

      const payloadColumn = columns.find(c => c.propertyName === 'payload');
      expect(payloadColumn?.options.type).toBe('jsonb');

      const processedPayloadColumn = columns.find(c => c.propertyName === 'processed_payload');
      expect(processedPayloadColumn?.options.nullable).toBe(true);

      const statusColumn = columns.find(c => c.propertyName === 'status');
      expect(statusColumn?.options.default).toBe('received');

      const signatureVerifiedColumn = columns.find(c => c.propertyName === 'signature_verified');
      expect(signatureVerifiedColumn?.options.default).toBe(false);
    });
  });

  describe('WebhookFailures Entity', () => {
    it('should have correct column metadata', () => {
      const metadata = getMetadataArgsStorage();
      const columns = metadata.columns.filter(c => c.target === WebhookFailures);

      const errorMessageColumn = columns.find(c => c.propertyName === 'error_message');
      expect(errorMessageColumn?.options.type).toBe('text');
    });
  });

  describe('WebhookReactions Entity', () => {
    it('should have correct column metadata', () => {
      const metadata = getMetadataArgsStorage();
      const columns = metadata.columns.filter(c => c.target === WebhookReactions);

      const reactionNameColumn = columns.find(c => c.propertyName === 'reaction_name');
      expect(reactionNameColumn?.options.length).toBe(100);

      const statusColumn = columns.find(c => c.propertyName === 'status');
      expect(statusColumn?.options.default).toBe('pending');
    });
  });

  describe('WebhookStats Entity', () => {
    it('should have correct column metadata', () => {
      const metadata = getMetadataArgsStorage();
      const columns = metadata.columns.filter(c => c.target === WebhookStats);

      const actionTypeColumn = columns.find(c => c.propertyName === 'action_type');
      expect(actionTypeColumn?.options.length).toBe(100);

      const reactionNameColumn = columns.find(c => c.propertyName === 'reaction_name');
      expect(reactionNameColumn?.options.length).toBe(100);

      const countColumn = columns.find(c => c.propertyName === 'count');
      expect(countColumn?.options.default).toBe(0);

      const totalProcessingTimeMsColumn = columns.find(c => c.propertyName === 'total_processing_time_ms');
      expect(totalProcessingTimeMsColumn?.options.default).toBe(0);

      const successCountColumn = columns.find(c => c.propertyName === 'success_count');
      expect(successCountColumn?.options.default).toBe(0);

      const errorCountColumn = columns.find(c => c.propertyName === 'error_count');
      expect(errorCountColumn?.options.default).toBe(0);
    });
  });

  describe('Session Entity', () => {
    it('should have correct column metadata', () => {
      const metadata = getMetadataArgsStorage();
      const columns = metadata.columns.filter(c => c.target === Session);

      const idColumn = columns.find(c => c.propertyName === 'id');
      expect(idColumn?.options.length).toBe(255);

      const jsonColumn = columns.find(c => c.propertyName === 'json');
      expect(jsonColumn?.options.type).toBe('text');

      const destroyedAtColumn = columns.find(c => c.propertyName === 'destroyedAt');
      expect(destroyedAtColumn?.options.nullable).toBe(true);
    });
  });

  describe('Logger Entity', () => {
    it('should have correct column metadata', () => {
      const metadata = getMetadataArgsStorage();
      const columns = metadata.columns.filter(c => c.target === Logger);

      const typeColumn = columns.find(c => c.propertyName === 'type');
      expect(typeColumn?.options.enum).toEqual(['info', 'succ', 'warn', 'err']);

      const kindColumn = columns.find(c => c.propertyName === 'kind');
      expect(kindColumn?.options.length).toBe(50);

      const messageColumn = columns.find(c => c.propertyName === 'message');
      expect(messageColumn?.options.nullable).toBe(true);
    });
  });
});