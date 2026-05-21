import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorMessage from '../ErrorMessage';

describe('ErrorMessage', () => {
  describe('happy path', () => {
    // Protects against silent failures where users see no explanation.
    it('should render the message prop text in the component', () => {
      render(<ErrorMessage message="We could not load your orders." />);
      expect(screen.getByText('We could not load your orders.')).toBeInTheDocument();
    });

    // Protects against missing recovery actions after API errors.
    it('should render Try again and call onRetry when the button is clicked', async () => {
      const user = userEvent.setup();
      const onRetry = jest.fn();
      render(<ErrorMessage message="Network error" onRetry={onRetry} />);
      await user.click(screen.getByRole('button', { name: 'Try again' }));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    // Protects against showing a retry action when no handler exists.
    it('should not render a retry button when onRetry is not provided', () => {
      render(<ErrorMessage message="Something failed" />);
      expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
    });
  });
});
