import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';

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
      <Text style={styles.title}>Enter 2FA Code</Text>
      <TextInput
        style={styles.input}
        placeholder="6-Digit Code"
        value={token}
        onChangeText={setToken}
        keyboardType="numeric"
        maxLength={6}
      />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  input: {
    height: 40,
    width: '80%',
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default TwoFALoginScreen;
