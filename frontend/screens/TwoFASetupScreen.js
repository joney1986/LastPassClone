import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as SecureStore from 'expo-secure-store';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const TwoFASetupScreen = ({ navigation }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [token, setToken] = useState('');

  useEffect(() => {
    const setup2FA = async () => {
      const authToken = await SecureStore.getItemAsync('token');
      try {
        const response = await fetch('http://localhost:3000/api/users/2fa/setup', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}` },
        });
        const data = await response.json();
        if (response.ok) {
          // In a real app, you might get a otpauth:// URI, which QRCode can handle directly
          setQrCodeUrl(data.qrCodeUrl);
        } else {
          Alert.alert('Error', 'Could not start 2FA setup.');
        }
      } catch (error) {
        Alert.alert('Error', 'An error occurred during 2FA setup.');
      }
    };
    setup2FA();
  }, []);

  const handleVerify = async () => {
    const authToken = await SecureStore.getItemAsync('token');
    try {
      const response = await fetch('http://localhost:3000/api/users/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', '2FA has been enabled successfully.');
        navigation.goBack();
      } else {
        Alert.alert('Error', data.error || 'Invalid 2FA token.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred during verification.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set Up 2FA</Text>
      <Text style={styles.instructions}>
        Scan this QR code with your authenticator app (like Google Authenticator), then enter the 6-digit code below to complete the setup.
      </Text>
      <View style={styles.qrContainer}>
        {qrCodeUrl ? (
            <QRCode value={qrCodeUrl} size={200} backgroundColor={COLORS.surface} color={COLORS.textPrimary} />
        ) : (
            <Text style={styles.loadingText}>Loading QR Code...</Text>
        )}
      </View>
      <TextInput
        style={styles.input}
        placeholder="6-Digit Code"
        placeholderTextColor={COLORS.textSecondary}
        value={token}
        onChangeText={setToken}
        keyboardType="numeric"
        maxLength={6}
      />
      <TouchableOpacity style={styles.primaryButton} onPress={handleVerify}>
        <Text style={styles.primaryButtonText}>Verify & Enable</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SIZES.padding,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.textPrimary,
    marginBottom: SIZES.margin,
    textAlign: 'center',
  },
  instructions: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.padding,
  },
  qrContainer: {
    padding: SIZES.margin,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
  },
  loadingText: {
      ...FONTS.body,
      color: COLORS.textSecondary,
  },
  input: {
    ...FONTS.h1,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.divider,
    borderWidth: 1,
    borderRadius: SIZES.buttonRadius,
    padding: SIZES.margin,
    marginBottom: SIZES.margin,
    color: COLORS.textPrimary,
    width: '80%',
    textAlign: 'center',
    letterSpacing: 10,
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

export default TwoFASetupScreen;
