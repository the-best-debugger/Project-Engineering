import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../Button';

describe('Button', () => {
  describe('happy path', () => {
  // Protects against regressions where the wrong label is shown on primary actions.
    it('should render the correct label text from the label prop', () => {
      render(<Button label="Save changes" onClick={() => {}} />);
      expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
    });

    // Protects against broken click handlers on forms and dialogs.
    it('should call onClick exactly once when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<Button label="Submit" onClick={handleClick} />);
      await user.click(screen.getByRole('button', { name: 'Submit' }));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    // Protects against double submissions while a parent marks the control disabled.
    it('should not call onClick and should be disabled when disabled is true', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<Button label="Submit" onClick={handleClick} disabled />);
      const button = screen.getByRole('button', { name: 'Submit' });
      expect(button).toBeDisabled();
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });
});
