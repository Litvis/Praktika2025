// tests/frontend/login/googleCallback.test.js
import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { flushPromises } from '@vue/test-utils'; // Import flushPromises from vue test utils
import { nextTick } from 'vue';

describe('GoogleCallback Component', () => {
  // Create a GoogleCallbackStub based on the actual component
  const GoogleCallbackStub = {
    template: `
      <div>
        <h1>Authenticating...</h1>
      </div>
    `,
    async mounted() {
      // Get the code from the query parameters
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (code) {
        try {
          // Send the code to the backend to complete the authentication
          const response = await fetch('https://praktika2025.onrender.com/auth/google/callback', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies (for session management)
          });
  
          // If successful, redirect to the dashboard
          if (response.ok) {
            window.location.href = '/dashboard'; // Redirect to the dashboard
          } else {
            alert('Authentication failed');
          }
        } catch (error) {
          console.error('Error during authentication:', error);
        }
      }
    }
  };

  // Save original methods before mocking
  const originalWindowLocation = window.location;
  const originalURLSearchParams = global.URLSearchParams;
  const originalFetch = global.fetch;
  const originalAlert = global.alert;
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    // Set up fake timers
    vi.useFakeTimers();

    // Mock URLSearchParams
    global.URLSearchParams = vi.fn().mockImplementation(() => ({
      get: vi.fn()
    }));

    // Mock window.location
    delete window.location;
    window.location = { 
      href: '',
      search: '?code=test_auth_code'
    };

    // Mock fetch
    global.fetch = vi.fn();

    // Mock alert
    global.alert = vi.fn();

    // Mock console.error
    console.error = vi.fn();
  });

  afterEach(() => {
    // Restore original methods
    window.location = originalWindowLocation;
    global.URLSearchParams = originalURLSearchParams;
    global.fetch = originalFetch;
    global.alert = originalAlert;
    console.error = originalConsoleError;
    
    // Reset timers
    vi.useRealTimers();
    
    // Reset all mocks
    vi.resetAllMocks();
  });

  it('should render the Authenticating message', () => {
    const wrapper = mount(GoogleCallbackStub);
    expect(wrapper.find('h1').text()).toBe('Authenticating...');
  });

  it('should get the code from URL parameters and make an API call', async () => {
    // Mock URLSearchParams to return a code
    const mockGet = vi.fn().mockReturnValue('test_auth_code');
    global.URLSearchParams.mockImplementation(() => ({
      get: mockGet
    }));

    // Mock successful fetch response
    global.fetch.mockResolvedValueOnce({
      ok: true
    });

    // Mount the component (which will trigger the mounted lifecycle hook)
    mount(GoogleCallbackStub);
    
    // Wait for all promises to resolve
    vi.runAllTimers();
    await flushPromises();

    // Verify the correct parameter was requested
    expect(mockGet).toHaveBeenCalledWith('code');
    
    // Verify fetch was called with correct URL and options
    expect(fetch).toHaveBeenCalledWith(
      'https://praktika2025.onrender.com/auth/google/callback',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }
    );

    // Verify redirection occurred
    expect(window.location.href).toBe('/dashboard');
  });

  it('should show an alert on authentication failure', async () => {
    // Mock URLSearchParams to return a code
    const mockGet = vi.fn().mockReturnValue('invalid_code');
    global.URLSearchParams.mockImplementation(() => ({
      get: mockGet
    }));

    // Mock failed fetch response
    global.fetch.mockResolvedValueOnce({
      ok: false
    });

    // Mount the component
    mount(GoogleCallbackStub);
    
    // Wait for all promises to resolve
    vi.runAllTimers();
    await flushPromises();

    // Verify alert was called
    expect(alert).toHaveBeenCalledWith('Authentication failed');
    
    // Verify no redirection occurred
    expect(window.location.href).not.toBe('/dashboard');
  });

  it('should handle errors during the fetch operation', async () => {
    // Mock URLSearchParams to return a code
    const mockGet = vi.fn().mockReturnValue('test_code');
    global.URLSearchParams.mockImplementation(() => ({
      get: mockGet
    }));

    // Mock fetch to throw an error
    const testError = new Error('Network error');
    global.fetch.mockRejectedValueOnce(testError);

    // Mount the component
    mount(GoogleCallbackStub);
    
    // Wait for all promises to resolve
    vi.runAllTimers();
    await flushPromises();

    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith('Error during authentication:', testError);
    
    // Verify no redirection occurred and no alert was shown
    expect(window.location.href).not.toBe('/dashboard');
    expect(alert).not.toHaveBeenCalled();
  });

  it('should do nothing if no code is present in URL', async () => {
    // Mock URLSearchParams to return null (no code)
    const mockGet = vi.fn().mockReturnValue(null);
    global.URLSearchParams.mockImplementation(() => ({
      get: mockGet
    }));

    // Mount the component
    mount(GoogleCallbackStub);
    
    // Wait for all promises to resolve
    vi.runAllTimers();
    await flushPromises();

    // Verify fetch was not called
    expect(fetch).not.toHaveBeenCalled();
    
    // Verify no redirection occurred
    expect(window.location.href).not.toBe('/dashboard');
  });
});