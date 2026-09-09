import {
  formatCurrency,
  formatDate,
  formatDateTime,
  slugify,
  truncate,
  generateAdmissionNumber,
  generateEmployeeId,
  capitalize,
  camelCase,
  kebabCase,
  formatDateOnly,
  isToday,
  isFuture,
  addDays,
  startOfDay,
  isValidEmail,
  isValidPhone,
  isStrongPassword,
  groupBy,
  omit,
  pick,
  delay,
  retry,
} from './index';

describe('shared-utils', () => {
  describe('formatCurrency', () => {
    it('should format USD by default', () => {
      expect(formatCurrency(1234.5)).toBe('$1,234.50');
    });
    it('should format with custom currency', () => {
      expect(formatCurrency(1234.5, 'EUR')).toBe('€1,234.50');
    });
  });

  describe('formatDate', () => {
    it('should format date string', () => {
      const result = formatDate('2024-01-15');
      expect(result).toContain('Jan');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });
  });

  describe('formatDateTime', () => {
    it('should include time', () => {
      const result = formatDateTime('2024-01-15T10:30:00');
      expect(result).toContain('10:30');
    });
  });

  describe('slugify', () => {
    it('should convert to slug', () => {
      expect(slugify('Hello World!')).toBe('hello-world');
    });
    it('should handle multiple spaces', () => {
      expect(slugify('Hello   World')).toBe('hello-world');
    });
  });

  describe('truncate', () => {
    it('should truncate long text', () => {
      expect(truncate('Hello World', 8)).toBe('Hello...');
    });
    it('should not truncate short text', () => {
      expect(truncate('Hello', 10)).toBe('Hello');
    });
  });

  describe('generateAdmissionNumber', () => {
    it('should generate formatted admission number', () => {
      expect(generateAdmissionNumber('ABC', 2024, 1)).toBe('ABC-2024-0001');
    });
  });

  describe('generateEmployeeId', () => {
    it('should generate formatted employee ID', () => {
      expect(generateEmployeeId('ABC', 1)).toBe('ABC-EMP-0001');
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
    });
    it('should lowercase rest', () => {
      expect(capitalize('HELLO')).toBe('Hello');
    });
  });

  describe('camelCase', () => {
    it('should convert to camelCase', () => {
      expect(camelCase('hello-world')).toBe('helloWorld');
    });
  });

  describe('kebabCase', () => {
    it('should convert to kebab-case', () => {
      expect(kebabCase('helloWorld')).toBe('hello-world');
    });
  });

  describe('formatDateOnly', () => {
    it('should format date without time', () => {
      const result = formatDateOnly('2024-01-15');
      expect(result).toContain('Jan');
      expect(result).toContain('15');
    });
  });

  describe('isToday', () => {
    it('should return true for today', () => {
      expect(isToday(new Date())).toBe(true);
    });
    it('should return false for yesterday', () => {
      const yesterday = addDays(new Date(), -1);
      expect(isToday(yesterday)).toBe(false);
    });
  });

  describe('isFuture', () => {
    it('should return true for future date', () => {
      expect(isFuture(addDays(new Date(), 1))).toBe(true);
    });
    it('should return false for past date', () => {
      expect(isFuture(addDays(new Date(), -1))).toBe(false);
    });
  });

  describe('addDays', () => {
    it('should add days correctly', () => {
      const result = addDays(new Date('2024-01-15'), 5);
      expect(result.getDate()).toBe(20);
    });
  });

  describe('startOfDay', () => {
    it('should set time to midnight', () => {
      const result = startOfDay(new Date('2024-01-15T10:30:00'));
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
    });
    it('should reject invalid email', () => {
      expect(isValidEmail('invalid')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should validate correct phone', () => {
      expect(isValidPhone('+1-234-567-8900')).toBe(true);
    });
    it('should reject invalid phone', () => {
      expect(isValidPhone('abc')).toBe(false);
    });
  });

  describe('isStrongPassword', () => {
    it('should reject weak password', () => {
      const result = isStrongPassword('weak');
      expect(result.valid).toBe(false);
      expect(result.reasons.length).toBeGreaterThan(0);
    });
    it('should accept strong password', () => {
      const result = isStrongPassword('StrongPass1!');
      expect(result.valid).toBe(true);
    });
  });

  describe('groupBy', () => {
    it('should group array by key', () => {
      const items = [
        { type: 'a', value: 1 },
        { type: 'b', value: 2 },
        { type: 'a', value: 3 },
      ];
      const grouped = groupBy(items, 'type');
      expect(grouped.a).toHaveLength(2);
      expect(grouped.b).toHaveLength(1);
    });
  });

  describe('omit', () => {
    it('should omit specified keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = omit(obj, ['b']);
      expect(result).toEqual({ a: 1, c: 3 });
    });
  });

  describe('pick', () => {
    it('should pick specified keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = pick(obj, ['a', 'c']);
      expect(result).toEqual({ a: 1, c: 3 });
    });
  });

  describe('delay', () => {
    it('should delay execution', async () => {
      const start = Date.now();
      await delay(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(40);
    });
  });

  describe('retry', () => {
    it('should retry failed function', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts++;
        if (attempts < 3) throw new Error('fail');
        return 'success';
      };
      const result = await retry(fn, 3, 10);
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });
  });
});
