import { renderHook } from '@testing-library/react';
import { useNotificationPolling } from '../useNotificationPolling';

const mockFetchUnreadCount = jest.fn();

jest.mock('@/store/notificationStore', () => ({
  useNotificationStore: jest.fn((selector: any) => {
    const state = { fetchUnreadCount: mockFetchUnreadCount, fetchNotifications: jest.fn() };
    return selector ? selector(state) : state;
  }),
}));

jest.mock('@/stores/authStore', () => ({
  useAuthStore: jest.fn((selector: any) => {
    const state = { isAuthenticated: () => true };
    return selector ? selector(state) : state;
  }),
}));

import { useAuthStore } from '@/stores/authStore';

describe('useNotificationPolling (V1)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to default authenticated state
    (useAuthStore as unknown as jest.Mock).mockImplementation((selector: any) => {
      const state = { isAuthenticated: () => true };
      return selector ? selector(state) : state;
    });
  });

  it('fetches unread count immediately on mount', () => {
    renderHook(() => useNotificationPolling());
    expect(mockFetchUnreadCount).toHaveBeenCalledTimes(1);
  });

  it('does not fetch when not authenticated', () => {
    (useAuthStore as unknown as jest.Mock).mockImplementation((selector: any) => {
      const state = { isAuthenticated: () => false };
      return selector ? selector(state) : state;
    });

    renderHook(() => useNotificationPolling());
    expect(mockFetchUnreadCount).not.toHaveBeenCalled();
  });

  it('mounts and unmounts without errors', () => {
    const { unmount } = renderHook(() => useNotificationPolling());
    expect(mockFetchUnreadCount).toHaveBeenCalledTimes(1);
    unmount();
  });
});
