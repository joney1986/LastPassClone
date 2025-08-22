import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.twoFactorRequired) {
          navigation.navigate('TwoFALogin', { tempToken: data.tempToken });
        } else {
          await SecureStore.setItemAsync('token', data.token);
          navigation.replace('MainApp');
        }
      } else {
        Alert.alert('Login Failed', data.error);
      }
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
        placeholder="Password"
        placeholderTextColor={COLORS.textSecondary}
        value={password}
        onChangeText={setPassword}
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
