import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const SettingsScreen = ({ navigation }) => {
  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('token');
    // This will kick the user back to the AuthLoading screen, which will redirect to Login
    navigation.navigate('AuthLoading');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => navigation.navigate('TwoFASetup')}
      >
        <Text style={styles.menuItemText}>Two-Factor Authentication</Text>
      </TouchableOpacity>

      {/* Placeholder for other settings */}
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
