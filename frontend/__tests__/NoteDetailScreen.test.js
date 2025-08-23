import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import NoteDetailScreen from '../screens/NoteDetailScreen';
import * as SecureStore from 'expo-secure-store';
import { VaultContext } from '../context/VaultContext';
import * as Crypto from '../utils/crypto';
import { Alert } from 'react-native';

// Mock dependencies
jest.mock('expo-secure-store');
jest.mock('../utils/crypto');
jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

describe('<NoteDetailScreen />', () => {
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
    it('renders in "Add Note" mode correctly', () => {
      const mockRoute = { params: {} };
      const { getByText, queryByText } = render(
        <VaultContext.Provider value={mockVaultContext}>
          <NoteDetailScreen navigation={mockNavigation} route={mockRoute} />
        </VaultContext.Provider>
      );
      expect(getByText('Add Note')).toBeTruthy();
      expect(queryByText('Delete Note')).toBeNull();
    });

    it('renders in "Edit Note" mode correctly and fetches content', async () => {
      const mockNote = { id: 1, title: 'Existing Note' };
      const mockRoute = { params: { note: mockNote } };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { content: 'encrypted_content' } }),
      });
      const { getByText, findByDisplayValue } = render(
        <VaultContext.Provider value={mockVaultContext}>
          <NoteDetailScreen navigation={mockNavigation} route={mockRoute} />
        </VaultContext.Provider>
      );
      expect(getByText('Edit Note')).toBeTruthy();
      expect(getByText('Delete Note')).toBeTruthy();
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/notes/1', expect.any(Object));
      });
      expect(await findByDisplayValue('Existing Note')).toBeTruthy();
      expect(await findByDisplayValue('decrypted_encrypted_content')).toBeTruthy();
    });
  });

  // --- SAVE FUNCTIONALITY ---
  describe('Save Functionality', () => {
    it('saves a new note correctly', async () => {
        const mockRoute = { params: {} };
        global.fetch = jest.fn().mockResolvedValue({ ok: true });
        const { getByPlaceholderText, getByText } = render(
            <VaultContext.Provider value={mockVaultContext}>
                <NoteDetailScreen navigation={mockNavigation} route={mockRoute} />
            </VaultContext.Provider>
        );
        fireEvent.changeText(getByPlaceholderText('Title'), 'New Note Title');
        fireEvent.changeText(getByPlaceholderText('Secure Content'), 'New Note Content');
        fireEvent.press(getByText('Save'));
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/notes', expect.any(Object));
            expect(mockNavigation.goBack).toHaveBeenCalled();
        });
    });

    it('updates an existing note correctly', async () => {
        const mockNote = { id: 1, title: 'Existing Note' };
        const mockRoute = { params: { note: mockNote } };
        global.fetch = jest.fn()
            .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ data: { content: 'encrypted_content' } }) }))
            .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
        const { getByPlaceholderText, getByText, findByDisplayValue } = render(
            <VaultContext.Provider value={mockVaultContext}>
                <NoteDetailScreen navigation={mockNavigation} route={mockRoute} />
            </VaultContext.Provider>
        );
        await findByDisplayValue('decrypted_encrypted_content');
        fireEvent.changeText(getByPlaceholderText('Title'), 'Updated Title');
        fireEvent.changeText(getByPlaceholderText('Secure Content'), 'Updated Content');
        fireEvent.press(getByText('Save'));
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(2);
            expect(mockNavigation.goBack).toHaveBeenCalled();
        });
    });
  });

  // --- DELETE FUNCTIONALITY ---
  describe('Delete Functionality', () => {
    it('deletes an existing note', async () => {
        const mockNote = { id: 1, title: 'Existing Note' };
        const mockRoute = { params: { note: mockNote } };
        global.fetch = jest.fn()
            .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ data: { content: 'encrypted_content' } }) })) // For initial load
            .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) })); // For DELETE

        const { getByText } = render(
            <VaultContext.Provider value={mockVaultContext}>
                <NoteDetailScreen navigation={mockNavigation} route={mockRoute} />
            </VaultContext.Provider>
        );

        fireEvent.press(getByText('Delete Note'));

        await waitFor(() => {
            // Check that the DELETE request was made
            expect(global.fetch).toHaveBeenCalledTimes(2);
            expect(global.fetch).toHaveBeenNthCalledWith(2, 'http://localhost:3000/api/notes/1', expect.objectContaining({ method: 'DELETE' }));
            expect(mockNavigation.goBack).toHaveBeenCalled();
        });
    });
  });
});
