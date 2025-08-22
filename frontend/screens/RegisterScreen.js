import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Registration Successful', 'You can now log in.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]);
      } else {
        Alert.alert('Registration Failed', data.error);
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Registration Error', 'An error occurred during registration.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
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
      <TouchableOpacity style={styles.primaryButton} onPress={handleRegister}>
        <Text style={styles.primaryButtonText}>Register</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.secondaryButtonText}>Already have an account? Login</Text>
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

export default RegisterScreen;
