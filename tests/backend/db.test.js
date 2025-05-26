// tests/db.test.js
import { jest } from '@jest/globals';
import * as dbModule from '../../backend/db.js';

describe('Database Module Tests', () => {
  test('should export pool object', () => {
    expect(dbModule.pool).toBeDefined();
  });

  test('should have required pool methods', () => {
    const { pool } = dbModule;
    expect(typeof pool.query).toBe('function');
    expect(typeof pool.connect).toBe('function');
    expect(typeof pool.on).toBe('function');
  });

  test('should have correct pool configuration', () => {
    const { pool } = dbModule;

    expect(pool.options).toBeDefined();
    expect(pool.options.max).toBe(10);
    expect(pool.options.idleTimeoutMillis).toBe(30000);
    expect(pool.options.connectionTimeoutMillis).toBe(5000);
    expect(pool.options.ssl).toEqual({ rejectUnauthorized: false });
  });

  test('should have error handler registered', () => {
    const { pool } = dbModule;
    
    expect(pool._events && pool._events.error).toBeDefined();
  });
});