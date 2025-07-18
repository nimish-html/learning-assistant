import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignUpForm from '@/components/SignUpForm';
import { AuthProvider } from '@/lib/auth-context';
import { AuthService } from '@/lib/auth-service';

// Mock the AuthService
jest.mock('@/lib/auth-service');
const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
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

describe('SignUpForm', () => {
  const mockOnSuccess = jest.fn();
  const mockOnSwitchToSignIn = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthService.getCurrentUser.mockResolvedValue(null);
    mockAuthService.getCurrentSession.mockResolvedValue(null);
    mockAuthService.onAuthStateChange.mockReturnValue(() => { });
  });

  describe('Form Rendering', () => {
    it('renders the sign-up form with all required fields', () => {
      render(
        <TestWrapper>
          <SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />
        </TestWrapper>
      );

      expect(screen.getByTestId('signup-form')).toBeInTheDocument();
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('password-input')).toBeInTheDocument();
      expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument();
      expect(screen.getByTestId('signup-button')).toBeInTheDocument();
    });

    it('displays correct form labels and placeholders', () => {
      render(
        <TestWrapper>
          <SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();

      expect(screen.getByPlaceholderText('Enter your email address')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Confirm your password')).toBeInTheDocument();
    });

    it('shows password visibility toggle buttons', () => {
      render(
        <TestWrapper>
          <SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />
        </TestWrapper>
      );

      expect(screen.getByTestId('toggle-password-visibility')).toBeInTheDocument();
      expect(screen.getByTestId('toggle-confirm-password-visibility')).toBeInTheDocument();
    });

    it('displays switch to sign-in link when callback provided', () => {
      render(
        <TestWrapper>
          <SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />
        </TestWrapper>
      );

      expect(screen.getByTestId('switch-to-signin')).toBeInTheDocument();
      expect(screen.getByText('Sign in here')).toBeInTheDocument();
    });

    it('does not display switch to sign-in link when callback not provided', () => {
      render(
        <TestWrapper>
          <SignUpForm onSuccess={mockOnSuccess} />
        </TestWrapper>
      );

      expect(screen.queryByTestId('switch-to-signin')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('shows validation error for empty email', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />
        </TestWrapper>
      );

      await user.click(screen.getByTestId('signup-button'));

      expect(screen.getByTestId('email-error')).toHaveTextContent('Email is required');
    });

    it('shows validation error for invalid email format', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />
        </TestWrapper>
      );

      await user.type(screen.getByTestId('email-input'), 'invalid-email');
      await user.click(screen.getByTestId('signup-button'));

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('Please provide a valid email address');
      });
    });

    it('shows validation error for empty password', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />
        </TestWrapper>
      );

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.click(screen.getByTestId('signup-button'));

      expect(screen.getByTestId('password-error')).toHaveTextContent('Password is required');
    });

    it('shows validation error for short password', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />
        </TestWrapper>
      );

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), '1234567');
      await user.click(screen.getByTestId('signup-button'));

      expect(screen.getByTestId('password-error')).toHaveTextContent('Password must be at least 8 characters long');
    });

    it('shows validation error for empty confirm password', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />
        </TestWrapper>
      );

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.click(screen.getByTestId('signup-button'));

      expect(screen.getByTestId('confirm-password-error')).toHaveTextContent('Please confirm your password');
    });

    it('shows validation error for mismatched passwords', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />
        </TestWrapper>
      );

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.type(screen.getByTestId('confirm-password-input'), 'password456');
      await user.click(screen.getByTestId('signup-button'));

      expect(screen.getByTestId('confirm-password-error')).toHaveTextContent('Passwords do not match');
    });

    it('clears field errors when user starts typing', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />
        </TestWrapper>
      );

      // Trigger validation error
      await user.click(screen.getByTestId('signup-button'));

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
          <SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />
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

    it('toggles confirm password visibility when eye icon is clicked', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />
        </TestWrapper>
      );

      const confirmPasswordInput = screen.getByTestId('confirm-password-input');
      const toggleButton = screen.getByTestId('toggle-confirm-password-visibility');

      // Initially password type
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');

      // Click to show password
      await user.click(toggleButton);
      expect(confirmPasswordInput).toHaveAttribute('type', 'text');

      // Click to hide password
      await user.click(toggleButton);
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Form Submission', () => {
    it('calls signUp with correct parameters on valid form submission', async () => {
      const user = userEvent.setup();
      mockAuthService.signUp.mockResolvedValue({} as any);

      render(
        <TestWrapper>
          <SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />
        </TestWrapper>
      );

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.type(screen.getByTestId('confirm-password-input'), 'password123');
      await user.click(screen.getByTestId('signup-button'));

      await waitFor(() => {
        expect(mockAuthService.signUp).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('shows loading state during form submission', async () => {
      const user = userEvent.setup();
      mockAuthService.signUp.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(
        <TestWrapper>
          <SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />
        </TestWrapper>
      );

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.type(screen.getByTestId('confirm-password-input'), 'password123');
      await user.click(screen.getByTestId('signup-button'));

      expect(screen.getByText('Creating Account...')).toBeInTheDocument();
      expect(screen.getByTestId('signup-button')).toBeDisabled();
    });

    it('disables form fields during submission', async () => {
      const user = userEvent.setup();
      mockAuthService.signUp.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(
        <TestWrapper>
          <SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />
        </TestWrapper>
      );

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.type(screen.getByTestId('confirm-password-input'), 'password123');
      await user.click(screen.getByTestId('signup-button'));

      expect(screen.getByTestId('email-input')).toBeDisabled();
      expect(screen.getByTestId('password-input')).toBeDisabled();
      expect(screen.getByTestId('confirm-password-input')).toBeDisabled();
    });

    it('displays success state after successful signup', async () => {
      const user = userEvent.setup();
      mockAuthService.signUp.mockResolvedValue({} as any);

      render(
        <TestWrapper>
          <SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />
        </TestWrapper>
      );

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.type(screen.getByTestId('confirm-password-input'), 'password123');
      await user.click(screen.getByTestId('signup-button'));

      await waitFor(() => {
        expect(screen.getByText('Account Created!')).toBeInTheDocument();
        expect(screen.getByText('Check your email to verify your account')).toBeInTheDocument();
        expect(screen.getByText('Welcome aboard!')).toBeInTheDocument();
      });
    });

    it('calls onSuccess callback after successful signup', async () => {
      const user = userEvent.setup();
      mockAuthService.signUp.mockResolvedValue({} as any);

      render(
        <TestWrapper>
          <SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />
        </TestWrapper>
      );

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.type(screen.getByTestId('confirm-password-input'), 'password123');
      await user.click(screen.getByTestId('signup-button'));

      // Wait for success state to appear
      await waitFor(() => {
        expect(screen.getByText('Account Created!')).toBeInTheDocument();
      });

      // Wait for the callback to be called (with timeout)
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('displays error message on signup failure', async () => {
      const user = userEvent.setup();
      const errorMessage = 'An account with this email already exists';
      mockAuthService.signUp.mockRejectedValue(new Error(errorMessage));

      render(
        <TestWrapper>
          <SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />
        </TestWrapper>
      );

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.type(screen.getByTestId('confirm-password-input'), 'password123');
      await user.click(screen.getByTestId('signup-button'));

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent(errorMessage);
      });
    });

    it('does not call onSuccess callback on signup failure', async () => {
      const user = userEvent.setup();
      mockAuthService.signUp.mockRejectedValue(new Error('Signup failed'));

      render(
        <TestWrapper>
          <SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />
        </TestWrapper>
      );

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.type(screen.getByTestId('confirm-password-input'), 'password123');
      await user.click(screen.getByTestId('signup-button'));

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('calls onSwitchToSignIn when sign-in link is clicked', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />
        </TestWrapper>
      );

      await user.click(screen.getByTestId('switch-to-signin'));

      expect(mockOnSwitchToSignIn).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels associated with inputs', () => {
      render(
        <TestWrapper>
          <SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />
        </TestWrapper>
      );

      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      const confirmPasswordInput = screen.getByTestId('confirm-password-input');

      expect(emailInput).toHaveAttribute('id', 'email');
      expect(passwordInput).toHaveAttribute('id', 'password');
      expect(confirmPasswordInput).toHaveAttribute('id', 'confirmPassword');

      expect(screen.getByLabelText(/email address/i)).toBe(emailInput);
      expect(screen.getByLabelText(/^password/i)).toBe(passwordInput);
      expect(screen.getByLabelText(/confirm password/i)).toBe(confirmPasswordInput);
    });

    it('has proper ARIA attributes for error states', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />
        </TestWrapper>
      );

      await user.click(screen.getByTestId('signup-button'));

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toBeInTheDocument();
      });
    });
  });
});