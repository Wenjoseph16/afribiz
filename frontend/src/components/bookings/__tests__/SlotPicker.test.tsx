import { render, screen } from '@testing-library/react';
import { SlotPicker } from '../SlotPicker';

jest.mock('@/features/hooks', () => ({
  useBookingSlots: jest.fn(),
}));

describe('SlotPicker', () => {
  const mockUseBookingSlots = require('@/features/hooks').useBookingSlots;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state', () => {
    mockUseBookingSlots.mockReturnValue({ data: null, isLoading: true });
    render(<SlotPicker selectedDate="2026-08-17" selectedTime="" onSelect={jest.fn()} />);
    expect(screen.getByText(/Chargement/)).toBeInTheDocument();
  });

  it('renders slots for Monday (dayOfWeek=1)', () => {
    mockUseBookingSlots.mockReturnValue({
      data: [
        { id: '1', dayOfWeek: 1, startTime: '09:00', endTime: '12:00', slotDuration: 60, isActive: true },
      ],
      isLoading: false,
    });
    render(<SlotPicker selectedDate="2026-08-17" selectedTime="" onSelect={jest.fn()} />);
    expect(screen.getByText('09:00')).toBeInTheDocument();
  });

  it('calls onSelect when slot is clicked', () => {
    const onSelect = jest.fn();
    mockUseBookingSlots.mockReturnValue({
      data: [
        { id: '1', dayOfWeek: 1, startTime: '09:00', endTime: '11:00', slotDuration: 60, isActive: true },
      ],
      isLoading: false,
    });
    render(<SlotPicker selectedDate="2026-08-17" selectedTime="" onSelect={onSelect} />);
    const slot = screen.getByText('09:00').closest('button');
    slot?.click();
    expect(onSelect).toHaveBeenCalledWith('09:00');
  });

  it('shows empty state when no slots for the day', () => {
    mockUseBookingSlots.mockReturnValue({
      data: [
        { id: '1', dayOfWeek: 3, startTime: '09:00', endTime: '17:00', slotDuration: 30, isActive: true },
      ],
      isLoading: false,
    });
    render(<SlotPicker selectedDate="2026-08-17" selectedTime="" onSelect={jest.fn()} />);
    expect(screen.getByText(/Aucun créneau configuré/)).toBeInTheDocument();
  });
});
