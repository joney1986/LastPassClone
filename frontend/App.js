import React from 'react';
import AppNavigator from './navigation/AppNavigator';
import { useFonts } from 'expo-font';
import { AppProvider } from './context/AppContext';

export default function App() {
  const [fontsLoaded] = useFonts({
    'Poppins-SemiBold': require('./assets/fonts/Poppins-SemiBold.woff2'),
    'Inter-Regular': require('./assets/fonts/Inter-Regular.woff2'),
    'Inter-Medium': require('./assets/fonts/Inter-Medium.woff2'),
  });

  if (!fontsLoaded) {
    return null; // or a loading indicator
  }

  return (
    <AppProvider>
      <AppNavigator />
    </AppProvider>
  );
}
