// tests/db.test.js
import { jest } from '@jest/globals';
import * as dbModule from '../backend/db.js';

describe('Database Module Tests', () => {
  // Test 1: Testuojame ar pool objektas yra eksportuojamas
  test('should export pool object', () => {
    expect(dbModule.pool).toBeDefined();
  });
  
  // Test 2: Testuojame ar pool turi reikalingus metodus
  test('should have required pool methods', () => {
    const { pool } = dbModule;
    expect(typeof pool.query).toBe('function');
    expect(typeof pool.connect).toBe('function');
    expect(typeof pool.on).toBe('function');
  });
  
  // Test 3: Testuojame konfigūraciją
  test('should have correct pool configuration', () => {
    const { pool } = dbModule;
    
    // Tikriname pagrindinius konfigūracijos parametrus
    expect(pool.options).toBeDefined();
    expect(pool.options.max).toBe(10);
    expect(pool.options.idleTimeoutMillis).toBe(30000);
    expect(pool.options.connectionTimeoutMillis).toBe(5000);
    expect(pool.options.ssl).toEqual({ rejectUnauthorized: false });
  });
  
  // Test 4: Testuojame ar įregistruotas klaidos apdorojimas
  test('should have error handler registered', () => {
    const { pool } = dbModule;
    
    // Tikriname ar yra error įvykio klausytojas
    expect(pool._events && pool._events.error).toBeDefined();
  });
});