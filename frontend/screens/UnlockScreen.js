import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const UnlockScreen = ({ onUnlock }) => {

  const handleBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock to access your passwords',
        cancelLabel: 'Cancel',
        disableDeviceFallback: true, // Don't allow passcode fallback
      });

      if (result.success) {
        onUnlock();
      } else {
        // User cancelled or authentication failed
        // You might want to handle this case, e.g., by allowing a PIN fallback
        // or simply letting them press the button again.
      }
    } catch (error) {
      Alert.alert('Authentication Error', 'An error occurred during biometric authentication.');
    }
  };

  useEffect(() => {
    handleBiometricAuth();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Locked</Text>
      <Text style={styles.subtitle}>Authenticate to continue</Text>
      <TouchableOpacity style={styles.primaryButton} onPress={handleBiometricAuth}>
        <Text style={styles.primaryButtonText}>Unlock with Biometrics</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.textPrimary,
    marginBottom: SIZES.margin,
  },
  subtitle: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    marginBottom: SIZES.padding * 2,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.buttonRadius,
    padding: SIZES.margin,
    alignItems: 'center',
    width: '80%',
  },
  primaryButtonText: {
    ...FONTS.bodyBold,
    color: COLORS.surface,
  },
});

export default UnlockScreen;
