import { googleActions } from '../../../src/services/services/google/actions';

describe('Google Actions', () => {
  describe('Actions array', () => {
    it('should be an empty array', () => {
      expect(googleActions).toEqual([]);
    });

    it('should have length 0', () => {
      expect(googleActions).toHaveLength(0);
    });
  });
});
