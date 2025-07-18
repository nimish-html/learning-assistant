import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthErrorBoundary } from '@/components/AuthErrorBoundary';

// Mock component that throws an error
const ThrowAuthError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Authentication failed');
  }
  return <div>Auth component working</div>;
};

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;

describe('AuthErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error for these tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <AuthErrorBoundary>
        <ThrowAuthError shouldThrow={false} />
      </AuthErrorBoundary>
    );

    expect(screen.getByText('Auth component working')).toBeInTheDocument();
  });

  it('renders authentication-specific error UI when there is an error', () => {
    render(
      <AuthErrorBoundary>
        <ThrowAuthError shouldThrow={true} />
      </AuthErrorBoundary>
    );

    expect(screen.getByText('Authentication Error')).toBeInTheDocument();
    expect(screen.getByText('Unable to process authentication')).toBeInTheDocument();
    expect(screen.getByText('We encountered an issue with the authentication system. This might be a temporary problem.')).toBeInTheDocument();
    expect(screen.getByTestId('auth-retry-button')).toBeInTheDocument();
    expect(screen.getByTestId('refresh-page-button')).toBeInTheDocument();
  });

  it('shows helpful troubleshooting steps', () => {
    render(
      <AuthErrorBoundary>
        <ThrowAuthError shouldThrow={true} />
      </AuthErrorBoundary>
    );

    expect(screen.getByText('What you can try:')).toBeInTheDocument();
    expect(screen.getByText('Refresh the page and try again')).toBeInTheDocument();
    expect(screen.getByText('Check your internet connection')).toBeInTheDocument();
    expect(screen.getByText('Clear your browser cache and cookies')).toBeInTheDocument();
    expect(screen.getByText('Try again in a few minutes')).toBeInTheDocument();
  });

  it('shows error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <AuthErrorBoundary>
        <ThrowAuthError shouldThrow={true} />
      </AuthErrorBoundary>
    );

    expect(screen.getByText('Error Details (Development)')).toBeInTheDocument();
    expect(screen.getByText('Authentication failed')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('hides error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(
      <AuthErrorBoundary>
        <ThrowAuthError shouldThrow={true} />
      </AuthErrorBoundary>
    );

    expect(screen.queryByText('Error Details (Development)')).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('calls onError callback when error occurs', () => {
    const onError = jest.fn();

    render(
      <AuthErrorBoundary onError={onError}>
        <ThrowAuthError shouldThrow={true} />
      </AuthErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Authentication failed',
      }),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('calls onRetry callback when retry button is clicked', () => {
    const onRetry = jest.fn();

    render(
      <AuthErrorBoundary onRetry={onRetry}>
        <ThrowAuthError shouldThrow={true} />
      </AuthErrorBoundary>
    );

    fireEvent.click(screen.getByTestId('auth-retry-button'));

    expect(onRetry).toHaveBeenCalled();
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div data-testid="custom-auth-fallback">Custom auth error UI</div>;

    render(
      <AuthErrorBoundary fallback={customFallback}>
        <ThrowAuthError shouldThrow={true} />
      </AuthErrorBoundary>
    );

    expect(screen.getByTestId('custom-auth-fallback')).toBeInTheDocument();
    expect(screen.getByText('Custom auth error UI')).toBeInTheDocument();
    expect(screen.queryByText('Authentication Error')).not.toBeInTheDocument();
  });

  it('renders retry button that can be clicked', () => {
    render(
      <AuthErrorBoundary>
        <ThrowAuthError shouldThrow={true} />
      </AuthErrorBoundary>
    );

    expect(screen.getByText('Authentication Error')).toBeInTheDocument();

    const retryButton = screen.getByTestId('auth-retry-button');
    expect(retryButton).toBeInTheDocument();
    
    // Test that button is clickable (doesn't throw error)
    fireEvent.click(retryButton);
  });

  it('renders refresh page button that can be clicked', () => {
    render(
      <AuthErrorBoundary>
        <ThrowAuthError shouldThrow={true} />
      </AuthErrorBoundary>
    );

    const refreshButton = screen.getByTestId('refresh-page-button');
    expect(refreshButton).toBeInTheDocument();
    
    // Test that button is clickable (doesn't throw error)
    fireEvent.click(refreshButton);
  });

  it('logs authentication error information to console', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <AuthErrorBoundary>
        <ThrowAuthError shouldThrow={true} />
      </AuthErrorBoundary>
    );

    // Verify that console.error was called to log the authentication error
    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy.mock.calls.length).toBeGreaterThan(0);
  });
});