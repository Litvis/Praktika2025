import { jest } from '@jest/globals';

const mockQuery = jest.fn().mockResolvedValue({ rows: [], rowCount: 0 });
const mockConnect = jest.fn().mockResolvedValue({
  query: mockQuery,
  release: jest.fn()
});
const mockPool = {
  query: mockQuery,
  connect: mockConnect,
  end: jest.fn(),
  on: jest.fn()
};

export const pool = mockPool;
export default { pool: mockPool };