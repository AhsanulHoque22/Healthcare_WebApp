import { calculateAge, formatAge, formatGender } from './dateUtils';

describe('dateUtils', () => {
  describe('calculateAge', () => {
    it('should calculate age correctly for a past date', () => {
      const dob = '1990-01-01';
      const age = calculateAge(dob);
      const today = new Date();
      let expectedAge = today.getFullYear() - 1990;
      if (today.getMonth() < 0 || (today.getMonth() === 0 && today.getDate() < 1)) {
        expectedAge--;
      }
      expect(age).toBe(expectedAge);
    });

    it('should return null for invalid date', () => {
      expect(calculateAge('invalid-date')).toBeNull();
    });

    it('should return null for null/undefined input', () => {
      expect(calculateAge(null)).toBeNull();
      expect(calculateAge(undefined)).toBeNull();
    });

    it('should handle Date objects', () => {
      const dob = new Date('1985-05-15');
      const age = calculateAge(dob);
      expect(age).toBeGreaterThan(0);
    });
  });

  describe('formatAge', () => {
    it('should format age with "Y"', () => {
      expect(formatAge(25)).toBe('25 Y');
    });

    it('should return "N/A" for null age', () => {
      expect(formatAge(null)).toBe('N/A');
    });

    it('should return "N/A" for negative age', () => {
      expect(formatAge(-5)).toBe('N/A');
    });
  });

  describe('formatGender', () => {
    it('should format gender correctly', () => {
      expect(formatGender('male')).toBe('M');
      expect(formatGender('Female')).toBe('F');
    });

    it('should return "—" for missing gender', () => {
      expect(formatGender(null)).toBe('—');
      expect(formatGender('')).toBe('—');
    });
  });
});
