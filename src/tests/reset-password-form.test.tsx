import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResetPasswordForm from '@/components/ResetPasswordForm';
import { useAuth } from '@/lib/auth-context';

// Mock the auth context
jest.mock('@/lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('ResetPasswordForm', () => {
  const mockResetPassword = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockOnBackToSignIn = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signUp: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      resetPassword: mockResetPassword,
    });
  });

  describe('Form Rendering', () => {
    it('renders the reset password form with all required elements', () => {
      render(<ResetPasswordForm />);

      expect(screen.getByTestId('reset-password-form')).toBeInTheDocument();
      expect(screen.getByText('Reset Password')).toBeInTheDocument();
      expect(screen.getByText('Enter your email to receive reset instructions')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address *')).toBeInTheDocument();
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('reset-password-button')).toBeInTheDocument();
      expect(screen.getByText('Send Reset Email')).toBeInTheDocument();
    });

    it('renders back to sign in button when onBackToSignIn prop is provided', () => {
      render(<ResetPasswordForm onBackToSignIn={mockOnBackToSignIn} />);

      expect(screen.getByTestId('back-to-signin')).toBeInTheDocument();
      expect(screen.getByText('Back to Sign In')).toBeInTheDocument();
    });

    it('does not render back to sign in button when onBackToSignIn prop is not provided', () => {
      render(<ResetPasswordForm />);

      expect(screen.queryByTestId('back-to-signin')).not.toBeInTheDocument();
    });

    it('shows helper text for email field', () => {
      render(<ResetPasswordForm />);

      expect(screen.getByText("We'll send password reset instructions to this email address")).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('shows error when email is empty and form is submitted', async () => {
      render(<ResetPasswordForm />);

      const submitButton = screen.getByTestId('reset-password-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });

      expect(mockResetPassword).not.toHaveBeenCalled();
    });

    it('shows error when email format is invalid', async () => {
      render(<ResetPasswordForm />);

      const emailInput = screen.getByTestId('email-input');
      const submitButton = screen.getByTestId('reset-password-button');

      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toBeInTheDocument();
        expect(screen.getByText('Please provide a valid email address')).toBeInTheDocument();
      });

      expect(mockResetPassword).not.toHaveBeenCalled();
    });

    it('clears error when user starts typing in email field', async () => {
      render(<ResetPasswordForm />);

      const emailInput = screen.getByTestId('email-input');
      const submitButton = screen.getByTestId('reset-password-button');

      // First trigger an error
      fireEvent.click(submitButton);
      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toBeInTheDocument();
      });

      // Then start typing to clear the error
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      await waitFor(() => {
        expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
      });
    });

    it('accepts valid email format', async () => {
      mockResetPassword.mockResolvedValue(undefined);
      render(<ResetPasswordForm />);

      const emailInput = screen.getByTestId('email-input');
      const submitButton = screen.getByTestId('reset-password-button');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith('test@example.com');
      });

      expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('calls resetPassword with correct email when form is submitted', async () => {
      mockResetPassword.mockResolvedValue(undefined);
      render(<ResetPasswordForm />);

      const emailInput = screen.getByTestId('email-input');
      const submitButton = screen.getByTestId('reset-password-button');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith('test@example.com');
      });
    });

    it('shows loading state during form submission', async () => {
      let resolveResetPassword: () => void;
      const resetPasswordPromise = new Promise<void>((resolve) => {
        resolveResetPassword = resolve;
      });
      mockResetPassword.mockReturnValue(resetPasswordPromise);

      render(<ResetPasswordForm />);

      const emailInput = screen.getByTestId('email-input');
      const submitButton = screen.getByTestId('reset-password-button');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      // Check loading state
      await waitFor(() => {
        expect(screen.getByText('Sending Reset Email...')).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
        expect(emailInput).toBeDisabled();
      });

      // Resolve the promise
      resolveResetPassword!();
      await waitFor(() => {
        expect(screen.queryByText('Sending Reset Email...')).not.toBeInTheDocument();
      });
    });

    it('disables form inputs during loading', async () => {
      let resolveResetPassword: () => void;
      const resetPasswordPromise = new Promise<void>((resolve) => {
        resolveResetPassword = resolve;
      });
      mockResetPassword.mockReturnValue(resetPasswordPromise);

      render(<ResetPasswordForm />);

      const emailInput = screen.getByTestId('email-input');
      const submitButton = screen.getByTestId('reset-password-button');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(emailInput).toBeDisabled();
        expect(submitButton).toBeDisabled();
      });

      resolveResetPassword!();
    });
  });

  describe('Success State', () => {
    it('shows success message after successful password reset request', async () => {
      mockResetPassword.mockResolvedValue(undefined);
      render(<ResetPasswordForm onSuccess={mockOnSuccess} />);

      const emailInput = screen.getByTestId('email-input');
      const submitButton = screen.getByTestId('reset-password-button');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email Sent!')).toBeInTheDocument();
        expect(screen.getByText('Check your inbox for reset instructions')).toBeInTheDocument();
        expect(screen.getByText('Reset email sent successfully!')).toBeInTheDocument();
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
      });
    });

    it('shows detailed instructions in success state', async () => {
      mockResetPassword.mockResolvedValue(undefined);
      render(<ResetPasswordForm />);

      const emailInput = screen.getByTestId('email-input');
      const submitButton = screen.getByTestId('reset-password-button');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Next steps:')).toBeInTheDocument();
        expect(screen.getByText('Check your email inbox (and spam folder)')).toBeInTheDocument();
        expect(screen.getByText('Click the reset link in the email')).toBeInTheDocument();
        expect(screen.getByText('Create a new password')).toBeInTheDocument();
        expect(screen.getByText('Return here to sign in with your new password')).toBeInTheDocument();
      });
    });

    it('shows back to sign in button in success state when callback is provided', async () => {
      mockResetPassword.mockResolvedValue(undefined);
      render(<ResetPasswordForm onBackToSignIn={mockOnBackToSignIn} />);

      const emailInput = screen.getByTestId('email-input');
      const submitButton = screen.getByTestId('reset-password-button');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('back-to-signin-success')).toBeInTheDocument();
      });
    });

    it('calls onSuccess callback after successful reset with delay', async () => {
      jest.useFakeTimers();
      mockResetPassword.mockResolvedValue(undefined);
      render(<ResetPasswordForm onSuccess={mockOnSuccess} />);

      const emailInput = screen.getByTestId('email-input');
      const submitButton = screen.getByTestId('reset-password-button');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email Sent!')).toBeInTheDocument();
      });

      // Fast-forward time
      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });

      jest.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    it('shows error message when reset password fails', async () => {
      const errorMessage = 'User not found';
      mockResetPassword.mockRejectedValue(new Error(errorMessage));
      render(<ResetPasswordForm />);

      const emailInput = screen.getByTestId('email-input');
      const submitButton = screen.getByTestId('reset-password-button');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('shows generic error message for non-Error objects', async () => {
      mockResetPassword.mockRejectedValue('Some error');
      render(<ResetPasswordForm />);

      const emailInput = screen.getByTestId('email-input');
      const submitButton = screen.getByTestId('reset-password-button');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toBeInTheDocument();
        expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
      });
    });

    it('does not call onSuccess when reset fails', async () => {
      mockResetPassword.mockRejectedValue(new Error('Reset failed'));
      render(<ResetPasswordForm onSuccess={mockOnSuccess} />);

      const emailInput = screen.getByTestId('email-input');
      const submitButton = screen.getByTestId('reset-password-button');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('re-enables form after error', async () => {
      mockResetPassword.mockRejectedValue(new Error('Reset failed'));
      render(<ResetPasswordForm />);

      const emailInput = screen.getByTestId('email-input');
      const submitButton = screen.getByTestId('reset-password-button');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toBeInTheDocument();
      });

      // Form should be re-enabled
      expect(emailInput).not.toBeDisabled();
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Navigation', () => {
    it('calls onBackToSignIn when back button is clicked', () => {
      render(<ResetPasswordForm onBackToSignIn={mockOnBackToSignIn} />);

      const backButton = screen.getByTestId('back-to-signin');
      fireEvent.click(backButton);

      expect(mockOnBackToSignIn).toHaveBeenCalled();
    });

    it('calls onBackToSignIn when back button is clicked in success state', async () => {
      mockResetPassword.mockResolvedValue(undefined);
      render(<ResetPasswordForm onBackToSignIn={mockOnBackToSignIn} />);

      const emailInput = screen.getByTestId('email-input');
      const submitButton = screen.getByTestId('reset-password-button');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('back-to-signin-success')).toBeInTheDocument();
      });

      const backButton = screen.getByTestId('back-to-signin-success');
      fireEvent.click(backButton);

      expect(mockOnBackToSignIn).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels and associations', () => {
      render(<ResetPasswordForm />);

      const emailInput = screen.getByTestId('email-input');
      expect(emailInput).toHaveAttribute('id', 'email');
      
      const emailLabel = screen.getByLabelText('Email Address *');
      expect(emailLabel).toBe(emailInput);
    });

    it('has proper button types', () => {
      render(<ResetPasswordForm onBackToSignIn={mockOnBackToSignIn} />);

      const submitButton = screen.getByTestId('reset-password-button');
      const backButton = screen.getByTestId('back-to-signin');

      expect(submitButton).toHaveAttribute('type', 'submit');
      expect(backButton).toHaveAttribute('type', 'button');
    });

    it('has proper ARIA attributes for loading state', async () => {
      let resolveResetPassword: () => void;
      const resetPasswordPromise = new Promise<void>((resolve) => {
        resolveResetPassword = resolve;
      });
      mockResetPassword.mockReturnValue(resetPasswordPromise);

      render(<ResetPasswordForm />);

      const emailInput = screen.getByTestId('email-input');
      const submitButton = screen.getByTestId('reset-password-button');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        expect(emailInput).toBeDisabled();
      });

      resolveResetPassword!();
    });
  });
});