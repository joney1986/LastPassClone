import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const TwoFALoginScreen = ({ route, navigation }) => {
  const { tempToken } = route.params;
  const [token, setToken] = useState('');

  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/users/2fa/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}`,
        },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      if (response.ok) {
        await SecureStore.setItemAsync('token', data.token);
        navigation.replace('MainApp');
      } else {
        Alert.alert('Login Failed', data.error || 'Invalid 2FA token.');
      }
    } catch (error) {
      Alert.alert('Login Error', 'An error occurred during 2FA login.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Verification Code</Text>
      <TextInput
        style={styles.input}
        placeholder="6-Digit Code"
        placeholderTextColor={COLORS.textSecondary}
        value={token}
        onChangeText={setToken}
        keyboardType="numeric"
        maxLength={6}
      />
      <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
        <Text style={styles.primaryButtonText}>Verify & Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding,
    backgroundColor: COLORS.background,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.textPrimary,
    marginBottom: SIZES.padding * 2,
    textAlign: 'center',
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
    marginTop: SIZES.margin,
    width: '80%',
  },
  primaryButtonText: {
    ...FONTS.bodyBold,
    color: COLORS.surface,
  },
});

export default TwoFALoginScreen;
