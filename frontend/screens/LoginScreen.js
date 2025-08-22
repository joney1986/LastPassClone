import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { VaultContext } from '../context/VaultContext';
import { deriveKeyFromPassword, decryptData } from '../utils/crypto';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const { setVaultKey } = useContext(VaultContext);

  const handleLogin = async () => {
    if (!username || !password || !masterPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    try {
      // Step 1: Regular login to get tokens and encrypted vault key
      const loginResponse = await fetch('http://localhost:3000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        return Alert.alert('Login Failed', loginData.error || 'Invalid credentials.');
      }

      // If 2FA is required, this part of the logic will be handled on the 2FA screen
      // For now, we assume a direct login or that 2FA screen will handle the final step.
      // The 2FA screen would need to be refactored to accept master password as well.
      // Let's focus on the non-2FA path for now.
      if (loginData.twoFactorRequired) {
        // We need to pass the master password to the 2FA screen now.
        navigation.navigate('TwoFALogin', {
            tempToken: loginData.tempToken,
            masterPassword: masterPassword,
            encryptedVaultKey: loginData.encryptedVaultKey,
            masterPasswordSalt: loginData.masterPasswordSalt
        });
        return;
      }

      // Step 2: Decrypt the vault key
      const { encryptedVaultKey, masterPasswordSalt, token } = loginData;
      if (!encryptedVaultKey || !masterPasswordSalt) {
          return Alert.alert('Login Error', 'Could not retrieve vault information. Please try again.');
      }

      const masterKey = await deriveKeyFromPassword(masterPassword, masterPasswordSalt);
      const decryptedVaultKey = decryptData(encryptedVaultKey, masterKey);

      if (!decryptedVaultKey) {
          return Alert.alert('Login Failed', 'Incorrect Master Password.');
      }

      // Step 3: Store session token and vault key, then navigate
      await SecureStore.setItemAsync('token', token);
      setVaultKey(decryptedVaultKey);
      navigation.replace('MainApp');

    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Error', 'An error occurred during login.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor={COLORS.textSecondary}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Login Password"
        placeholderTextColor={COLORS.textSecondary}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Master Password"
        placeholderTextColor={COLORS.textSecondary}
        value={masterPassword}
        onChangeText={setMasterPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
        <Text style={styles.primaryButtonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Register')}>
        <Text style={styles.secondaryButtonText}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: SIZES.padding,
    backgroundColor: COLORS.background,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SIZES.padding * 2,
  },
  input: {
    ...FONTS.body,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.divider,
    borderWidth: 1,
    borderRadius: SIZES.buttonRadius,
    padding: SIZES.margin,
    marginBottom: SIZES.margin,
    color: COLORS.textPrimary,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.buttonRadius,
    padding: SIZES.margin,
    alignItems: 'center',
    marginTop: SIZES.margin,
  },
  primaryButtonText: {
    ...FONTS.bodyBold,
    color: COLORS.surface,
  },
  secondaryButton: {
    padding: SIZES.margin,
    alignItems: 'center',
  },
  secondaryButtonText: {
    ...FONTS.body,
    color: COLORS.primary,
  },
});

export default LoginScreen;
