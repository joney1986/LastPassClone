import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

const SettingsScreen = ({ navigation }) => {
  // We will add logic here to check 2FA status and show the appropriate button
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Button
        title="Set Up Two-Factor Authentication"
        onPress={() => navigation.navigate('TwoFASetup')}
      />
      {/* We will also add a "Disable 2FA" button here if it's enabled */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
});

export default SettingsScreen;
