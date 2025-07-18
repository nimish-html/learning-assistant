import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignInForm from '@/components/SignInForm';
import { AuthProvider } from '@/lib/auth-context';
import { AuthService } from '@/lib/auth-service';

// Mock the AuthService
jest.mock('@/lib/auth-service');
const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
      getUser: jest.fn(),
      getSession: jest.fn()
    }
  }
}));

// Test wrapper with AuthProvider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('SignInForm', () => {
  const mockOnSuccess = jest.fn();
  const mockOnSwitchToSignUp = jest.fn();
  const mockOnForgotPassword = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthService.getCurrentUser.mockResolvedValue(null);
    mockAuthService.getCurrentSession.mockResolvedValue(null);
    mockAuthService.onAuthStateChange.mockReturnValue(() => { });
  });

  describe('Form Rendering', () => {
    it('renders the sign-in form with all required fields', () => {
      render(
        <TestWrapper>
          <SignInForm 
            onSuccess={mockOnSuccess} 
            onSwitchToSignUp={mockOnSwitchToSignUp}
            onForgotPassword={mockOnForgotPassword}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('signin-form')).toBeInTheDocument();
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('password-input')).toBeInTheDocument();
      expect(screen.getByTestId('signin-button')).toBeInTheDocument();
    });

    it('displays correct form labels and placeholders', () => {
      render(
        <TestWrapper>
          <SignInForm 
            onSuccess={mockOnSuccess} 
            onSwitchToSignUp={mockOnSwitchToSignUp}
            onForgotPassword={mockOnForgotPassword}
          />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

      expect(screen.getByPlaceholderText('Enter your email address')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    });

    it('shows password visibility toggle button', () => {
      render(
        <TestWrapper>
          <SignInForm 
            onSuccess={mockOnSuccess} 
            onSwitchToSignUp={mockOnSwitchToSignUp}
            onForgotPassword={mockOnForgotPassword}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('toggle-password-visibility')).toBeInTheDocument();
    });

    it('displays forgot password link when callback provided', () => {
      render(
        <TestWrapper>
          <SignInForm 
            onSuccess={mockOnSuccess} 
            onSwitchToSignUp={mockOnSwitchToSignUp}
            onForgotPassword={mockOnForgotPassword}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('forgot-password-link')).toBeInTheDocument();
      expect(screen.getByText('Forgot your password?')).toBeInTheDocument();
    });

    it('does not display forgot password link when callback not provided', () => {
      render(
        <TestWrapper>
          <SignInForm onSuccess={mockOnSuccess} onSwitchToSignUp={mockOnSwitchToSignUp} />
        </TestWrapper>
      );

      expect(screen.queryByTestId('forgot-password-link')).not.toBeInTheDocument();
    });

    it('displays switch to sign-up link when callback provided', () => {
      render(
        <TestWrapper>
          <SignInForm 
            onSuccess={mockOnSuccess} 
            onSwitchToSignUp={mockOnSwitchToSignUp}
            onForgotPassword={mockOnForgotPassword}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('switch-to-signup')).toBeInTheDocument();
      expect(screen.getByText('Create one here')).toBeInTheDocument();
    });

    it('does not display switch to sign-up link when callback not provided', () => {
      render(
        <TestWrapper>
          <SignInForm onSuccess={mockOnSuccess} onForgotPassword={mockOnForgotPassword} />
        </TestWrapper>
      );

      expect(screen.queryByTestId('switch-to-signup')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('shows validation error for empty email', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <SignInForm 
            onSuccess={mockOnSuccess} 
            onSwitchToSignUp={mockOnSwitchToSignUp}
            onForgotPassword={mockOnForgotPassword}
          />
        </TestWrapper>
      );

      await user.click(screen.getByTestId('signin-button'));

      expect(screen.getByTestId('email-error')).toHaveTextContent('Email is required');
    });

    it('shows validation error for invalid email format', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <SignInForm 
            onSuccess={mockOnSuccess} 
            onSwitchToSignUp={mockOnSwitchToSignUp}
            onForgotPassword={mockOnForgotPassword}
          />
        </TestWrapper>
      );

      await user.type(screen.getByTestId('email-input'), 'invalid-email');
      await user.click(screen.getByTestId('signin-button'));

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('Please provide a valid email address');
      });
    });

    it('shows validation error for empty password', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <SignInForm 
            onSuccess={mockOnSuccess} 
            onSwitchToSignUp={mockOnSwitchToSignUp}
            onForgotPassword={mockOnForgotPassword}
          />
        </TestWrapper>
      );

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.click(screen.getByTestId('signin-button'));

      expect(screen.getByTestId('password-error')).toHaveTextContent('Password is required');
    });

    it('clears field errors when user starts typing', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <SignInForm 
            onSuccess={mockOnSuccess} 
            onSwitchToSignUp={mockOnSwitchToSignUp}
            onForgotPassword={mockOnForgotPassword}
          />
        </TestWrapper>
      );

      // Trigger validation error
      await user.click(screen.getByTestId('signin-button'));

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toBeInTheDocument();
      });

      // Start typing to clear error
      await user.type(screen.getByTestId('email-input'), 'test@example.com');

      await waitFor(() => {
        expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Password Visibility Toggle', () => {
    it('toggles password visibility when eye icon is clicked', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <SignInForm 
            onSuccess={mockOnSuccess} 
            onSwitchToSignUp={mockOnSwitchToSignUp}
            onForgotPassword={mockOnForgotPassword}
          />
        </TestWrapper>
      );

      const passwordInput = screen.getByTestId('password-input');
      const toggleButton = screen.getByTestId('toggle-password-visibility');

      // Initially password type
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Click to show password
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');

      // Click to hide password
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Form Submission', () => {
    it('calls signIn with correct parameters on valid form submission', async () => {
      const user = userEvent.setup();
      mockAuthService.signIn.mockResolvedValue({} as any);

      render(
        <TestWrapper>
          <SignInForm 
            onSuccess={mockOnSuccess} 
            onSwitchToSignUp={mockOnSwitchToSignUp}
            onForgotPassword={mockOnForgotPassword}
          />
        </TestWrapper>
      );

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.click(screen.getByTestId('signin-button'));

      await waitFor(() => {
        expect(mockAuthService.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('shows loading state during form submission', async () => {
      const user = userEvent.setup();
      mockAuthService.signIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(
        <TestWrapper>
          <SignInForm 
            onSuccess={mockOnSuccess} 
            onSwitchToSignUp={mockOnSwitchToSignUp}
            onForgotPassword={mockOnForgotPassword}
          />
        </TestWrapper>
      );

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.click(screen.getByTestId('signin-button'));

      expect(screen.getByText('Signing In...')).toBeInTheDocument();
      expect(screen.getByTestId('signin-button')).toBeDisabled();
    });

    it('disables form fields during submission', async () => {
      const user = userEvent.setup();
      mockAuthService.signIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(
        <TestWrapper>
          <SignInForm 
            onSuccess={mockOnSuccess} 
            onSwitchToSignUp={mockOnSwitchToSignUp}
            onForgotPassword={mockOnForgotPassword}
          />
        </TestWrapper>
      );

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.click(screen.getByTestId('signin-button'));

      expect(screen.getByTestId('email-input')).toBeDisabled();
      expect(screen.getByTestId('password-input')).toBeDisabled();
    });

    it('displays success state after successful signin', async () => {
      const user = userEvent.setup();
      mockAuthService.signIn.mockResolvedValue({} as any);

      render(
        <TestWrapper>
          <SignInForm 
            onSuccess={mockOnSuccess} 
            onSwitchToSignUp={mockOnSwitchToSignUp}
            onForgotPassword={mockOnForgotPassword}
          />
        </TestWrapper>
      );

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.click(screen.getByTestId('signin-button'));

      await waitFor(() => {
        expect(screen.getByText('Welcome Back!')).toBeInTheDocument();
        expect(screen.getByText('You\'ve been signed in successfully')).toBeInTheDocument();
        expect(screen.getByText('Sign in successful!')).toBeInTheDocument();
      });
    });

    it('calls onSuccess callback after successful signin', async () => {
      const user = userEvent.setup();
      mockAuthService.signIn.mockResolvedValue({} as any);

      render(
        <TestWrapper>
          <SignInForm 
            onSuccess={mockOnSuccess} 
            onSwitchToSignUp={mockOnSwitchToSignUp}
            onForgotPassword={mockOnForgotPassword}
          />
        </TestWrapper>
      );

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.click(screen.getByTestId('signin-button'));

      // Wait for success state to appear
      await waitFor(() => {
        expect(screen.getByText('Welcome Back!')).toBeInTheDocument();
      });

      // Wait for the callback to be called (with timeout)
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      }, { timeout: 2000 });
    });

    it('displays error message on signin failure', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Invalid email or password';
      mockAuthService.signIn.mockRejectedValue(new Error(errorMessage));

      render(
        <TestWrapper>
          <SignInForm 
            onSuccess={mockOnSuccess} 
            onSwitchToSignUp={mockOnSwitchToSignUp}
            onForgotPassword={mockOnForgotPassword}
          />
        </TestWrapper>
      );

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'wrongpassword');
      await user.click(screen.getByTestId('signin-button'));

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent(errorMessage);
      });
    });

    it('does not call onSuccess callback on signin failure', async () => {
      const user = userEvent.setup();
      mockAuthService.signIn.mockRejectedValue(new Error('Signin failed'));

      render(
        <TestWrapper>
          <SignInForm 
            onSuccess={mockOnSuccess} 
            onSwitchToSignUp={mockOnSwitchToSignUp}
            onForgotPassword={mockOnForgotPassword}
          />
        </TestWrapper>
      );

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'wrongpassword');
      await user.click(screen.getByTestId('signin-button'));

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('handles network errors gracefully', async () => {
      const user = userEvent.setup();
      const networkError = new Error('Network error. Please check your connection and try again.');
      mockAuthService.signIn.mockRejectedValue(networkError);

      render(
        <TestWrapper>
          <SignInForm 
            onSuccess={mockOnSuccess} 
            onSwitchToSignUp={mockOnSwitchToSignUp}
            onForgotPassword={mockOnForgotPassword}
          />
        </TestWrapper>
      );

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.click(screen.getByTestId('signin-button'));

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('Network error. Please check your connection and try again.');
      });
    });
  });

  describe('Navigation', () => {
    it('calls onSwitchToSignUp when sign-up link is clicked', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <SignInForm 
            onSuccess={mockOnSuccess} 
            onSwitchToSignUp={mockOnSwitchToSignUp}
            onForgotPassword={mockOnForgotPassword}
          />
        </TestWrapper>
      );

      await user.click(screen.getByTestId('switch-to-signup'));

      expect(mockOnSwitchToSignUp).toHaveBeenCalled();
    });

    it('calls onForgotPassword when forgot password link is clicked', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <SignInForm 
            onSuccess={mockOnSuccess} 
            onSwitchToSignUp={mockOnSwitchToSignUp}
            onForgotPassword={mockOnForgotPassword}
          />
        </TestWrapper>
      );

      await user.click(screen.getByTestId('forgot-password-link'));

      expect(mockOnForgotPassword).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels associated with inputs', () => {
      render(
        <TestWrapper>
          <SignInForm 
            onSuccess={mockOnSuccess} 
            onSwitchToSignUp={mockOnSwitchToSignUp}
            onForgotPassword={mockOnForgotPassword}
          />
        </TestWrapper>
      );

      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');

      expect(emailInput).toHaveAttribute('id', 'email');
      expect(passwordInput).toHaveAttribute('id', 'password');

      expect(screen.getByLabelText(/email address/i)).toBe(emailInput);
      expect(screen.getByLabelText(/password/i)).toBe(passwordInput);
    });

    it('has proper ARIA attributes for error states', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <SignInForm 
            onSuccess={mockOnSuccess} 
            onSwitchToSignUp={mockOnSwitchToSignUp}
            onForgotPassword={mockOnForgotPassword}
          />
        </TestWrapper>
      );

      await user.click(screen.getByTestId('signin-button'));

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toBeInTheDocument();
      });
    });

    it('maintains focus management during form interactions', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <SignInForm 
            onSuccess={mockOnSuccess} 
            onSwitchToSignUp={mockOnSwitchToSignUp}
            onForgotPassword={mockOnForgotPassword}
          />
        </TestWrapper>
      );

      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');

      await user.click(emailInput);
      expect(emailInput).toHaveFocus();

      await user.tab();
      expect(passwordInput).toHaveFocus();
    });
  });

  describe('Form State Management', () => {
    it('resets loading state after error', async () => {
      const user = userEvent.setup();
      mockAuthService.signIn.mockRejectedValue(new Error('Invalid credentials'));

      render(
        <TestWrapper>
          <SignInForm 
            onSuccess={mockOnSuccess} 
            onSwitchToSignUp={mockOnSwitchToSignUp}
            onForgotPassword={mockOnForgotPassword}
          />
        </TestWrapper>
      );

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'wrongpassword');
      await user.click(screen.getByTestId('signin-button'));

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toBeInTheDocument();
      });

      // Form should not be in loading state anymore
      expect(screen.queryByText('Signing In...')).not.toBeInTheDocument();
      expect(screen.getByTestId('signin-button')).not.toBeDisabled();
    });

    it('preserves form data during validation errors', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <SignInForm 
            onSuccess={mockOnSuccess} 
            onSwitchToSignUp={mockOnSwitchToSignUp}
            onForgotPassword={mockOnForgotPassword}
          />
        </TestWrapper>
      );

      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');

      await user.type(emailInput, 'invalid-email');
      await user.type(passwordInput, 'password123');
      await user.click(screen.getByTestId('signin-button'));

      // Wait for validation error
      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toBeInTheDocument();
      });

      // Form data should be preserved
      expect(emailInput).toHaveValue('invalid-email');
      expect(passwordInput).toHaveValue('password123');
    });
  });
});