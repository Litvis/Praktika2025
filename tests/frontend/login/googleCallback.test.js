import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { flushPromises } from '@vue/test-utils'; 
import { nextTick } from 'vue';

describe('GoogleCallback Component', () => {
  const GoogleCallbackStub = {
    template: `
      <div>
        <h1>Authenticating...</h1>
      </div>
    `,
    async mounted() {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (code) {
        try {
          const response = await fetch('https://praktika2025.onrender.com/auth/google/callback', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });
  
          if (response.ok) {
            window.location.href = '/dashboard'; 
          } else {
            alert('Authentication failed');
          }
        } catch (error) {
          console.error('Error during authentication:', error);
        }
      }
    }
  };

  const originalWindowLocation = window.location;
  const originalURLSearchParams = global.URLSearchParams;
  const originalFetch = global.fetch;
  const originalAlert = global.alert;
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    vi.useFakeTimers();

    global.URLSearchParams = vi.fn().mockImplementation(() => ({
      get: vi.fn()
    }));

    delete window.location;
    window.location = { 
      href: '',
      search: '?code=test_auth_code'
    };

    global.fetch = vi.fn();

    global.alert = vi.fn();

    console.error = vi.fn();
  });

  afterEach(() => {
    window.location = originalWindowLocation;
    global.URLSearchParams = originalURLSearchParams;
    global.fetch = originalFetch;
    global.alert = originalAlert;
    console.error = originalConsoleError;

    vi.useRealTimers();

    vi.resetAllMocks();
  });

  it('should render the Authenticating message', () => {
    const wrapper = mount(GoogleCallbackStub);
    expect(wrapper.find('h1').text()).toBe('Authenticating...');
  });

  it('should get the code from URL parameters and make an API call', async () => {
    const mockGet = vi.fn().mockReturnValue('test_auth_code');
    global.URLSearchParams.mockImplementation(() => ({
      get: mockGet
    }));

    global.fetch.mockResolvedValueOnce({
      ok: true
    });

    mount(GoogleCallbackStub);

    vi.runAllTimers();
    await flushPromises();

    expect(mockGet).toHaveBeenCalledWith('code');

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

    expect(window.location.href).toBe('/dashboard');
  });

  it('should show an alert on authentication failure', async () => {
    const mockGet = vi.fn().mockReturnValue('invalid_code');
    global.URLSearchParams.mockImplementation(() => ({
      get: mockGet
    }));

    global.fetch.mockResolvedValueOnce({
      ok: false
    });

    mount(GoogleCallbackStub);

    vi.runAllTimers();
    await flushPromises();

    expect(alert).toHaveBeenCalledWith('Authentication failed');

    expect(window.location.href).not.toBe('/dashboard');
  });

  it('should handle errors during the fetch operation', async () => {
    const mockGet = vi.fn().mockReturnValue('test_code');
    global.URLSearchParams.mockImplementation(() => ({
      get: mockGet
    }));

    const testError = new Error('Network error');
    global.fetch.mockRejectedValueOnce(testError);

    mount(GoogleCallbackStub);

    vi.runAllTimers();
    await flushPromises();

    expect(console.error).toHaveBeenCalledWith('Error during authentication:', testError);

    expect(window.location.href).not.toBe('/dashboard');
    expect(alert).not.toHaveBeenCalled();
  });

  it('should do nothing if no code is present in URL', async () => {
    const mockGet = vi.fn().mockReturnValue(null);
    global.URLSearchParams.mockImplementation(() => ({
      get: mockGet
    }));

    mount(GoogleCallbackStub);

    vi.runAllTimers();
    await flushPromises();

    expect(fetch).not.toHaveBeenCalled();

    expect(window.location.href).not.toBe('/dashboard');
  });
});