import React from 'react';
import renderer from 'react-test-renderer';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../screens/LoginScreen';
import { VaultContext } from '../context/VaultContext';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from '../utils/crypto';

// Mock modules
jest.mock('expo-secure-store');
jest.mock('../utils/crypto');
jest.spyOn(Alert, 'alert');

// Mock the navigation prop
const mockNavigation = {
  navigate: jest.fn(),
  replace: jest.fn(),
};

// Mock the VaultContext
const mockSetVaultKey = jest.fn();

const TestComponent = (
  <VaultContext.Provider value={{ setVaultKey: mockSetVaultKey }}>
    <LoginScreen navigation={mockNavigation} />
  </VaultContext.Provider>
);

describe('<LoginScreen />', () => {
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
    it('renders all input fields and the login button', () => {
      const { getByPlaceholderText, getByText } = render(TestComponent);
      expect(getByPlaceholderText('Username')).toBeTruthy();
      expect(getByPlaceholderText('Login Password')).toBeTruthy();
      expect(getByPlaceholderText('Master Password')).toBeTruthy();
      expect(getByText('Login')).toBeTruthy();
    });

    it('allows typing in input fields', () => {
      const { getByPlaceholderText } = render(TestComponent);
      const usernameInput = getByPlaceholderText('Username');
      fireEvent.changeText(usernameInput, 'testuser');
      expect(usernameInput.props.value).toBe('testuser');
    });

    it('shows an alert if fields are empty on login attempt', () => {
      const { getByText } = render(TestComponent);
      fireEvent.press(getByText('Login'));
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill in all fields.');
    });
  });

  // --- Login Logic tests ---
  describe('Login Logic', () => {
    const fillAndSubmitForm = (getByPlaceholderText, getByText) => {
        fireEvent.changeText(getByPlaceholderText('Username'), 'testuser');
        fireEvent.changeText(getByPlaceholderText('Login Password'), 'password123');
        fireEvent.changeText(getByPlaceholderText('Master Password'), 'masterpass');
        fireEvent.press(getByText('Login'));
    };

    it('handles successful login', async () => {
        // Mock API and crypto responses
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                token: 'fake-token',
                encryptedVaultKey: 'encrypted-key',
                masterPasswordSalt: 'salt',
            }),
        });
        Crypto.deriveKeyFromPassword.mockResolvedValue('derived-key');
        Crypto.decryptData.mockReturnValue('decrypted-vault-key');

        const { getByPlaceholderText, getByText } = render(TestComponent);
        fillAndSubmitForm(getByPlaceholderText, getByText);

        await waitFor(() => {
            expect(SecureStore.setItemAsync).toHaveBeenCalledWith('token', 'fake-token');
            expect(mockSetVaultKey).toHaveBeenCalledWith('decrypted-vault-key');
            expect(mockNavigation.replace).toHaveBeenCalledWith('MainApp');
        });
    });

    it('handles failed login from server', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            json: () => Promise.resolve({ error: 'Invalid credentials.' }),
        });

        const { getByPlaceholderText, getByText } = render(TestComponent);
        fillAndSubmitForm(getByPlaceholderText, getByText);

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Login Failed', 'Invalid credentials.');
        });
    });

    it('handles navigation to 2FA screen', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                twoFactorRequired: true,
                tempToken: 'temp-2fa-token',
                encryptedVaultKey: 'encrypted-key',
                masterPasswordSalt: 'salt',
            }),
        });

        const { getByPlaceholderText, getByText } = render(TestComponent);
        fillAndSubmitForm(getByPlaceholderText, getByText);

        await waitFor(() => {
            expect(mockNavigation.navigate).toHaveBeenCalledWith('TwoFALogin', {
                tempToken: 'temp-2fa-token',
                masterPassword: 'masterpass',
                encryptedVaultKey: 'encrypted-key',
                masterPasswordSalt: 'salt'
            });
        });
    });
  });
});
