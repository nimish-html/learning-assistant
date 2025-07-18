'use client';

import React from 'react';
import { WifiOff, Wifi, AlertTriangle } from 'lucide-react';
import { useNetworkStatus } from '@/lib/network-status';

interface OfflineIndicatorProps {
  className?: string;
}

/**
 * Offline Indicator Component
 * 
 * Shows the current network status and provides visual feedback
 * when the user is offline or when connectivity is restored.
 */
export default function OfflineIndicator({ className = '' }: OfflineIndicatorProps) {
  const { isOnline, wasOffline } = useNetworkStatus();

  // Don't show anything if online and never was offline
  if (isOnline && !wasOffline) {
    return null;
  }

  // Show reconnection message briefly
  if (isOnline && wasOffline) {
    return (
      <div className={`fixed top-4 right-4 z-50 ${className}`}>
        <div className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top-2 duration-300">
          <Wifi className="w-4 h-4" />
          <span className="text-sm font-medium">Back online</span>
        </div>
      </div>
    );
  }

  // Show offline indicator
  if (!isOnline) {
    return (
      <div className={`fixed top-4 right-4 z-50 ${className}`}>
        <div className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">You're offline</span>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Network Error Banner Component
 * 
 * Shows a banner when there are network-related errors
 * with retry functionality.
 */
interface NetworkErrorBannerProps {
  show: boolean;
  message?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function NetworkErrorBanner({ 
  show, 
  message = 'Network error occurred. Please check your connection and try again.',
  onRetry,
  onDismiss 
}: NetworkErrorBannerProps) {
  const { isOnline } = useNetworkStatus();

  if (!show) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-orange-600 text-white px-4 py-3 shadow-lg">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">{message}</p>
            {!isOnline && (
              <p className="text-xs text-orange-100 mt-1">
                You appear to be offline. Some features may not work properly.
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {onRetry && isOnline && (
            <button
              onClick={onRetry}
              className="text-xs bg-orange-700 hover:bg-orange-800 px-3 py-1 rounded font-medium transition-colors"
            >
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-xs bg-orange-700 hover:bg-orange-800 px-3 py-1 rounded font-medium transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}