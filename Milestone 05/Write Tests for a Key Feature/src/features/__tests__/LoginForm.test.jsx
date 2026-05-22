import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginForm from '../LoginForm';
import { loginUser } from '../../api/auth';

jest.mock('../../api/auth');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

function renderLoginForm() {
  return render(
    <MemoryRouter>
      <LoginForm />
    </MemoryRouter>
  );
}

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('happy path', () => {
    // Protects against a broken login screen layout blocking sign-in.
    it('should render email input, password input, and submit button', () => {
      renderLoginForm();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    });

    // Protects against credentials not being sent to the auth API after submit.
    it('should call loginUser with email and password when valid credentials are submitted', async () => {
      const user = userEvent.setup();
      loginUser.mockResolvedValue({ user: { email: 'user@test.com' } });
      renderLoginForm();

      await user.type(screen.getByLabelText('Email'), 'user@test.com');
      await user.type(screen.getByLabelText('Password'), 'secret123');
      await user.click(screen.getByRole('button', { name: 'Sign In' }));

      await waitFor(() => {
        expect(loginUser).toHaveBeenCalledWith({
          email: 'user@test.com',
          password: 'secret123',
        });
      });
    });
  });

  describe('failure cases', () => {
    // Protects against failed logins that leave users with no feedback.
    it('should show the API error message when loginUser rejects', async () => {
      const user = userEvent.setup();
      loginUser.mockRejectedValue(new Error('Invalid credentials'));
      renderLoginForm();

      await user.type(screen.getByLabelText('Email'), 'user@test.com');
      await user.type(screen.getByLabelText('Password'), 'wrong');
      await user.click(screen.getByRole('button', { name: 'Sign In' }));

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });

    // Protects against double-submit while an auth request is in flight.
    it('should show loading state on the submit button while loginUser is pending', async () => {
      const user = userEvent.setup();
      let resolveLogin;
      loginUser.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveLogin = () => resolve({ user: { email: 'user@test.com' } });
          })
      );
      renderLoginForm();

      await user.type(screen.getByLabelText('Email'), 'user@test.com');
      await user.type(screen.getByLabelText('Password'), 'secret123');
      await user.click(screen.getByRole('button', { name: 'Sign In' }));

      expect(screen.getByRole('button', { name: 'Loading...' })).toBeDisabled();

      resolveLogin();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
      });
    });
  });

  describe('edge cases', () => {
    // Protects against pointless API calls when required fields are empty.
    it('should not call loginUser when submit is clicked with empty fields', async () => {
      const user = userEvent.setup();
      renderLoginForm();
      await user.click(screen.getByRole('button', { name: 'Sign In' }));
      expect(loginUser).not.toHaveBeenCalled();
    });
  });
});
