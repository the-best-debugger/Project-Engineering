import { render, screen, waitFor } from '@testing-library/react';
import OrdersList from '../OrdersList';
import { fetchOrders } from '../../api/orders';

jest.mock('../../api/orders');

const sampleOrders = [
  { id: 1, name: 'Wireless Keyboard', date: '2024-03-01', status: 'Delivered' },
  { id: 2, name: 'USB-C Hub', date: '2024-03-05', status: 'In Transit' },
];

describe('OrdersList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('happy path', () => {
    // Protects against orders failing to appear after a successful fetch.
    it('should render each order name when the API returns orders', async () => {
      fetchOrders.mockResolvedValue(sampleOrders);
      render(<OrdersList />);

      await waitFor(() => {
        expect(screen.getByText('Wireless Keyboard')).toBeInTheDocument();
      });
      expect(screen.getByText('USB-C Hub')).toBeInTheDocument();
    });
  });

  describe('failure cases', () => {
    // Protects against silent failures when the orders API rejects.
    it('should show the error message when fetchOrders rejects', async () => {
      fetchOrders.mockRejectedValue(new Error('Network down'));
      render(<OrdersList />);

      await waitFor(() => {
        expect(
          screen.getByText('Something went wrong loading your orders.')
        ).toBeInTheDocument();
      });
    });
  });

  describe('edge cases', () => {
    // Protects against an empty list looking like a broken page.
    it('should show empty state and no order items when the API returns an empty array', async () => {
      fetchOrders.mockResolvedValue([]);
      render(<OrdersList />);

      await waitFor(() => {
        expect(screen.getByText('No orders yet')).toBeInTheDocument();
      });
      expect(screen.queryByText('Wireless Keyboard')).not.toBeInTheDocument();
    });
  });
});
