import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Alert } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as SecureStore from 'expo-secure-store';

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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
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
      <Text style={styles.title}>Set Up Two-Factor Authentication</Text>
      <Text style={styles.instructions}>
        Scan the QR code with your authenticator app, then enter the 6-digit code below to verify.
      </Text>
      {qrCodeUrl ? (
        <View style={styles.qrContainer}>
            <QRCode value={qrCodeUrl} size={200} />
        </View>
      ) : (
        <Text>Loading QR Code...</Text>
      )}
      <TextInput
        style={styles.input}
        placeholder="6-Digit Code"
        value={token}
        onChangeText={setToken}
        keyboardType="numeric"
        maxLength={6}
      />
      <Button title="Verify & Enable" onPress={handleVerify} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  instructions: {
    textAlign: 'center',
    marginBottom: 24,
  },
  qrContainer: {
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

export default TwoFASetupScreen;
