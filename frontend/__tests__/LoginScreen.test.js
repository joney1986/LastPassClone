import React from 'react';
import renderer from 'react-test-renderer';
import { render, fireEvent } from '@testing-library/react-native';
import LoginScreen from '../screens/LoginScreen';
import { VaultContext } from '../context/VaultContext';
import { Alert } from 'react-native';

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
  // Snapshot test
  it('renders correctly and matches snapshot', () => {
    const tree = renderer.create(TestComponent).toJSON();
    expect(tree).toMatchSnapshot();
  });

  // Interaction tests
  describe('interactions', () => {

    afterEach(() => {
        // Restore all mocks after each test
        jest.restoreAllMocks();
    });

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
      const passwordInput = getByPlaceholderText('Login Password');
      const masterPasswordInput = getByPlaceholderText('Master Password');

      fireEvent.changeText(usernameInput, 'testuser');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(masterPasswordInput, 'masterpass');

      expect(usernameInput.props.value).toBe('testuser');
      expect(passwordInput.props.value).toBe('password123');
      expect(masterPasswordInput.props.value).toBe('masterpass');
    });

    it('shows an alert if fields are empty on login attempt', () => {
      // Spy on Alert.alert and provide a mock implementation
      const alertSpy = jest.spyOn(Alert, 'alert');

      const { getByText } = render(TestComponent);

      const loginButton = getByText('Login');
      fireEvent.press(loginButton);

      expect(alertSpy).toHaveBeenCalledWith('Error', 'Please fill in all fields.');
    });
  });
});
