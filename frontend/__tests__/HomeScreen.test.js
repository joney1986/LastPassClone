import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import HomeScreen from '../screens/HomeScreen';
import * as SecureStore from 'expo-secure-store';
import { useIsFocused } from '@react-navigation/native';
import { VaultContext } from '../context/VaultContext';
import * as Crypto from '../utils/crypto';

// Mock dependencies
jest.mock('expo-secure-store');
jest.mock('../utils/crypto');
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useIsFocused: jest.fn(),
}));

const mockNavigation = {
  navigate: jest.fn(),
  replace: jest.fn(),
};

const mockPasswords = [
  { id: 1, site: 'google.com', username: 'user1', password: 'encrypted_pass_1', category: 'work' },
  { id: 2, site: 'github.com', username: 'user2', password: 'encrypted_pass_2', category: 'personal' },
];

describe('<HomeScreen />', () => {
  const mockVaultContext = {
    vaultKey: 'mock-vault-key',
  };

  const TestComponent = (
    <VaultContext.Provider value={mockVaultContext}>
      <HomeScreen navigation={mockNavigation} />
    </VaultContext.Provider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    useIsFocused.mockReturnValue(true);
    SecureStore.getItemAsync.mockResolvedValue('fake-token');
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockPasswords }),
    });
    Crypto.decryptData.mockImplementation((data, key) => `decrypted_${data}_with_${key}`);
  });

  it('displays the list of passwords after fetching', async () => {
    const { findByText } = render(TestComponent);
    expect(await findByText('google.com')).toBeTruthy();
    expect(await findByText('github.com')).toBeTruthy();
  });

  it('navigates to PasswordModal when a password is pressed', async () => {
    const { findByText } = render(TestComponent);
    const passwordToPress = await findByText('google.com');
    fireEvent.press(passwordToPress);

    // Assert navigation call
    expect(mockNavigation.navigate).toHaveBeenCalledWith('PasswordModal', {
        password: {
            ...mockPasswords[0],
            password: 'decrypted_encrypted_pass_1_with_mock-vault-key' // check that it passes the decrypted password
        }
    });
  });

  it('filters the list based on search query', async () => {
    const { getByPlaceholderText, findByText, queryByText } = render(TestComponent);

    // Wait for initial list to render
    expect(await findByText('google.com')).toBeTruthy();
    expect(await findByText('github.com')).toBeTruthy();

    const searchInput = getByPlaceholderText('Search by site or username...');
    fireEvent.changeText(searchInput, 'goog');

    // After filtering, google.com should be visible, github.com should not
    expect(await findByText('google.com')).toBeTruthy();
    expect(queryByText('github.com')).toBeNull();
  });

  it('shows an empty list message when there are no passwords', async () => {
    global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
    });

    const { findByText } = render(TestComponent);
    const emptyMessage = await findByText('No passwords saved yet.');
    expect(emptyMessage).toBeTruthy();
  });
});
