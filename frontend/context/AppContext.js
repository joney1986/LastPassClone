import React, { createContext, useState, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [isLocked, setIsLocked] = useState(true); // Start locked
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      const isBiometricEnabled = await AsyncStorage.getItem('biometric_enabled') === 'true';

      if (isBiometricEnabled && appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        setIsLocked(true);
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const lockApp = () => setIsLocked(true);
  const unlockApp = () => setIsLocked(false);

  return (
    <AppContext.Provider value={{ isLocked, lockApp, unlockApp }}>
      {children}
    </AppContext.Provider>
  );
};
