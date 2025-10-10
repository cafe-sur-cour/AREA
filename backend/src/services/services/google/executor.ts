import type {
  ReactionExecutor,
  ReactionExecutionContext,
  ReactionExecutionResult,
} from '../../../types/service';

interface GoogleCalendarEvent {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{ email: string }>;
}

interface GoogleDriveFile {
  name: string;
  mimeType: string;
  parents?: string[];
}

export class GoogleReactionExecutor implements ReactionExecutor {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl =
      process.env.SERVICE_GOOGLE_API_BASE_URL || 'https://www.googleapis.com';
  }

  async execute(
    context: ReactionExecutionContext
  ): Promise<ReactionExecutionResult> {
    const { reaction, serviceConfig } = context;

    try {
      const accessToken = serviceConfig.credentials?.access_token;
      if (!accessToken) {
        return {
          success: false,
          error: 'Google access token not configured',
        };
      }

      const validToken = accessToken;

      switch (reaction.type) {
        case 'google.send_email':
          return await this.sendEmail(reaction.config, validToken);
        case 'google.add_label_to_email':
          return await this.addLabelToEmail(reaction.config, validToken);
        case 'google.create_calendar_event':
          return await this.createCalendarEvent(reaction.config, validToken);
        case 'google.delete_next_calendar_event':
          return await this.deleteNextCalendarEvent(validToken);
        case 'google.create_document':
          return await this.createDocument(reaction.config, validToken);
        case 'google.upload_file_to_drive':
          return await this.uploadFileToDrive(reaction.config, validToken);
        case 'google.share_file':
          return await this.shareFile(reaction.config, validToken);
        default:
          return {
            success: false,
            error: `Unknown reaction type: ${reaction.type}`,
          };
      }
    } catch (error) {
      console.error('Google reaction execution error:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  private async sendEmail(
    config: Record<string, unknown>,
    accessToken: string
  ): Promise<ReactionExecutionResult> {
    const { to, subject, body } = config as {
      to: string;
      subject: string;
      body: string;
    };

    if (!to || !subject || !body) {
      return {
        success: false,
        error: 'Missing required fields: to, subject, body',
      };
    }

    try {
      const email = [
        `To: ${to}`,
        `Subject: ${subject}`,
        'Content-Type: text/plain; charset=utf-8',
        '',
        body,
      ].join('\n');

      const encodedEmail = Buffer.from(email)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await fetch(
        `${this.apiBaseUrl}/gmail/v1/users/me/messages/send`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            raw: encodedEmail,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `Gmail API error: ${response.status} - ${(errorData as any).error?.message || 'Unknown error'}`,
        };
      }

      const result = await response.json();
      return {
        success: true,
        output: {
          message_id: (result as any).id,
          to,
          subject,
          success: true,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Network error while sending email: ${(error as Error).message}`,
      };
    }
  }

  private async addLabelToEmail(
    config: Record<string, unknown>,
    accessToken: string
  ): Promise<ReactionExecutionResult> {
    const { label_name } = config as { label_name: string };

    if (!label_name) {
      return {
        success: false,
        error: 'Missing required field: label_name',
      };
    }

    try {
      const labelsResponse = await fetch(
        `${this.apiBaseUrl}/gmail/v1/users/me/labels`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!labelsResponse.ok) {
        return {
          success: false,
          error: 'Failed to fetch labels',
        };
      }

      const labelsData = (await labelsResponse.json()) as any;
      const label = labelsData.labels?.find(
        (l: any) => l.name.toLowerCase() === label_name.toLowerCase()
      );

      if (!label) {
        return {
          success: false,
          error: `Label "${label_name}" not found`,
        };
      }

      const messagesResponse = await fetch(
        `${this.apiBaseUrl}/gmail/v1/users/me/messages?maxResults=1`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!messagesResponse.ok) {
        return {
          success: false,
          error: 'Failed to fetch messages',
        };
      }

      const messagesData = (await messagesResponse.json()) as any;
      const messageId = messagesData.messages?.[0]?.id;

      if (!messageId) {
        return {
          success: false,
          error: 'No messages found',
        };
      }

      const modifyResponse = await fetch(
        `${this.apiBaseUrl}/gmail/v1/users/me/messages/${messageId}/modify`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            addLabelIds: [label.id],
          }),
        }
      );

      if (!modifyResponse.ok) {
        const errorData = await modifyResponse.json().catch(() => ({}));
        return {
          success: false,
          error: `Gmail API error: ${modifyResponse.status} - ${(errorData as any).error?.message || 'Unknown error'}`,
        };
      }

      return {
        success: true,
        output: {
          message_id: messageId,
          label_name,
          label_id: label.id,
          success: true,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Network error while adding label: ${(error as Error).message}`,
      };
    }
  }

  private async createCalendarEvent(
    config: Record<string, unknown>,
    accessToken: string
  ): Promise<ReactionExecutionResult> {
    const { summary, description, start_datetime, end_datetime, attendees } =
      config as {
        summary: string;
        description?: string;
        start_datetime: string;
        end_datetime: string;
        attendees?: string;
      };

    if (!summary || !start_datetime || !end_datetime) {
      return {
        success: false,
        error: 'Missing required fields: summary, start_datetime, end_datetime',
      };
    }

    try {
      const event: GoogleCalendarEvent = {
        summary,
        start: {
          dateTime: start_datetime,
          timeZone: 'UTC',
        },
        end: {
          dateTime: end_datetime,
          timeZone: 'UTC',
        },
      };

      if (description) {
        event.description = description;
      }

      if (attendees) {
        event.attendees = attendees
          .split(',')
          .map((email) => ({ email: email.trim() }));
      }

      const response = await fetch(
        `${this.apiBaseUrl}/calendar/v3/calendars/primary/events`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `Calendar API error: ${response.status} - ${(errorData as any).error?.message || 'Unknown error'}`,
        };
      }

      const result = (await response.json()) as any;
      return {
        success: true,
        output: {
          event_id: result.id,
          event_link: result.htmlLink,
          summary,
          success: true,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Network error while creating event: ${(error as Error).message}`,
      };
    }
  }

  private async deleteNextCalendarEvent(
    accessToken: string
  ): Promise<ReactionExecutionResult> {
    try {
      const now = new Date().toISOString();
      const response = await fetch(
        `${this.apiBaseUrl}/calendar/v3/calendars/primary/events?timeMin=${now}&maxResults=1&orderBy=startTime&singleEvents=true`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `Calendar API error: ${response.status} - ${(errorData as any).error?.message || 'Unknown error'}`,
        };
      }

      const data = (await response.json()) as any;
      const event = data.items?.[0];

      if (!event) {
        return {
          success: false,
          error: 'No upcoming events found',
        };
      }

      const deleteResponse = await fetch(
        `${this.apiBaseUrl}/calendar/v3/calendars/primary/events/${event.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!deleteResponse.ok && deleteResponse.status !== 204) {
        const errorData = await deleteResponse.json().catch(() => ({}));
        return {
          success: false,
          error: `Calendar API error: ${deleteResponse.status} - ${(errorData as any).error?.message || 'Unknown error'}`,
        };
      }

      return {
        success: true,
        output: {
          deleted_event_id: event.id,
          deleted_event_summary: event.summary,
          success: true,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Network error while deleting event: ${(error as Error).message}`,
      };
    }
  }

  private async createDocument(
    config: Record<string, unknown>,
    accessToken: string
  ): Promise<ReactionExecutionResult> {
    const { title, content } = config as {
      title: string;
      content?: string;
    };

    if (!title) {
      return {
        success: false,
        error: 'Missing required field: title',
      };
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/drive/v3/files`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: title,
          mimeType: 'application/vnd.google-apps.document',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `Drive API error: ${response.status} - ${(errorData as any).error?.message || 'Unknown error'}`,
        };
      }

      const result = (await response.json()) as any;

      if (content) {
        const insertResponse = await fetch(
          `${this.apiBaseUrl}/docs/v1/documents/${result.id}:batchUpdate`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              requests: [
                {
                  insertText: {
                    location: {
                      index: 1,
                    },
                    text: content,
                  },
                },
              ],
            }),
          }
        );

        if (!insertResponse.ok) {
          console.error('Failed to insert content, but document was created');
        }
      }

      return {
        success: true,
        output: {
          document_id: result.id,
          document_url: `https://docs.google.com/document/d/${result.id}/edit`,
          title,
          success: true,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Network error while creating document: ${(error as Error).message}`,
      };
    }
  }

  private async uploadFileToDrive(
    config: Record<string, unknown>,
    accessToken: string
  ): Promise<ReactionExecutionResult> {
    const { file_name, file_content, mime_type, folder_id } = config as {
      file_name: string;
      file_content: string;
      mime_type?: string;
      folder_id?: string;
    };

    if (!file_name || !file_content) {
      return {
        success: false,
        error: 'Missing required fields: file_name, file_content',
      };
    }

    try {
      const metadata: GoogleDriveFile = {
        name: file_name,
        mimeType: mime_type || 'text/plain',
      };

      if (folder_id) {
        metadata.parents = [folder_id];
      }

      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${metadata.mimeType}\r\n\r\n` +
        file_content +
        closeDelimiter;

      const response = await fetch(
        `${this.apiBaseUrl}/upload/drive/v3/files?uploadType=multipart`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `Drive API error: ${response.status} - ${(errorData as any).error?.message || 'Unknown error'}`,
        };
      }

      const result = (await response.json()) as any;
      return {
        success: true,
        output: {
          file_id: result.id,
          file_name: result.name,
          file_url: `https://drive.google.com/file/d/${result.id}/view`,
          success: true,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Network error while uploading file: ${(error as Error).message}`,
      };
    }
  }

  private async shareFile(
    config: Record<string, unknown>,
    accessToken: string
  ): Promise<ReactionExecutionResult> {
    const { file_id, email, role } = config as {
      file_id: string;
      email: string;
      role?: string;
    };

    if (!file_id || !email) {
      return {
        success: false,
        error: 'Missing required fields: file_id, email',
      };
    }

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/drive/v3/files/${file_id}/permissions`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'user',
            role: role || 'reader',
            emailAddress: email,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `Drive API error: ${response.status} - ${(errorData as any).error?.message || 'Unknown error'}`,
        };
      }

      const result = (await response.json()) as any;
      return {
        success: true,
        output: {
          permission_id: result.id,
          file_id,
          email,
          role: role || 'reader',
          success: true,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Network error while sharing file: ${(error as Error).message}`,
      };
    }
  }
}

export const googleReactionExecutor = new GoogleReactionExecutor();
