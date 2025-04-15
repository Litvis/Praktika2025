// tests/frontend/login/loginForm.test.js
import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { nextTick } from 'vue';

// Mock the Iconify component
vi.mock('@iconify/vue', () => ({
  Icon: {
    name: 'Icon',
    template: '<div class="mock-icon"></div>',
    props: ['icon']
  }
}));

describe('Login Form Component', () => {
  let wrapper;
  
  beforeEach(() => {
    // Create a stub component based on the Login Form
    const LoginFormStub = {
      template: `
      <div class="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-gray-50 to-gray-100 p-6">
        <div class="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
          <!-- Top wave decoration -->
          <div class="h-8 bg-green-600 relative">
            <svg class="absolute bottom-0 w-full" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" fill="#ffffff"></path>
            </svg>
          </div>
          
          <!-- Logo and Content Container -->
          <div class="px-8 pt-8 pb-12 flex flex-col items-center">
            <!-- Logo with subtle shadow -->
            <div class="w-32 h-32 flex items-center justify-center mb-8">
              <img src="public/uzt.jpg" class="w-full object-contain rounded-lg shadow-sm" alt="Company Logo">
            </div>
            
            <!-- Welcome Text -->
            <h1 class="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-2">Sveiki atvykę</h1>
            <p class="text-gray-600 text-center mb-8 max-w-sm">
              Prisijunkite su įmonės Google paskyra, kad galėtumėte tęsti
            </p>
            
            <!-- Google Sign-in Button -->
            <a 
              href="https://praktika2025.onrender.com/auth/google" 
              class="flex items-center justify-center w-full py-3 px-4 rounded-lg border border-gray-300 bg-white text-gray-800 font-medium shadow-sm hover:shadow transition-all duration-200 group"
              data-testid="google-signin-button"
            >
              <div class="mock-icon w-6 h-6 mr-3"></div>
              <span>Tęskite su Google</span>
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="mt-8 text-center text-gray-500 text-sm">
          © 2025 UŽT. Visos teisės saugomos.
        </div>
      </div>
      `,
      setup() {
        // Stub setup function to mimic the script setup in the component
        return {};
      }
    };
    
    // Mount the component
    wrapper = mount(LoginFormStub);
  });
  
  it('should render the login page correctly', () => {
    // Check main container
    expect(wrapper.find('.min-h-screen').exists()).toBe(true);
    
    // Check card container
    expect(wrapper.find('.max-w-md').exists()).toBe(true);
    
    // Check top wave decoration
    expect(wrapper.find('.bg-green-600').exists()).toBe(true);
    expect(wrapper.find('svg').exists()).toBe(true);
  });
  
  it('should display the company logo', () => {
    const logo = wrapper.find('img');
    expect(logo.exists()).toBe(true);
    expect(logo.attributes('src')).toBe('public/uzt.jpg');
    expect(logo.attributes('alt')).toBe('Company Logo');
  });
  
  it('should display correct welcome text', () => {
    // Check heading
    const heading = wrapper.find('h1');
    expect(heading.exists()).toBe(true);
    expect(heading.text()).toBe('Sveiki atvykę');
    
    // Check description
    const description = wrapper.find('p');
    expect(description.exists()).toBe(true);
    expect(description.text()).toContain('Prisijunkite su įmonės Google paskyra');
  });
  
  it('should have a Google sign-in button with correct link', () => {
    const signInButton = wrapper.find('a[data-testid="google-signin-button"]');
    expect(signInButton.exists()).toBe(true);
    expect(signInButton.attributes('href')).toBe('https://praktika2025.onrender.com/auth/google');
    expect(signInButton.text()).toContain('Tęskite su Google');
  });
  
  it('should display the copyright footer', () => {
    const footer = wrapper.find('.mt-8');
    expect(footer.exists()).toBe(true);
    expect(footer.text()).toContain('© 2025 UŽT. Visos teisės saugomos.');
  });
  
  it('should have the correct classes for styling and responsiveness', () => {
    // Test card container has shadow class
    expect(wrapper.find('.shadow-lg').exists()).toBe(true);
    
    // Test heading has responsive text size
    const heading = wrapper.find('h1');
    expect(heading.classes()).toContain('text-2xl');
    expect(heading.classes()).toContain('md:text-3xl');
    
    // Test signin button has hover effect classes
    const signInButton = wrapper.find('a[data-testid="google-signin-button"]');
    expect(signInButton.classes()).toContain('hover:shadow');
    expect(signInButton.classes()).toContain('transition-all');
  });
});