import {
  everyDayAtXHourSchema,
  everyHourAtIntervalsSchema,
} from '../../../src/services/services/timer/schemas';

describe('Timer Schemas', () => {
  describe('everyDayAtXHourSchema', () => {
    it('should be defined', () => {
      expect(everyDayAtXHourSchema).toBeDefined();
    });

    it('should have correct name and description', () => {
      expect(everyDayAtXHourSchema.name).toBe('Every Day at X Hour');
      expect(everyDayAtXHourSchema.description).toContain(
        'Triggers once a day'
      );
    });

    it('should have 4 fields', () => {
      expect(everyDayAtXHourSchema.fields).toHaveLength(4);
    });

    it('should have hour field with correct properties', () => {
      const hourField = everyDayAtXHourSchema.fields?.find(
        f => f.name === 'hour'
      );
      expect(hourField).toBeDefined();
      expect(hourField?.type).toBe('number');
      expect(hourField?.required).toBe(true);
      expect(hourField?.default).toBe(14);
      expect(hourField?.label).toContain('0-23');
    });

    it('should have minute field with correct properties', () => {
      const minuteField = everyDayAtXHourSchema.fields?.find(
        f => f.name === 'minute'
      );
      expect(minuteField).toBeDefined();
      expect(minuteField?.type).toBe('number');
      expect(minuteField?.required).toBe(true);
      expect(minuteField?.default).toBe(0);
      expect(minuteField?.label).toContain('0-59');
    });

    it('should have timezone field with correct properties', () => {
      const timezoneField = everyDayAtXHourSchema.fields?.find(
        f => f.name === 'timezone'
      );
      expect(timezoneField).toBeDefined();
      expect(timezoneField?.type).toBe('number');
      expect(timezoneField?.required).toBe(true);
      expect(timezoneField?.default).toBe(1);
      expect(timezoneField?.label).toContain('Timezone offset');
    });

    it('should have days field with 7 weekday options', () => {
      const daysField = everyDayAtXHourSchema.fields?.find(
        f => f.name === 'days'
      );
      expect(daysField).toBeDefined();
      expect(daysField?.type).toBe('checkbox');
      expect(daysField?.required).toBe(true);
      expect(daysField?.options).toHaveLength(7);
      expect(daysField?.options?.map(o => o.value)).toEqual([
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ]);
    });
  });

  describe('everyHourAtIntervalsSchema', () => {
    it('should be defined', () => {
      expect(everyHourAtIntervalsSchema).toBeDefined();
    });

    it('should have correct name and description', () => {
      expect(everyHourAtIntervalsSchema.name).toBe('Every Hour at X Minute');
      expect(everyHourAtIntervalsSchema.description).toContain('every hour');
    });

    it('should have 2 fields', () => {
      expect(everyHourAtIntervalsSchema.fields).toHaveLength(2);
    });

    it('should have minute field with correct properties', () => {
      const minuteField = everyHourAtIntervalsSchema.fields?.[0];
      expect(minuteField).toBeDefined();
      expect(minuteField?.name).toBe('minute');
      expect(minuteField?.type).toBe('number');
      expect(minuteField?.required).toBe(true);
      expect(minuteField?.default).toBe(0);
      expect(minuteField?.label).toContain('0-59');
    });

    it('should have timezone field with correct properties', () => {
      const timezoneField = everyHourAtIntervalsSchema.fields?.[1];
      expect(timezoneField).toBeDefined();
      expect(timezoneField?.name).toBe('timezone');
      expect(timezoneField?.type).toBe('number');
      expect(timezoneField?.required).toBe(true);
      expect(timezoneField?.default).toBe(1);
      expect(timezoneField?.label).toContain('Timezone offset');
    });
  });
});
