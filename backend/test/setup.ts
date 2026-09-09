export {};

describe('Setup Tests', () => {
  it('should load test environment', () => {
    expect(process.env.NODE_ENV).toBeDefined();
  });
});
