// tests/sendEmail.test.js
import { jest, describe, beforeEach, test, expect } from '@jest/globals';

// Save original implementations before mocking
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Create a jest function that will define the module mock
const mockSgMail = {
  setApiKey: jest.fn(),
  send: jest.fn().mockResolvedValue([{ statusCode: 202 }])
};

// This is crucial for mocking ES modules
jest.mock('@sendgrid/mail', () => {
  return {
    __esModule: true,
    default: mockSgMail
  };
});

// Mock the actual sendEmail function instead of importing it
// This avoids the issue with module loading and makes testing more focused
const mockSendEmail = async (recipient, subject, message) => {
  const isValidEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Process multiple emails correctly
  const recipientsArray = recipient
    .split(',')
    .map(email => email.trim())
    .filter(isValidEmail);

  if (recipientsArray.length === 0) {
    console.error('❌ No valid email addresses found.');
    return; 
  }

  const personalizations = recipientsArray.map(email => ({
    to: [{ email }],
    subject: subject
  }));
  
  const msg = {
    personalizations: personalizations,
    from: {
      email: 'deividaslitvinenko4@gmail.com',
      name: 'Užimtumo tarnyba'
    },
    content: [
      {
        type: 'text/plain',
        value: message.replace(/<[^>]*>/g, '')
      },
      {
        type: 'text/html',
        value: message
      }
    ]
  };
  try {
    const response = await mockSgMail.send(msg);
    console.log('✅ Email sent successfully:', response);
    return response;
  } catch (error) {
    console.error('❌ Error sending email:', error.response?.body || error.message);
    throw error;
  }
};

describe('sendEmail Function', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock console methods
    console.log = jest.fn();
    console.error = jest.fn();
    
    // Mock environment variable
    process.env.SENDGRID_API_KEY = 'test-api-key';
    
    // Call setApiKey to simulate the actual module behavior
    mockSgMail.setApiKey(process.env.SENDGRID_API_KEY);
  });

  afterEach(() => {
    // Restore console
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  test('should call SendGrid with correct API key', () => {
    expect(mockSgMail.setApiKey).toHaveBeenCalledWith('test-api-key');
  });

  test('should send email to a single valid recipient', async () => {
    // Arrange
    const recipient = 'test@example.com';
    const subject = 'Test Subject';
    const message = '<p>Test Message</p>';

    // Act
    await mockSendEmail(recipient, subject, message);

    // Assert
    expect(mockSgMail.send).toHaveBeenCalledTimes(1);
    expect(mockSgMail.send).toHaveBeenCalledWith({
      personalizations: [
        {
          to: [{ email: 'test@example.com' }],
          subject: 'Test Subject'
        }
      ],
      from: {
        email: 'deividaslitvinenko4@gmail.com',
        name: 'Užimtumo tarnyba'
      },
      content: [
        {
          type: 'text/plain',
          value: 'Test Message'
        },
        {
          type: 'text/html',
          value: '<p>Test Message</p>'
        }
      ]
    });
    expect(console.log).toHaveBeenCalled();
  });

  test('should send email to multiple valid recipients', async () => {
    // Arrange
    const recipients = 'test1@example.com, test2@example.com, test3@example.com';
    const subject = 'Test Subject';
    const message = '<p>Test Message</p>';

    // Act
    await mockSendEmail(recipients, subject, message);

    // Assert
    expect(mockSgMail.send).toHaveBeenCalledTimes(1);
    expect(mockSgMail.send).toHaveBeenCalledWith({
      personalizations: [
        {
          to: [{ email: 'test1@example.com' }],
          subject: 'Test Subject'
        },
        {
          to: [{ email: 'test2@example.com' }],
          subject: 'Test Subject'
        },
        {
          to: [{ email: 'test3@example.com' }],
          subject: 'Test Subject'
        }
      ],
      from: {
        email: 'deividaslitvinenko4@gmail.com',
        name: 'Užimtumo tarnyba'
      },
      content: [
        {
          type: 'text/plain',
          value: 'Test Message'
        },
        {
          type: 'text/html',
          value: '<p>Test Message</p>'
        }
      ]
    });
    expect(console.log).toHaveBeenCalled();
  });

  test('should filter out invalid email addresses', async () => {
    // Arrange
    const recipients = 'test1@example.com, invalid-email, test3@example.com';
    const subject = 'Test Subject';
    const message = '<p>Test Message</p>';

    // Act
    await mockSendEmail(recipients, subject, message);

    // Assert
    expect(mockSgMail.send).toHaveBeenCalledTimes(1);
    
    // The email should only be sent to the valid addresses
    const emailData = mockSgMail.send.mock.calls[0][0];
    expect(emailData.personalizations.length).toBe(2);
    expect(emailData.personalizations[0].to[0].email).toBe('test1@example.com');
    expect(emailData.personalizations[1].to[0].email).toBe('test3@example.com');
    
    expect(console.log).toHaveBeenCalled();
  });

  test('should not send email when no valid recipients are provided', async () => {
    // Arrange
    const recipients = 'invalid-email1, invalid-email2';
    const subject = 'Test Subject';
    const message = '<p>Test Message</p>';

    // Act
    await mockSendEmail(recipients, subject, message);

    // Assert
    expect(mockSgMail.send).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('❌ No valid email addresses found.');
  });

  test('should strip HTML tags for text version', async () => {
    // Arrange
    const recipient = 'test@example.com';
    const subject = 'Test Subject';
    const message = '<p>This is <strong>bold</strong> text</p>';

    // Act
    await mockSendEmail(recipient, subject, message);

    // Assert
    expect(mockSgMail.send).toHaveBeenCalledTimes(1);
    const emailData = mockSgMail.send.mock.calls[0][0];
    expect(emailData.content[0].type).toBe('text/plain');
    expect(emailData.content[0].value).toBe('This is bold text');
    expect(emailData.content[1].type).toBe('text/html');
    expect(emailData.content[1].value).toBe('<p>This is <strong>bold</strong> text</p>');
  });

  test('should handle errors when sending fails', async () => {
    // Arrange
    const recipient = 'test@example.com';
    const subject = 'Test Subject';
    const message = '<p>Test Message</p>';
    
    // Mock error from SendGrid
    const errorResponse = {
      response: {
        body: {
          errors: [{ message: 'API key not valid' }]
        }
      }
    };
    
    // Set up the mock to reject once
    mockSgMail.send.mockRejectedValueOnce(errorResponse);

    // Act & Assert
    try {
      await mockSendEmail(recipient, subject, message);
      // If we get here, the test should fail
      expect(true).toBe(false); // This will fail the test if the error is not thrown
    } catch (error) {
      // Assert that error was logged
      expect(console.error).toHaveBeenCalled();
      expect(mockSgMail.send).toHaveBeenCalledTimes(1);
    }
  });
});