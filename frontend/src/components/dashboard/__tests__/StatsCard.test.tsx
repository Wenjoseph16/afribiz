import { render, screen } from '@testing-library/react';
import { StatsCard } from '../StatsCard';
import { ShoppingBag } from 'lucide-react';

describe('StatsCard — premium glass', () => {
  it('renders label and value', () => {
    render(<StatsCard icon={<ShoppingBag />} label="Commandes" value={5} />);
    expect(screen.getByText('Commandes')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders trend when provided', () => {
    render(
      <StatsCard
        icon={<ShoppingBag />}
        label="Commandes"
        value={3}
        trend={{ value: '3 en cours', positive: true }}
      />
    );
    expect(screen.getByText('3 en cours')).toBeInTheDocument();
  });

  it('renders negative trend', () => {
    render(
      <StatsCard
        icon={<ShoppingBag />}
        label="Paiements"
        value={2}
        trend={{ value: '2 en attente', positive: false }}
      />
    );
    expect(screen.getByText('2 en attente')).toBeInTheDocument();
  });

  it('renders string value', () => {
    render(<StatsCard icon={<ShoppingBag />} label="Fidélité" value="1 200" />);
    expect(screen.getByText('1 200')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = jest.fn();
    render(<StatsCard icon={<ShoppingBag />} label="Test" value={0} onClick={onClick} />);
    screen.getByRole('button').click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
