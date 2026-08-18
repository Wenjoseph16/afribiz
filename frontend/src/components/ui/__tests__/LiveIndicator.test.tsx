import { render, screen } from '@testing-library/react';
import { LiveIndicator } from '../LiveIndicator';

// Mock the SocketProvider
jest.mock('@/components/SocketProvider', () => ({
  useSocket: jest.fn(),
}));

jest.mock('@/store/notificationStore', () => ({
  useNotificationStore: jest.fn(),
}));

import { useSocket } from '@/components/SocketProvider';
import { useNotificationStore } from '@/store/notificationStore';

const mockUseSocket = useSocket as jest.Mock;
const mockUseNotificationStore = useNotificationStore as unknown as jest.Mock;

describe('LiveIndicator (V1)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows "En ligne" when connected', () => {
    mockUseSocket.mockReturnValue({ isConnected: true });
    mockUseNotificationStore.mockReturnValue(0);

    render(<LiveIndicator />);
    expect(screen.getByText('En ligne')).toBeInTheDocument();
  });

  it('shows "Hors ligne" when disconnected', () => {
    mockUseSocket.mockReturnValue({ isConnected: false });
    mockUseNotificationStore.mockReturnValue(0);

    render(<LiveIndicator />);
    expect(screen.getByText('Hors ligne')).toBeInTheDocument();
  });

  it('displays unread notification count when > 0', () => {
    mockUseSocket.mockReturnValue({ isConnected: true });
    mockUseNotificationStore.mockReturnValue(5);

    render(<LiveIndicator />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('hides notification count when 0', () => {
    mockUseSocket.mockReturnValue({ isConnected: true });
    mockUseNotificationStore.mockReturnValue(0);

    render(<LiveIndicator />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});
