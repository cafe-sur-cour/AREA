// Mock node-fetch before importing executor.ts to avoid ESM issues
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
jest.mock('node-fetch', () => mockFetch);
global.fetch = mockFetch;

import { GoogleReactionExecutor } from '../../../src/services/services/google/executor';
import type { ReactionExecutionContext } from '../../../src/types/service';

describe('GoogleReactionExecutor', () => {
  let executor: GoogleReactionExecutor;

  beforeEach(() => {
    jest.clearAllMocks();
    executor = new GoogleReactionExecutor();
  });

  // Helper function to create mock Response
  const createMockResponse = (options: {
    ok: boolean;
    status?: number;
    json?: any;
    text?: string;
  }): Response =>
    ({
      ok: options.ok,
      status: options.status || 200,
      statusText: options.ok ? 'OK' : 'Error',
      json: options.json
        ? jest.fn().mockResolvedValue(options.json)
        : jest.fn(),
      text: options.text
        ? jest.fn().mockResolvedValue(options.text)
        : jest.fn(),
      headers: new Headers(),
      redirected: false,
      type: 'basic',
      url: '',
      clone: jest.fn(),
      arrayBuffer: jest.fn(),
      blob: jest.fn(),
      formData: jest.fn(),
      body: null,
      bodyUsed: false,
      bytes: jest.fn(),
    }) as unknown as Response;

  describe('execute', () => {
    it('should return error when access token is missing', async () => {
      const context: ReactionExecutionContext = {
        reaction: {
          type: 'google.send_email',
          config: {},
        },
        serviceConfig: {
          credentials: {},
        },
        event: {
          id: 1,
          action_type: 'test',
          user_id: 1,
          payload: {},
          created_at: new Date(),
        },
        mapping: {
          id: 1,
          name: 'test',
          created_by: 1,
        },
      };

      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Google access token not configured');
    });

    it('should handle unknown reaction type', async () => {
      const context: ReactionExecutionContext = {
        reaction: {
          type: 'google.unknown_reaction',
          config: {},
        },
        serviceConfig: {
          credentials: { access_token: 'test-token' },
        },
        event: {
          id: 1,
          action_type: 'test',
          user_id: 1,
          payload: {},
          created_at: new Date(),
        },
        mapping: {
          id: 1,
          name: 'test',
          created_by: 1,
        },
      };

      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Unknown reaction type: google.unknown_reaction'
      );
    });

    it('should handle execution errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const context: ReactionExecutionContext = {
        reaction: {
          type: 'google.send_email',
          config: {
            to: 'test@example.com',
            subject: 'Test',
            body: 'Test body',
          },
        },
        serviceConfig: {
          credentials: { access_token: 'test-token' },
        },
        event: {
          id: 1,
          action_type: 'test',
          user_id: 1,
          payload: {},
          created_at: new Date(),
        },
        mapping: {
          id: 1,
          name: 'test',
          created_by: 1,
        },
      };

      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('sendEmail', () => {
    it('should successfully send email', async () => {
      const mockResponse = {
        id: 'message-id-123',
        threadId: 'thread-id-123',
      };

      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: true,
          json: mockResponse,
        })
      );

      const config = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
      };

      const result = await (executor as any).sendEmail(config, 'test-token');

      expect(result.success).toBe(true);
      expect(result.output).toEqual({
        message_id: 'message-id-123',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        success: true,
      });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.googleapis.com/gmail/v1/users/me/messages/send',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
          },
          body: expect.any(String),
        })
      );
    });

    it('should return error when required fields are missing', async () => {
      const config = { to: 'test@example.com' }; // missing subject and body

      const result = await (executor as any).sendEmail(config, 'test-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing required fields: to, subject, body');
    });

    it('should handle Gmail API error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: false,
          status: 400,
          json: { error: { message: 'Invalid request' } },
        })
      );

      const config = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
      };

      const result = await (executor as any).sendEmail(config, 'test-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Gmail API error: 400 - Invalid request');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection failed'));

      const config = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
      };

      const result = await (executor as any).sendEmail(config, 'test-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Network error while sending email: Connection failed'
      );
    });
  });

  describe('createCalendarEvent', () => {
    it('should successfully create calendar event', async () => {
      const mockResponse = {
        id: 'event-id-123',
        htmlLink: 'https://calendar.google.com/event-link',
        summary: 'Test Event',
        start: { dateTime: '2024-01-01T10:00:00Z' },
        end: { dateTime: '2024-01-01T11:00:00Z' },
      };

      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: true,
          json: mockResponse,
        })
      );

      const config = {
        summary: 'Test Event',
        start_datetime: '2024-01-01T10:00:00Z',
        end_datetime: '2024-01-01T11:00:00Z',
        description: 'Test Description',
        attendees: 'user1@example.com,user2@example.com',
      };

      const result = await (executor as any).createCalendarEvent(
        config,
        'test-token'
      );

      expect(result.success).toBe(true);
      expect(result.output).toEqual({
        event_id: 'event-id-123',
        event_link: 'https://calendar.google.com/event-link',
        summary: 'Test Event',
        success: true,
      });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
          },
          body: expect.any(String),
        })
      );
    });

    it('should return error when required fields are missing', async () => {
      const config = { summary: 'Test Event' }; // missing start_datetime and end_datetime

      const result = await (executor as any).createCalendarEvent(
        config,
        'test-token'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Missing required fields: summary, start_datetime, end_datetime'
      );
    });

    it('should handle Calendar API error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: false,
          status: 403,
          json: { error: { message: 'Insufficient permissions' } },
        })
      );

      const config = {
        summary: 'Test Event',
        start_datetime: '2024-01-01T10:00:00Z',
        end_datetime: '2024-01-01T11:00:00Z',
      };

      const result = await (executor as any).createCalendarEvent(
        config,
        'test-token'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Calendar API error: 403 - Insufficient permissions'
      );
    });

    it('should create event without optional fields', async () => {
      const mockResponse = {
        id: 'event-id-123',
        htmlLink: 'https://calendar.google.com/event-link',
        summary: 'Test Event',
        start: { dateTime: '2024-01-01T10:00:00Z' },
        end: { dateTime: '2024-01-01T11:00:00Z' },
      };

      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: true,
          json: mockResponse,
        })
      );

      const config = {
        summary: 'Test Event',
        start_datetime: '2024-01-01T10:00:00Z',
        end_datetime: '2024-01-01T11:00:00Z',
      };

      const result = await (executor as any).createCalendarEvent(
        config,
        'test-token'
      );

      expect(result.success).toBe(true);
      expect(result.output).toEqual({
        event_id: 'event-id-123',
        event_link: 'https://calendar.google.com/event-link',
        summary: 'Test Event',
        success: true,
      });
    });

    it('should return error when required fields are missing', async () => {
      const config = { summary: 'Test Event' }; // missing start_datetime and end_datetime

      const result = await (executor as any).createCalendarEvent(
        config,
        'test-token'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Missing required fields: summary, start_datetime, end_datetime'
      );
    });

    it('should handle Calendar API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: jest.fn().mockResolvedValue({
          error: { message: 'Insufficient permissions' },
        }),
      });

      const config = {
        summary: 'Test Event',
        start_datetime: '2024-01-01T10:00:00Z',
        end_datetime: '2024-01-01T11:00:00Z',
      };

      const result = await (executor as any).createCalendarEvent(
        config,
        'test-token'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Calendar API error: 403 - Insufficient permissions'
      );
    });

    it('should create event without optional fields', async () => {
      const mockResponse = {
        id: 'event-id-123',
        htmlLink: 'https://calendar.google.com/event-link',
        summary: 'Test Event',
        start: { dateTime: '2024-01-01T10:00:00Z' },
        end: { dateTime: '2024-01-01T11:00:00Z' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const config = {
        summary: 'Test Event',
        start_datetime: '2024-01-01T10:00:00Z',
        end_datetime: '2024-01-01T11:00:00Z',
      };

      const result = await (executor as any).createCalendarEvent(
        config,
        'test-token'
      );

      expect(result.success).toBe(true);
      expect(result.output).toEqual({
        event_id: 'event-id-123',
        event_link: 'https://calendar.google.com/event-link',
        summary: 'Test Event',
        success: true,
      });
    });
  });

  describe('createDocument', () => {
    it('should successfully create document without content', async () => {
      const mockResponse = {
        id: 'document-id-123',
        name: 'Test Document',
        mimeType: 'application/vnd.google-apps.document',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const config = {
        title: 'Test Document',
      };

      const result = await (executor as any).createDocument(
        config,
        'test-token'
      );

      expect(result.success).toBe(true);
      expect(result.output).toEqual({
        document_id: 'document-id-123',
        document_url: 'https://docs.google.com/document/d/document-id-123/edit',
        title: 'Test Document',
        success: true,
      });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.googleapis.com/drive/v3/files',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'Test Document',
            mimeType: 'application/vnd.google-apps.document',
          }),
        })
      );
    });

    it('should successfully create document with content', async () => {
      const mockDriveResponse = {
        id: 'document-id-123',
        name: 'Test Document',
        mimeType: 'application/vnd.google-apps.document',
      };

      const mockDocsResponse = { replies: [] };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockDriveResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockDocsResponse),
        });

      const config = {
        title: 'Test Document',
        content: 'This is test content',
      };

      const result = await (executor as any).createDocument(
        config,
        'test-token'
      );

      expect(result.success).toBe(true);
      expect(result.output).toEqual({
        document_id: 'document-id-123',
        document_url: 'https://docs.google.com/document/d/document-id-123/edit',
        title: 'Test Document',
        success: true,
      });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should return error when title is missing', async () => {
      const config = {}; // missing title

      const result = await (executor as any).createDocument(
        config,
        'test-token'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing required field: title');
    });

    it('should handle Drive API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({
          error: { message: 'Invalid request' },
        }),
      });

      const config = {
        title: 'Test Document',
      };

      const result = await (executor as any).createDocument(
        config,
        'test-token'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Drive API error: 400 - Invalid request');
    });

    it('should handle Docs API error when inserting content', async () => {
      const mockDriveResponse = {
        id: 'document-id-123',
        name: 'Test Document',
        mimeType: 'application/vnd.google-apps.document',
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockDriveResponse),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          text: jest.fn().mockResolvedValue('Insufficient permissions'),
        });

      const config = {
        title: 'Test Document',
        content: 'This is test content',
      };

      const result = await (executor as any).createDocument(
        config,
        'test-token'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        'Document created but insufficient permissions to edit it'
      );
    });
  });

  describe('uploadFileToDrive', () => {
    it('should successfully upload file', async () => {
      const mockResponse = {
        id: 'file-id-123',
        name: 'test.txt',
        mimeType: 'text/plain',
        webViewLink: 'https://drive.google.com/file/d/file-id-123/view',
        webContentLink:
          'https://drive.google.com/uc?id=file-id-123&export=download',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const config = {
        fileName: 'test.txt',
        fileContent: 'Hello World',
        mimeType: 'text/plain',
        folderId: 'folder-id-123',
      };

      const result = await (executor as any).uploadFileToDrive(
        config,
        'test-token'
      );

      expect(result.success).toBe(true);
      expect(result.output).toEqual({
        file_id: 'file-id-123',
        file_name: 'test.txt',
        web_view_link: 'https://drive.google.com/file/d/file-id-123/view',
        web_content_link:
          'https://drive.google.com/uc?id=file-id-123&export=download',
        success: true,
      });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: 'Bearer test-token',
            'Content-Type': expect.stringContaining('multipart/related'),
          },
          body: expect.any(String),
        })
      );
    });

    it('should return error when required fields are missing', async () => {
      const config = { fileName: 'test.txt' }; // missing fileContent

      const result = await (executor as any).uploadFileToDrive(
        config,
        'test-token'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Missing required fields: fileName, fileContent'
      );
    });

    it('should handle Drive upload API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 413,
        json: jest.fn().mockResolvedValue({
          error: { message: 'File too large' },
        }),
      });

      const config = {
        fileName: 'test.txt',
        fileContent: 'Hello World',
      };

      const result = await (executor as any).uploadFileToDrive(
        config,
        'test-token'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Drive API error: 413 - File too large');
    });

    it('should upload file without folderId', async () => {
      const mockResponse = {
        id: 'file-id-123',
        name: 'test.txt',
        mimeType: 'text/plain',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const config = {
        fileName: 'test.txt',
        fileContent: 'Hello World',
      };

      const result = await (executor as any).uploadFileToDrive(
        config,
        'test-token'
      );

      expect(result.success).toBe(true);
      expect(result.output).toEqual({
        file_id: 'file-id-123',
        file_name: 'test.txt',
        web_view_link: 'https://drive.google.com/file/d/file-id-123/view',
        web_content_link: '',
        success: true,
      });
    });

    it('should handle base64 encoded content', async () => {
      const mockResponse = {
        id: 'file-id-123',
        name: 'test.png',
        mimeType: 'image/png',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const base64Content = Buffer.from('fake image data').toString('base64');
      const config = {
        fileName: 'test.png',
        fileContent: base64Content,
        mimeType: 'image/png',
      };

      const result = await (executor as any).uploadFileToDrive(
        config,
        'test-token'
      );

      expect(result.success).toBe(true);
      expect(result.output).toEqual({
        file_id: 'file-id-123',
        file_name: 'test.png',
        web_view_link: 'https://drive.google.com/file/d/file-id-123/view',
        web_content_link: '',
        success: true,
      });
    });
  });
});
