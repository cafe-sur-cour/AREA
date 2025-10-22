import {
  googleSendEmailSchema,
  googleCreateCalendarEventSchema,
  googleCreateDocumentSchema,
} from '../../../src/services/services/google/schemas';

describe('Google Schemas', () => {
  describe('googleSendEmailSchema', () => {
    it('should have correct name', () => {
      expect(googleSendEmailSchema.name).toBe('Send Email');
    });

    it('should have correct description', () => {
      expect(googleSendEmailSchema.description).toBe(
        'Sends an email via Gmail'
      );
    });

    it('should have three fields', () => {
      expect(googleSendEmailSchema.fields).toHaveLength(3);
    });

    it('should have to field with correct properties', () => {
      const toField = googleSendEmailSchema.fields[0];
      expect(toField?.name).toBe('to');
      expect(toField?.type).toBe('text');
      expect(toField?.label).toBe('Recipient Email Address');
      expect(toField?.required).toBe(true);
      expect(toField?.placeholder).toBe('recipient@example.com');
      expect(toField?.dynamic).toBe(true);
      expect(toField?.dynamicPlaceholder).toBe('{{action.payload.from}}');
    });

    it('should have subject field with correct properties', () => {
      const subjectField = googleSendEmailSchema.fields[1];
      expect(subjectField?.name).toBe('subject');
      expect(subjectField?.type).toBe('text');
      expect(subjectField?.label).toBe('Email Subject');
      expect(subjectField?.required).toBe(true);
      expect(subjectField?.placeholder).toBe('Subject of the email');
      expect(subjectField?.dynamic).toBe(true);
      expect(subjectField?.dynamicPlaceholder).toBe(
        'Re: {{action.payload.subject}}'
      );
    });

    it('should have body field with correct properties', () => {
      const bodyField = googleSendEmailSchema.fields[2];
      expect(bodyField?.name).toBe('body');
      expect(bodyField?.type).toBe('textarea');
      expect(bodyField?.label).toBe('Email Body');
      expect(bodyField?.required).toBe(true);
      expect(bodyField?.placeholder).toBe('Body of the email');
      expect(bodyField?.dynamic).toBe(true);
      expect(bodyField?.dynamicPlaceholder).toBe(
        'Response to: {{action.payload.snippet}}'
      );
    });
  });

  describe('googleCreateCalendarEventSchema', () => {
    it('should have correct name', () => {
      expect(googleCreateCalendarEventSchema.name).toBe(
        'Create Calendar Event'
      );
    });

    it('should have correct description', () => {
      expect(googleCreateCalendarEventSchema.description).toBe(
        'Creates a new event in Google Calendar'
      );
    });

    it('should have five fields', () => {
      expect(googleCreateCalendarEventSchema.fields).toHaveLength(5);
    });

    it('should have summary field with correct properties', () => {
      const summaryField = googleCreateCalendarEventSchema.fields[0];
      expect(summaryField?.name).toBe('summary');
      expect(summaryField?.type).toBe('text');
      expect(summaryField?.label).toBe('Event Title');
      expect(summaryField?.required).toBe(true);
      expect(summaryField?.placeholder).toBe('Meeting with team');
      expect(summaryField?.dynamic).toBe(true);
      expect(summaryField?.dynamicPlaceholder).toBe(
        'Follow-up: {{action.payload.summary}}'
      );
    });

    it('should have description field with correct properties', () => {
      const descriptionField = googleCreateCalendarEventSchema.fields[1];
      expect(descriptionField?.name).toBe('description');
      expect(descriptionField?.type).toBe('textarea');
      expect(descriptionField?.label).toBe('Event Description');
      expect(descriptionField?.required).toBe(false);
      expect(descriptionField?.placeholder).toBe('Discuss project progress');
      expect(descriptionField?.dynamic).toBe(true);
      expect(descriptionField?.dynamicPlaceholder).toBe(
        'Event details: {{action.payload.description}}'
      );
    });

    it('should have start_datetime field with correct properties', () => {
      const startField = googleCreateCalendarEventSchema.fields[2];
      expect(startField?.name).toBe('start_datetime');
      expect(startField?.type).toBe('text');
      expect(startField?.label).toBe('Start Date/Time (ISO 8601 format)');
      expect(startField?.required).toBe(true);
      expect(startField?.placeholder).toBe('2025-10-10T10:00:00Z');
      expect(startField?.dynamic).toBe(true);
      expect(startField?.dynamicPlaceholder).toBe(
        '{{action.payload.end_datetime}}'
      );
    });

    it('should have end_datetime field with correct properties', () => {
      const endField = googleCreateCalendarEventSchema.fields[3];
      expect(endField?.name).toBe('end_datetime');
      expect(endField?.type).toBe('text');
      expect(endField?.label).toBe('End Date/Time (ISO 8601 format)');
      expect(endField?.required).toBe(true);
      expect(endField?.placeholder).toBe('2025-10-10T11:00:00Z');
      // Note: end_datetime field doesn't have dynamic property defined
    });

    it('should have attendees field with correct properties', () => {
      const attendeesField = googleCreateCalendarEventSchema.fields[4];
      expect(attendeesField?.name).toBe('attendees');
      expect(attendeesField?.type).toBe('text');
      expect(attendeesField?.label).toBe('Attendees (comma-separated emails)');
      expect(attendeesField?.required).toBe(false);
      expect(attendeesField?.placeholder).toBe(
        'john@example.com, jane@example.com'
      );
      expect(attendeesField?.dynamic).toBe(true);
      expect(attendeesField?.dynamicPlaceholder).toBe(
        '{{action.payload.organizer.email}}'
      );
    });
  });

  describe('googleCreateDocumentSchema', () => {
    it('should have correct name', () => {
      expect(googleCreateDocumentSchema.name).toBe('Create Google Doc');
    });

    it('should have correct description', () => {
      expect(googleCreateDocumentSchema.description).toBe(
        'Creates a new Google Document'
      );
    });

    it('should have two fields', () => {
      expect(googleCreateDocumentSchema.fields).toHaveLength(2);
    });

    it('should have title field with correct properties', () => {
      const titleField = googleCreateDocumentSchema.fields[0];
      expect(titleField?.name).toBe('title');
      expect(titleField?.type).toBe('text');
      expect(titleField?.label).toBe('Document Title');
      expect(titleField?.required).toBe(true);
      expect(titleField?.placeholder).toBe('My Document');
      expect(titleField?.dynamic).toBe(true);
      expect(titleField?.dynamicPlaceholder).toBe(
        'Notes - {{action.payload.file_name}}'
      );
    });

    it('should have content field with correct properties', () => {
      const contentField = googleCreateDocumentSchema.fields[1];
      expect(contentField?.name).toBe('content');
      expect(contentField?.type).toBe('textarea');
      expect(contentField?.label).toBe('Initial Content');
      expect(contentField?.required).toBe(false);
      expect(contentField?.placeholder).toBe('Document content...');
      expect(contentField?.dynamic).toBe(true);
      expect(contentField?.dynamicPlaceholder).toBe(
        '{{action.payload.description}}\n\nCreated from: {{action.payload.file_name}}'
      );
    });
  });
});
