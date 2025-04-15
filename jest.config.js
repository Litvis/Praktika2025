// jest.config.js
export default {
  transform: {},
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/backend/**/*.test.js'],
  modulePathIgnorePatterns: ['<rootDir>/tests/frontend/'],
  
  // Fix for db.js import issues - use exact strings, not regexes
  moduleNameMapper: {
    '../../backend/db.js': '<rootDir>/tests/backend/mocks/db.mock.js',
    '../backend/db.js': '<rootDir>/tests/backend/mocks/db.mock.js'
  },
  
  // Alternative approach using regex with proper escaping
  // moduleNameMapper: {
  //   '\\.\\.\\/\\.\\.\\/backend\\/db\\.js': '<rootDir>/tests/backend/mocks/db.mock.js',
  //   '\\.\\.\\/backend\\/db\\.js': '<rootDir>/tests/backend/mocks/db.mock.js'
  // },
  
  // Set maxWorkers to help avoid parallel execution issues
  maxWorkers: 1
};