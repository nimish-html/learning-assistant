import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useNetworkStatus, NetworkStatusProvider, useNetworkStatusContext } from '@/lib/network-status';

// Mock navigator.onLine
const mockNavigator = {
  onLine: true,
};

Object.defineProperty(window, 'navigator', {
  value: mockNavigator,
  writable: true,
});

// Mock window event listeners
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();

Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener,
  writable: true,
});

Object.defineProperty(window, 'removeEventListener', {
  value: mockRemoveEventListener,
  writable: true,
});

describe('useNetworkStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigator.onLine = true;
  });

  it('returns initial online status', () => {
    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOffline).toBe(false);
  });

  it('returns initial offline status when navigator is offline', () => {
    mockNavigator.onLine = false;

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOnline).toBe(false);
    expect(result.current.wasOffline).toBe(false);
  });

  it('sets up event listeners for online and offline events', () => {
    renderHook(() => useNetworkStatus());

    expect(mockAddEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(mockAddEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('cleans up event listeners on unmount', () => {
    const { unmount } = renderHook(() => useNetworkStatus());

    unmount();

    expect(mockRemoveEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(mockRemoveEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('updates status when going offline', () => {
    const { result } = renderHook(() => useNetworkStatus());

    // Simulate going offline
    act(() => {
      const offlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'offline'
      )[1];
      offlineHandler();
    });

    expect(result.current.isOnline).toBe(false);
  });

  it('updates status when coming back online', () => {
    const { result } = renderHook(() => useNetworkStatus());

    // First go offline
    act(() => {
      const offlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'offline'
      )[1];
      offlineHandler();
    });

    expect(result.current.isOnline).toBe(false);

    // Then come back online
    act(() => {
      const onlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'online'
      )[1];
      onlineHandler();
    });

    expect(result.current.isOnline).toBe(true);
  });
});

describe('NetworkStatusProvider', () => {
  it('provides network status to child components', () => {
    const TestComponent = () => {
      const { isOnline } = useNetworkStatusContext();
      return <div data-testid="status">{isOnline ? 'online' : 'offline'}</div>;
    };

    render(
      <NetworkStatusProvider>
        <TestComponent />
      </NetworkStatusProvider>
    );

    expect(screen.getByTestId('status')).toHaveTextContent('online');
  });

  it('throws error when used outside provider', () => {
    const TestComponent = () => {
      useNetworkStatusContext();
      return <div>test</div>;
    };

    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestComponent />)).toThrow(
      'useNetworkStatusContext must be used within a NetworkStatusProvider'
    );

    consoleSpy.mockRestore();
  });
});