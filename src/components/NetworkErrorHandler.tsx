'use client';

import React, { Component, ReactNode } from 'react';
import { NetworkErrorBanner } from './OfflineIndicator';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onNetworkError?: (error: Error) => void;
}

interface State {
  hasNetworkError: boolean;
  error: Error | null;
  retryCount: number;
}

/**
 * Network Error Handler Component
 * 
 * Catches network-related errors and provides retry functionality
 * with graceful degradation for offline scenarios.
 */
export class NetworkErrorHandler extends Component<Props, State> {
  private maxRetries = 3;
  private retryTimeouts: NodeJS.Timeout[] = [];

  constructor(props: Props) {
    super(props);
    this.state = {
      hasNetworkError: false,
      error: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Check if this is a network-related error
    if (NetworkErrorHandler.isNetworkError(error)) {
      return {
        hasNetworkError: true,
        error,
      };
    }
    
    // Let other error boundaries handle non-network errors
    throw error;
  }

  componentDidCatch(error: Error) {
    if (NetworkErrorHandler.isNetworkError(error)) {
      console.warn('NetworkErrorHandler caught a network error:', {
        message: error.message,
        name: error.name,
        timestamp: new Date().toISOString(),
      });

      this.props.onNetworkError?.(error);
    }
  }

  componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  static isNetworkError(error: Error): boolean {
    const networkErrorPatterns = [
      /network/i,
      /fetch/i,
      /connection/i,
      /timeout/i,
      /offline/i,
      /ERR_NETWORK/i,
      /ERR_INTERNET_DISCONNECTED/i,
      /Failed to fetch/i,
    ];

    return networkErrorPatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.name)
    );
  }

  handleRetry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      return;
    }

    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.pow(2, this.state.retryCount) * 1000;
    
    const timeout = setTimeout(() => {
      this.setState(prevState => ({
        hasNetworkError: false,
        error: null,
        retryCount: prevState.retryCount + 1,
      }));
    }, delay);

    this.retryTimeouts.push(timeout);
  };

  handleDismiss = () => {
    this.setState({
      hasNetworkError: false,
      error: null,
      retryCount: 0,
    });
  };

  render() {
    if (this.state.hasNetworkError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return (
          <>
            <NetworkErrorBanner
              show={true}
              message={this.state.error?.message || 'Network error occurred'}
              onRetry={this.state.retryCount < this.maxRetries ? this.handleRetry : undefined}
              onDismiss={this.handleDismiss}
            />
            {this.props.fallback}
          </>
        );
      }

      // Show error banner with children (graceful degradation)
      return (
        <>
          <NetworkErrorBanner
            show={true}
            message={this.state.error?.message || 'Network error occurred'}
            onRetry={this.state.retryCount < this.maxRetries ? this.handleRetry : undefined}
            onDismiss={this.handleDismiss}
          />
          {this.props.children}
        </>
      );
    }

    return this.props.children;
  }
}

export default NetworkErrorHandler;