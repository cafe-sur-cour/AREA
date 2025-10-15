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
        case 'google.create_calendar_event':
          return await this.createCalendarEvent(reaction.config, validToken);
        case 'google.create_document':
          return await this.createDocument(reaction.config, validToken);
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
}

export const googleReactionExecutor = new GoogleReactionExecutor();
