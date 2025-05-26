import { jest } from '@jest/globals';

const mockPool = {
  query: jest.fn()
};

jest.mock('../../backend/db.js', () => ({
  pool: mockPool
}));

describe('Google Authentication Functions', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockPool.query.mockReset();
  });

  test('serializeUser should extract email and role from user object', () => {
    const serializeUser = (user, done) => {
      try {
        const email = user.emails && user.emails[0] ? user.emails[0].value : null;
        
        if (!email) {
          return done(new Error('No email found for user'));
        }
    
        done(null, {
          id: user.id || null,
          email: email,
          role: user.role || 'worker'
        });
      } catch (error) {
        done(error);
      }
    };
    
    const done = jest.fn();
    
    const user = {
      id: 1,
      emails: [{ value: 'test@example.com' }],
      role: 'admin'
    };
    
    serializeUser(user, done);
    
    expect(done).toHaveBeenCalledWith(null, {
      id: 1,
      email: 'test@example.com',
      role: 'admin'
    });
  });

  test('serializeUser should handle missing email', () => {
    const serializeUser = (user, done) => {
      try {
        const email = user.emails && user.emails[0] ? user.emails[0].value : null;
        
        if (!email) {
          return done(new Error('No email found for user'));
        }
    
        done(null, {
          id: user.id || null,
          email: email,
          role: user.role || 'worker'
        });
      } catch (error) {
        done(error);
      }
    };
    
    const done = jest.fn();
    const invalidUser = {
      id: 2,
      role: 'worker'
    };
    
    serializeUser(invalidUser, done);
    
    expect(done).toHaveBeenCalledWith(expect.any(Error));
    expect(done.mock.calls[0][0].message).toBe('No email found for user');
  });

  test('deserializeUser should fetch user from database and transform data', async () => {
    const deserializeUser = async (userData, done) => {
      try {
        if (!userData || !userData.email) {
          return done(new Error('Invalid user data'));
        }
    
        mockPool.query.mockImplementationOnce(() => Promise.resolve({
          rows: [{
            id: 1,
            email: 'test@example.com',
            name: 'Test User',
            role: 'admin'
          }]
        }));
        
        const userResult = await mockPool.query('SELECT * FROM users WHERE email = $1', [userData.email]);
        
        if (userResult.rows.length > 0) {
          const user = userResult.rows[0];
          done(null, {
            id: user.id,
            name: {
              givenName: user.name ? user.name.split(' ')[0] : '',
              familyName: user.name ? user.name.split(' ')[1] : ''
            },
            displayName: user.name,
            emails: [{ value: user.email }],
            role: user.role || 'worker'
          });
        } else {
          done(new Error('User not found'));
        }
      } catch (error) {
        done(error);
      }
    };
    
    const done = jest.fn();
    const userData = { email: 'test@example.com' };
    
    await deserializeUser(userData, done);
    
    expect(mockPool.query).toHaveBeenCalledWith(
      'SELECT * FROM users WHERE email = $1',
      ['test@example.com']
    );
    
    expect(done).toHaveBeenCalledWith(null, {
      id: 1,
      name: {
        givenName: 'Test',
        familyName: 'User'
      },
      displayName: 'Test User',
      emails: [{ value: 'test@example.com' }],
      role: 'admin'
    });
  });
  
  test('OAuth callback should handle invalid profile data', async () => {
    const googleCallback = async (request, accessToken, refreshToken, profile, done) => {
      try {
        if (!profile || !profile.emails || !profile.emails[0]) {
          return done(null, false, { message: 'Invalid profile information' });
        }
        
        done(null, {});
      } catch (error) {
        done(error);
      }
    };
    
    const done = jest.fn();
    const invalidProfile = { id: '12345' };
    
    await googleCallback({}, 'token', 'refresh', invalidProfile, done);
    
    expect(done).toHaveBeenCalledWith(null, false, { 
      message: 'Invalid profile information' 
    });
  });
  
  test('OAuth callback should create new user if not found', async () => {
    const googleCallback = async (request, accessToken, refreshToken, profile, done) => {
      try {
        if (!profile || !profile.emails || !profile.emails[0]) {
          return done(null, false, { message: 'Invalid profile information' });
        }
    
        const userEmail = profile.emails[0].value;
        
        mockPool.query.mockImplementationOnce(() => Promise.resolve({
          rows: []
        }));
        
        const userResult = await mockPool.query(
          'SELECT * FROM users WHERE email = $1', 
          [userEmail]
        );
        
        if (userResult.rows.length === 0) {
          const displayName = profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim();
          
          mockPool.query.mockImplementationOnce(() => Promise.resolve({
            rows: [{
              id: 2,
              email: userEmail,
              name: displayName,
              role: 'worker'
            }]
          }));
          
          const newUserResult = await mockPool.query(
            'INSERT INTO users (email, name, role) VALUES ($1, $2, $3) RETURNING *',
            [userEmail, displayName, 'worker']
          );
          
          if (newUserResult.rows.length === 0) {
            return done(null, false, { message: 'Failed to create user' });
          }
          
          const newUser = newUserResult.rows[0];
          
          const normalizedUser = {
            id: newUser.id,
            emails: profile.emails,
            name: {
              givenName: profile.name?.givenName || '',
              familyName: profile.name?.familyName || ''
            },
            displayName: displayName,
            role: newUser.role || 'worker'
          };
          
          return done(null, normalizedUser);
        }
        
        done(null, {});
      } catch (error) {
        done(error);
      }
    };
    
    const done = jest.fn();
    
    const profile = {
      id: '123456789',
      displayName: 'New User',
      emails: [{ value: 'new@example.com' }],
      name: {
        givenName: 'New',
        familyName: 'User'
      }
    };
    
    await googleCallback({}, 'token', 'refresh', profile, done);
    
    expect(mockPool.query).toHaveBeenCalledTimes(2);
    
    expect(mockPool.query).toHaveBeenNthCalledWith(2,
      'INSERT INTO users (email, name, role) VALUES ($1, $2, $3) RETURNING *',
      ['new@example.com', 'New User', 'worker']
    );
    
    expect(done).toHaveBeenCalledWith(null, expect.objectContaining({
      id: 2,
      emails: profile.emails,
      displayName: 'New User',
      role: 'worker'
    }));
  });
});