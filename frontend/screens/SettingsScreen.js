import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const SettingsScreen = ({ navigation }) => {
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

  useEffect(() => {
    // Load the saved preference
    const loadPreference = async () => {
      const savedPref = await AsyncStorage.getItem('biometric_enabled');
      setIsBiometricEnabled(savedPref === 'true');
    };
    loadPreference();
  }, []);

  const handleBiometricToggle = async (value) => {
    if (value === true) {
        // Check if hardware supports biometrics
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        if (!hasHardware) {
            Alert.alert("Error", "Your device doesn't support biometric authentication.");
            return;
        }
        // Check if biometrics are enrolled
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (!isEnrolled) {
            Alert.alert("Error", "No biometrics enrolled on this device. Please set it up in your device settings.");
            return;
        }
    }

    setIsBiometricEnabled(value);
    await AsyncStorage.setItem('biometric_enabled', value.toString());
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('token');
    navigation.navigate('AuthLoading');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.menuItem}>
        <Text style={styles.menuItemText}>Enable Biometric Unlock</Text>
        <Switch
            trackColor={{ false: COLORS.disabled, true: COLORS.accent }}
            thumbColor={COLORS.surface}
            onValueChange={handleBiometricToggle}
            value={isBiometricEnabled}
        />
      </View>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => navigation.navigate('TwoFASetup')}
      >
        <Text style={styles.menuItemText}>Two-Factor Authentication</Text>
      </TouchableOpacity>

      <View style={{ flex: 1 }} />

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SIZES.padding,
    backgroundColor: COLORS.background,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.textPrimary,
    marginBottom: SIZES.padding,
  },
  menuItem: {
    backgroundColor: COLORS.surface,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.divider,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.margin,
  },
  menuItemText: {
    ...FONTS.body,
    color: COLORS.textPrimary,
  },
  logoutButton: {
    borderColor: COLORS.primary,
    borderWidth: 1,
    borderRadius: SIZES.buttonRadius,
    padding: SIZES.margin,
    alignItems: 'center',
  },
  logoutButtonText: {
    ...FONTS.bodyBold,
    color: COLORS.primary,
  },
});

export default SettingsScreen;
