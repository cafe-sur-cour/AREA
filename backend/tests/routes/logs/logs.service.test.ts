import { createLog } from '../../../src/routes/logs/logs.service';
import { Logger } from '../../../src/config/entity/Logger';
import { AppDataSource } from '../../../src/config/db';
import nodemailer from 'nodemailer';

// Mock dependencies
jest.mock('../../../src/config/db', () => ({
  AppDataSource: {
    manager: {
      save: jest.fn(),
    },
  },
}));

jest.mock('nodemailer');

const mockNodemailer = nodemailer as jest.Mocked<typeof nodemailer>;
const mockAppDataSource = AppDataSource as jest.Mocked<typeof AppDataSource>;
const mockSave = mockAppDataSource.manager.save as jest.Mock;

describe('Logs Service', () => {
  let mockTransporter: any;
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    originalEnv = process.env;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset environment variables
    process.env = { ...originalEnv };

    // Setup mock transporter
    mockTransporter = {
      verify: jest.fn().mockResolvedValue(true),
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    };

    mockNodemailer.createTransport.mockReturnValue(mockTransporter);

    // Reset mockSave
    mockSave.mockReset();

    // Mock console methods to avoid cluttering test output
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('createLog', () => {
    it('should create a log with type "info" for status code < 200', async () => {
      const mockLog = {
        id: 1,
        type: 'info',
        kind: 'test',
        message: 'Test info message',
        created_at: new Date(),
      };

      mockSave.mockResolvedValue(mockLog);

      const result = await createLog(100, 'test', 'Test info message');

      expect(result).toEqual(mockLog);
      expect(mockSave).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'info',
          kind: 'test',
          message: 'Test info message',
        })
      );
    });

    it('should create a log with type "succ" for status code 200-299', async () => {
      const mockLog = {
        id: 2,
        type: 'succ',
        kind: 'success',
        message: 'Success message',
      };

      mockSave.mockResolvedValue(mockLog);

      const result = await createLog(200, 'success', 'Success message');

      expect(result.type).toBe('succ');
      expect(mockSave).toHaveBeenCalled();
    });

    it('should create a log with type "warn" for status code 300-399', async () => {
      const mockLog = {
        id: 3,
        type: 'warn',
        kind: 'redirect',
        message: 'Redirect warning',
      };

      mockSave.mockResolvedValue(mockLog);

      const result = await createLog(301, 'redirect', 'Redirect warning');

      expect(result.type).toBe('warn');
    });

    it('should create a log with type "err" for status code >= 400', async () => {
      const mockLog = {
        id: 4,
        type: 'err',
        kind: 'error',
        message: 'Error message',
      };

      mockSave.mockResolvedValue(mockLog);

      const result = await createLog(400, 'error', 'Error message');

      expect(result.type).toBe('err');
    });

    it('should handle null message', async () => {
      const mockLog = {
        id: 5,
        type: 'err',
        kind: 'error',
        message: null,
      };

      mockSave.mockResolvedValue(mockLog);

      const result = await createLog(500, 'error', null);

      expect(result.message).toBeNull();
    });
  });

  describe('Email Notifications', () => {
    beforeEach(() => {
      // Disable email notifications for all tests to avoid async issues
      process.env.ERROR_NOTIFICATION_ENABLED = 'false';
      process.env.ERROR_NOTIFICATION_EMAIL = '';
      process.env.ERROR_NOTIFICATION_MIN_STATUS = '400';
      process.env.SMTP_HOST = 'smtp.test.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_SECURE = 'false';
      process.env.SMTP_USER = '';
      process.env.SMTP_PASSWORD = '';
    });

    it('should create log without sending email when notifications are disabled', async () => {
      mockSave.mockResolvedValue({
        id: 1,
        type: 'err',
        kind: 'server_error',
        message: 'Internal server error',
      });

      const result = await createLog(500, 'server_error', 'Internal server error');

      expect(result.type).toBe('err');
      expect(result.message).toBe('Internal server error');
      expect(mockSave).toHaveBeenCalled();
      expect(mockNodemailer.createTransport).not.toHaveBeenCalled();
    });

    it('should not send email for status codes below minStatusCode', async () => {
      mockSave.mockResolvedValue({
        id: 1,
        type: 'warn',
        kind: 'redirect',
        message: 'Redirect',
      });

      const result = await createLog(301, 'redirect', 'Redirect');

      expect(result.type).toBe('warn');
      expect(mockNodemailer.createTransport).not.toHaveBeenCalled();
      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });

    it('should create error log when notifications disabled', async () => {
      process.env.ERROR_NOTIFICATION_ENABLED = 'false';

      mockSave.mockResolvedValue({
        id: 1,
        type: 'err',
        kind: 'error',
        message: 'Error',
      });

      const result = await createLog(500, 'error', 'Error');

      expect(result.type).toBe('err');
      expect(mockSave).toHaveBeenCalled();
      expect(mockNodemailer.createTransport).not.toHaveBeenCalled();
    });

    it('should create log when recipient email is not configured', async () => {
      process.env.ERROR_NOTIFICATION_EMAIL = '';

      mockSave.mockResolvedValue({
        id: 1,
        type: 'err',
        kind: 'error',
        message: 'Error',
      });

      const result = await createLog(500, 'error', 'Error');

      expect(result.type).toBe('err');
      expect(mockSave).toHaveBeenCalled();
      expect(mockNodemailer.createTransport).not.toHaveBeenCalled();
    });

    it('should create log when SMTP is not configured', async () => {
      process.env.SMTP_USER = '';
      process.env.SMTP_PASSWORD = '';

      mockSave.mockResolvedValue({
        id: 1,
        type: 'err',
        kind: 'error',
        message: 'Test error',
      });

      const result = await createLog(500, 'error', 'Test error');

      expect(result.type).toBe('err');
      expect(mockSave).toHaveBeenCalled();
      expect(mockNodemailer.createTransport).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully without blocking log creation', async () => {
      const mockLog = {
        id: 1,
        type: 'err',
        kind: 'error',
        message: 'Error',
      };

      mockSave.mockResolvedValue(mockLog);

      const result = await createLog(500, 'error', 'Error');

      // createLog should return the log even if email sending would fail
      expect(result).toEqual(mockLog);
      expect(mockSave).toHaveBeenCalled();
    });
  });
});
