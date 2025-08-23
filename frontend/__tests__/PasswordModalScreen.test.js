import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import PasswordModalScreen from '../screens/PasswordModalScreen';
import * as SecureStore from 'expo-secure-store';
import { VaultContext } from '../context/VaultContext';
import * as Crypto from '../utils/crypto';
import { Alert } from 'react-native';

// Mock dependencies
jest.mock('expo-secure-store');
jest.mock('../utils/crypto');
jest.spyOn(Alert, 'alert');
jest.spyOn(console, 'error').mockImplementation(() => {});

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

describe('<PasswordModalScreen />', () => {
  const mockVaultContext = {
    vaultKey: 'mock-vault-key',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    SecureStore.getItemAsync.mockResolvedValue('fake-token');
    Crypto.decryptData.mockImplementation((data) => `decrypted_${data}`);
    Crypto.encryptData.mockImplementation((data) => `encrypted_${data}`);
  });

  // --- RENDER TESTS ---
  describe('Rendering', () => {
    it('renders in "Add Password" mode correctly', () => {
      const mockRoute = { params: {} };
      const { getByText, queryByText } = render(
        <VaultContext.Provider value={mockVaultContext}>
          <PasswordModalScreen navigation={mockNavigation} route={mockRoute} />
        </VaultContext.Provider>
      );
      expect(getByText('Add Password')).toBeTruthy();
      expect(queryByText('Delete')).toBeNull();
      expect(queryByText('View History')).toBeNull();
    });

    it('renders in "Edit Password" mode correctly', () => {
      const mockPassword = { id: 1, site: 'google.com', username: 'test', password: 'encrypted_password', category: 'work' };
      const mockRoute = { params: { password: mockPassword } };
      const { getByText, getByDisplayValue } = render(
        <VaultContext.Provider value={mockVaultContext}>
          <PasswordModalScreen navigation={mockNavigation} route={mockRoute} />
        </VaultContext.Provider>
      );
      expect(getByText('Edit Password')).toBeTruthy();
      expect(getByText('Delete')).toBeTruthy();
      expect(getByText('View History')).toBeTruthy();
      expect(getByDisplayValue('google.com')).toBeTruthy();
      expect(getByDisplayValue('decrypted_encrypted_password')).toBeTruthy();
    });
  });

  // --- FUNCTIONALITY ---
  describe('Functionality', () => {
    it('saves a new password correctly', async () => {
        const mockRoute = { params: {} };
        global.fetch = jest.fn().mockResolvedValue({ ok: true });
        const { getByPlaceholderText, getByText } = render(
            <VaultContext.Provider value={mockVaultContext}>
                <PasswordModalScreen navigation={mockNavigation} route={mockRoute} />
            </VaultContext.Provider>
        );
        fireEvent.changeText(getByPlaceholderText('Website'), 'newsite.com');
        fireEvent.changeText(getByPlaceholderText('Username'), 'newuser');
        fireEvent.changeText(getByPlaceholderText('Password'), 'newpassword');
        fireEvent.press(getByText('Save'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/passwords', expect.any(Object));
            expect(mockNavigation.goBack).toHaveBeenCalled();
        });
    });

    it('updates an existing password correctly', async () => {
        const mockPassword = { id: 1, site: 'google.com', username: 'test', password: 'encrypted_password' };
        const mockRoute = { params: { password: mockPassword } };
        global.fetch = jest.fn().mockResolvedValue({ ok: true });
        const { getByPlaceholderText, getByText } = render(
            <VaultContext.Provider value={mockVaultContext}>
                <PasswordModalScreen navigation={mockNavigation} route={mockRoute} />
            </VaultContext.Provider>
        );
        fireEvent.changeText(getByPlaceholderText('Website'), 'updatedsite.com');
        fireEvent.press(getByText('Save'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/passwords/1', expect.any(Object));
            expect(mockNavigation.goBack).toHaveBeenCalled();
        });
    });

    it('deletes an existing password', async () => {
        const mockPassword = { id: 1, site: 'google.com', username: 'test', password: 'encrypted_password' };
        const mockRoute = { params: { password: mockPassword } };
        global.fetch = jest.fn().mockResolvedValue({ ok: true });
        const { getByText } = render(
            <VaultContext.Provider value={mockVaultContext}>
                <PasswordModalScreen navigation={mockNavigation} route={mockRoute} />
            </VaultContext.Provider>
        );
        fireEvent.press(getByText('Delete'));
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/passwords/1', expect.objectContaining({ method: 'DELETE' }));
            expect(mockNavigation.goBack).toHaveBeenCalled();
        });
    });

    it('navigates to history screen', () => {
        const mockPassword = { id: 1, site: 'google.com', username: 'test', password: 'encrypted_password' };
        const mockRoute = { params: { password: mockPassword } };
        const { getByText } = render(
            <VaultContext.Provider value={mockVaultContext}>
                <PasswordModalScreen navigation={mockNavigation} route={mockRoute} />
            </VaultContext.Provider>
        );
        fireEvent.press(getByText('View History'));
        expect(mockNavigation.navigate).toHaveBeenCalledWith('PasswordHistory', { passwordId: 1 });
    });
  });
});
