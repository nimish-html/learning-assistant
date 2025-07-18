'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook to detect network status
 * 
 * Returns the current online/offline status and provides
 * real-time updates when the network status changes.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // Set initial status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // Track if we were previously offline for reconnection notifications
      if (!navigator.onLine) {
        setWasOffline(true);
        // Reset the flag after a short delay
        setTimeout(() => setWasOffline(false), 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, wasOffline };
}

/**
 * Network status context for sharing network state across components
 */
import { createContext, useContext, ReactNode } from 'react';

interface NetworkStatusContextType {
  isOnline: boolean;
  wasOffline: boolean;
}

const NetworkStatusContext = createContext<NetworkStatusContextType | undefined>(undefined);

export function useNetworkStatusContext(): NetworkStatusContextType {
  const context = useContext(NetworkStatusContext);
  if (context === undefined) {
    throw new Error('useNetworkStatusContext must be used within a NetworkStatusProvider');
  }
  return context;
}

interface NetworkStatusProviderProps {
  children: ReactNode;
}

export function NetworkStatusProvider({ children }: NetworkStatusProviderProps) {
  const networkStatus = useNetworkStatus();

  return (
    <NetworkStatusContext.Provider value={networkStatus}>
      {children}
    </NetworkStatusContext.Provider>
  );
}