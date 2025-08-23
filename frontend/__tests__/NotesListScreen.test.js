import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import NotesListScreen from '../screens/NotesListScreen';
import * as SecureStore from 'expo-secure-store';
import { useIsFocused } from '@react-navigation/native';

// Mock dependencies
jest.mock('expo-secure-store');
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useIsFocused: jest.fn(),
}));

const mockNavigation = {
  navigate: jest.fn(),
};

const mockNotes = [
  { id: 1, title: 'Test Note 1', updated_at: new Date().toISOString() },
  { id: 2, title: 'Test Note 2', updated_at: new Date().toISOString() },
];

describe('<NotesListScreen />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useIsFocused.mockReturnValue(true);
    SecureStore.getItemAsync.mockResolvedValue('fake-token');
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockNotes }),
    });
  });

  it('displays the list of notes after fetching', async () => {
    const { findByText } = render(<NotesListScreen navigation={mockNavigation} />);

    // findByText returns a promise which resolves when the element is found
    const note1 = await findByText('Test Note 1');
    const note2 = await findByText('Test Note 2');

    expect(note1).toBeTruthy();
    expect(note2).toBeTruthy();
  });

  it('navigates to NoteDetail screen when a note is pressed', async () => {
    const { findByText } = render(<NotesListScreen navigation={mockNavigation} />);

    const noteToPress = await findByText('Test Note 1');
    fireEvent.press(noteToPress);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('NoteDetail', { note: mockNotes[0] });
  });

  it('shows an empty list message when there are no notes', async () => {
      global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
      });

      const { findByText } = render(<NotesListScreen navigation={mockNavigation} />);
      const emptyMessage = await findByText('No secure notes yet.');
      expect(emptyMessage).toBeTruthy();
  });
});
