import { googleReactions } from '../../../src/services/services/google/reactions';

describe('Google Reactions', () => {
  describe('send_email reaction', () => {
    const sendEmail = googleReactions.find(r => r.id === 'google.send_email');

    it('should exist', () => {
      expect(sendEmail).toBeDefined();
    });

    it('should have correct id', () => {
      expect(sendEmail?.id).toBe('google.send_email');
    });

    it('should have correct name', () => {
      expect(sendEmail?.name).toBe('Send Email');
    });

    it('should have correct description', () => {
      expect(sendEmail?.description).toBe('Sends an email via Gmail');
    });

    it('should have configSchema with correct name', () => {
      expect(sendEmail?.configSchema.name).toBe('Send Email');
    });

    it('should have configSchema with 3 fields', () => {
      expect(sendEmail?.configSchema.fields).toHaveLength(3);
    });

    it('should have to, subject, and body fields', () => {
      const fields = sendEmail?.configSchema.fields;
      expect(fields?.[0]?.name).toBe('to');
      expect(fields?.[1]?.name).toBe('subject');
      expect(fields?.[2]?.name).toBe('body');
    });

    it('should have valid outputSchema', () => {
      expect(sendEmail?.outputSchema.type).toBe('object');
      expect(sendEmail?.outputSchema.properties).toBeDefined();
      expect(sendEmail?.outputSchema.required).toContain('message_id');
      expect(sendEmail?.outputSchema.required).toContain('to');
      expect(sendEmail?.outputSchema.required).toContain('subject');
      expect(sendEmail?.outputSchema.required).toContain('success');
    });

    it('should have metadata with correct category', () => {
      expect(sendEmail?.metadata.category).toBe('Gmail');
      expect(sendEmail?.metadata.requiresAuth).toBe(true);
      expect(sendEmail?.metadata.estimatedDuration).toBe(2000);
      expect(sendEmail?.metadata.tags).toEqual([
        'email',
        'send',
        'communication',
      ]);
    });
  });

  describe('create_calendar_event reaction', () => {
    const createCalendarEvent = googleReactions.find(
      r => r.id === 'google.create_calendar_event'
    );

    it('should exist', () => {
      expect(createCalendarEvent).toBeDefined();
    });

    it('should have correct id', () => {
      expect(createCalendarEvent?.id).toBe('google.create_calendar_event');
    });

    it('should have correct name', () => {
      expect(createCalendarEvent?.name).toBe('Create Calendar Event');
    });

    it('should have correct description', () => {
      expect(createCalendarEvent?.description).toBe(
        'Creates a new event in Google Calendar'
      );
    });

    it('should have configSchema with correct name', () => {
      expect(createCalendarEvent?.configSchema.name).toBe(
        'Create Calendar Event'
      );
    });

    it('should have configSchema with 5 fields', () => {
      expect(createCalendarEvent?.configSchema.fields).toHaveLength(5);
    });

    it('should have summary, description, start_datetime, end_datetime, and attendees fields', () => {
      const fields = createCalendarEvent?.configSchema.fields;
      expect(fields?.[0]?.name).toBe('summary');
      expect(fields?.[1]?.name).toBe('description');
      expect(fields?.[2]?.name).toBe('start_datetime');
      expect(fields?.[3]?.name).toBe('end_datetime');
      expect(fields?.[4]?.name).toBe('attendees');
    });

    it('should have valid outputSchema', () => {
      expect(createCalendarEvent?.outputSchema.type).toBe('object');
      expect(createCalendarEvent?.outputSchema.properties).toBeDefined();
      expect(createCalendarEvent?.outputSchema.required).toContain('event_id');
      expect(createCalendarEvent?.outputSchema.required).toContain('summary');
      expect(createCalendarEvent?.outputSchema.required).toContain(
        'start_datetime'
      );
      expect(createCalendarEvent?.outputSchema.required).toContain(
        'end_datetime'
      );
      expect(createCalendarEvent?.outputSchema.required).toContain('success');
    });

    it('should have metadata with correct category', () => {
      expect(createCalendarEvent?.metadata.category).toBe('Calendar');
      expect(createCalendarEvent?.metadata.requiresAuth).toBe(true);
      expect(createCalendarEvent?.metadata.estimatedDuration).toBe(3000);
      expect(createCalendarEvent?.metadata.tags).toEqual([
        'calendar',
        'event',
        'schedule',
      ]);
    });
  });

  describe('create_document reaction', () => {
    const createDocument = googleReactions.find(
      r => r.id === 'google.create_document'
    );

    it('should exist', () => {
      expect(createDocument).toBeDefined();
    });

    it('should have correct id', () => {
      expect(createDocument?.id).toBe('google.create_document');
    });

    it('should have correct name', () => {
      expect(createDocument?.name).toBe('Create Document');
    });

    it('should have correct description', () => {
      expect(createDocument?.description).toBe(
        'Creates a new document in Google Docs'
      );
    });

    it('should have configSchema with correct name', () => {
      expect(createDocument?.configSchema.name).toBe('Create Google Doc');
    });

    it('should have configSchema with 2 fields', () => {
      expect(createDocument?.configSchema.fields).toHaveLength(2);
    });

    it('should have title and content fields', () => {
      const fields = createDocument?.configSchema.fields;
      expect(fields?.[0]?.name).toBe('title');
      expect(fields?.[1]?.name).toBe('content');
    });

    it('should have valid outputSchema', () => {
      expect(createDocument?.outputSchema.type).toBe('object');
      expect(createDocument?.outputSchema.properties).toBeDefined();
      expect(createDocument?.outputSchema.required).toContain('document_id');
      expect(createDocument?.outputSchema.required).toContain('title');
      expect(createDocument?.outputSchema.required).toContain('content');
      expect(createDocument?.outputSchema.required).toContain('success');
    });

    it('should have metadata with correct category', () => {
      expect(createDocument?.metadata.category).toBe('Docs');
      expect(createDocument?.metadata.requiresAuth).toBe(true);
      expect(createDocument?.metadata.estimatedDuration).toBe(2500);
      expect(createDocument?.metadata.tags).toEqual([
        'document',
        'create',
        'productivity',
      ]);
    });
  });

  describe('All reactions', () => {
    it('should have exactly 3 reactions', () => {
      expect(googleReactions).toHaveLength(3);
    });

    it('should all require authentication', () => {
      googleReactions.forEach(reaction => {
        expect(reaction.metadata.requiresAuth).toBe(true);
      });
    });

    it('should all have valid outputSchemas', () => {
      googleReactions.forEach(reaction => {
        expect(reaction.outputSchema).toBeDefined();
        expect(reaction.outputSchema.type).toBe('object');
        expect(reaction.outputSchema.properties).toBeDefined();
        expect(reaction.outputSchema.required).toBeDefined();
      });
    });

    it('should all have unique ids', () => {
      const ids = googleReactions.map(r => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should all have estimated durations', () => {
      googleReactions.forEach(reaction => {
        expect(reaction.metadata.estimatedDuration).toBeDefined();
        expect(typeof reaction.metadata.estimatedDuration).toBe('number');
        expect(reaction.metadata.estimatedDuration).toBeGreaterThan(0);
      });
    });
  });
});
