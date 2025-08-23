import React from 'react';
import renderer from 'react-test-renderer';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RegisterScreen from '../screens/RegisterScreen';
import { Alert } from 'react-native';
import * as Crypto from '../utils/crypto';

// Mock modules
jest.mock('../utils/crypto');
jest.spyOn(Alert, 'alert');

// Mock the navigation prop
const mockNavigation = {
  navigate: jest.fn(),
};

const TestComponent = <RegisterScreen navigation={mockNavigation} />;

describe('<RegisterScreen />', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  // Snapshot test
  it('renders correctly and matches snapshot', () => {
    const tree = renderer.create(TestComponent).toJSON();
    expect(tree).toMatchSnapshot();
  });

  // --- UI Interaction tests ---
  describe('UI interactions', () => {
    it('renders all input fields and the register button', () => {
      const { getByPlaceholderText, getByText } = render(TestComponent);
      expect(getByPlaceholderText('Username')).toBeTruthy();
      expect(getByPlaceholderText('Login Password (min. 8 chars)')).toBeTruthy();
      expect(getByPlaceholderText('Master Password (min. 8 chars)')).toBeTruthy();
      expect(getByText('Register')).toBeTruthy();
    });

    it('shows an alert if fields are empty on register attempt', () => {
      const { getByText } = render(TestComponent);
      fireEvent.press(getByText('Register'));
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill in all fields.');
    });

    it('shows an alert if passwords are too short', () => {
        const { getByPlaceholderText, getByText } = render(TestComponent);
        fireEvent.changeText(getByPlaceholderText('Username'), 'testuser');
        fireEvent.changeText(getByPlaceholderText('Login Password (min. 8 chars)'), 'short');
        fireEvent.changeText(getByPlaceholderText('Master Password (min. 8 chars)'), 'short');
        fireEvent.press(getByText('Register'));
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Passwords must be at least 8 characters long.');
    });
  });

  // --- Registration Logic tests ---
  describe('Registration Logic', () => {
    const fillAndSubmitForm = (getByPlaceholderText, getByText) => {
        fireEvent.changeText(getByPlaceholderText('Username'), 'testuser');
        fireEvent.changeText(getByPlaceholderText('Login Password (min. 8 chars)'), 'password123');
        fireEvent.changeText(getByPlaceholderText('Master Password (min. 8 chars)'), 'masterpass123');
        fireEvent.press(getByText('Register'));
    };

    it('handles successful registration', async () => {
        // Mock API and crypto responses
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ message: 'User registered successfully' }),
        });
        Crypto.generateRandomKey.mockResolvedValue('random-key');
        Crypto.generateSalt.mockResolvedValue('random-salt');
        Crypto.deriveKeyFromPassword.mockResolvedValue('derived-key');
        Crypto.encryptData.mockReturnValue('encrypted-key');

        const { getByPlaceholderText, getByText } = render(TestComponent);
        fillAndSubmitForm(getByPlaceholderText, getByText);

        await waitFor(() => {
            expect(fetch).toHaveBeenCalled();
            expect(Alert.alert).toHaveBeenCalledWith(
                'Registration Successful',
                'You can now log in.',
                expect.any(Array)
            );
        });
    });

    it('handles failed registration from server', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            json: () => Promise.resolve({ error: 'Username already exists.' }),
        });

        const { getByPlaceholderText, getByText } = render(TestComponent);
        fillAndSubmitForm(getByPlaceholderText, getByText);

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Registration Failed', 'Username already exists.');
        });
    });
  });
});
