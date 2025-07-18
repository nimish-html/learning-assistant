'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Shield, RefreshCw, LogIn } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Authentication-specific Error Boundary Component
 * 
 * Specialized error boundary for authentication-related components.
 * Provides authentication-specific fallback UI and error handling.
 */
export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log authentication errors while maintaining user privacy
    const logData = {
      message: error.message,
      // Don't log full stack trace for auth errors to protect sensitive info
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    };
    
    console.error('AuthErrorBoundary caught an authentication error:', logData);

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    // Call custom retry handler if provided
    this.props.onRetry?.();
  };

  handleRefreshPage = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default authentication-specific fallback UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white border border-orange-200 rounded-xl shadow-lg overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold">Authentication Error</h2>
                    <p className="text-white/80">Unable to process authentication</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="text-center mb-6">
                  <p className="text-gray-600 mb-4">
                    We encountered an issue with the authentication system. This might be a temporary problem.
                  </p>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-sm text-blue-800">
                    <p className="font-medium mb-1">What you can try:</p>
                    <ul className="list-disc list-inside space-y-1 text-left">
                      <li>Refresh the page and try again</li>
                      <li>Check your internet connection</li>
                      <li>Clear your browser cache and cookies</li>
                      <li>Try again in a few minutes</li>
                    </ul>
                  </div>

                  {process.env.NODE_ENV === 'development' && this.state.error && (
                    <details className="text-left bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                      <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                        Error Details (Development)
                      </summary>
                      <div className="text-sm text-gray-600">
                        <div>
                          <strong>Error:</strong> {this.state.error.message}
                        </div>
                        {this.state.error.name && (
                          <div className="mt-1">
                            <strong>Type:</strong> {this.state.error.name}
                          </div>
                        )}
                      </div>
                    </details>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={this.handleRetry}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-black text-white px-4 py-3 rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                    data-testid="auth-retry-button"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </button>
                  
                  <button
                    onClick={this.handleRefreshPage}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                    data-testid="refresh-page-button"
                  >
                    <LogIn className="w-4 h-4" />
                    Refresh Page
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary;