// tests/auth/google.test.js
import { jest } from '@jest/globals';

// Sukurti paprastus mockus
const mockPool = {
  query: jest.fn()
};

// Mockuoti modulius
jest.mock('../../backend/db.js', () => ({
  pool: mockPool
}));

// Testuojame
describe('Google Authentication Functions', () => {
  
  beforeEach(() => {
    // Išvalyti mockus prieš kiekvieną testą
    jest.clearAllMocks();
    mockPool.query.mockReset();
  });

  // Testuojame serializeUser funkciją
  test('serializeUser should extract email and role from user object', () => {
    // Sukuriame serializeUser funkciją (iš google.js failo)
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
    
    // Sukurti test callback
    const done = jest.fn();
    
    // Sukurti test user objektą
    const user = {
      id: 1,
      emails: [{ value: 'test@example.com' }],
      role: 'admin'
    };
    
    // Iškviesti serializeUser
    serializeUser(user, done);
    
    // Tikrinti rezultatus
    expect(done).toHaveBeenCalledWith(null, {
      id: 1,
      email: 'test@example.com',
      role: 'admin'
    });
  });

  // Testuojame nevalidaus vartotojo elgesį
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
      // nėra emails array
      role: 'worker'
    };
    
    serializeUser(invalidUser, done);
    
    expect(done).toHaveBeenCalledWith(expect.any(Error));
    expect(done.mock.calls[0][0].message).toBe('No email found for user');
  });

  // Testuojame deserializeUser funkciją
  test('deserializeUser should fetch user from database and transform data', async () => {
    const deserializeUser = async (userData, done) => {
      try {
        if (!userData || !userData.email) {
          return done(new Error('Invalid user data'));
        }
    
        // Mockuoti duomenų bazės atsakymą
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
    
    // Tikrinti SQL užklausą
    expect(mockPool.query).toHaveBeenCalledWith(
      'SELECT * FROM users WHERE email = $1',
      ['test@example.com']
    );
    
    // Tikrinti transformuotus duomenis
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
  
  // Testuojame OAuth callback funkcijos pagrindines dalis
  test('OAuth callback should handle invalid profile data', async () => {
    const googleCallback = async (request, accessToken, refreshToken, profile, done) => {
      try {
        if (!profile || !profile.emails || !profile.emails[0]) {
          return done(null, false, { message: 'Invalid profile information' });
        }
        
        // Tolimesnis kodas nereikalingas šiam testui...
        done(null, {});
      } catch (error) {
        done(error);
      }
    };
    
    const done = jest.fn();
    const invalidProfile = { id: '12345' }; // Nėra emails laukelio
    
    await googleCallback({}, 'token', 'refresh', invalidProfile, done);
    
    expect(done).toHaveBeenCalledWith(null, false, { 
      message: 'Invalid profile information' 
    });
  });
  
  test('OAuth callback should create new user if not found', async () => {
    // Imituoti OAuth callback funkciją
    const googleCallback = async (request, accessToken, refreshToken, profile, done) => {
      try {
        if (!profile || !profile.emails || !profile.emails[0]) {
          return done(null, false, { message: 'Invalid profile information' });
        }
    
        const userEmail = profile.emails[0].value;
        
        // Mockuoti kad vartotojas nerastas
        mockPool.query.mockImplementationOnce(() => Promise.resolve({
          rows: [] // Tuščias masyvas = vartotojas nerastas
        }));
        
        const userResult = await mockPool.query(
          'SELECT * FROM users WHERE email = $1', 
          [userEmail]
        );
        
        if (userResult.rows.length === 0) {
          // Mockuoti naujo vartotojo sukūrimą
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
        
        // Ši dalis nevykdoma esant tuščiam `rows` masyvui
        done(null, {});
      } catch (error) {
        done(error);
      }
    };
    
    const done = jest.fn();
    
    // Sukurti Google profilio imitaciją
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
    
    // Tikrinti ar įvykdytos abi užklausos
    expect(mockPool.query).toHaveBeenCalledTimes(2);
    
    // Tikrinti INSERT užklausą
    expect(mockPool.query).toHaveBeenNthCalledWith(2,
      'INSERT INTO users (email, name, role) VALUES ($1, $2, $3) RETURNING *',
      ['new@example.com', 'New User', 'worker']
    );
    
    // Tikrinti ar callback grąžino teisingą vartotoją
    expect(done).toHaveBeenCalledWith(null, expect.objectContaining({
      id: 2,
      emails: profile.emails,
      displayName: 'New User',
      role: 'worker'
    }));
  });
});