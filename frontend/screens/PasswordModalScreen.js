import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { VaultContext } from '../context/VaultContext';
import { encryptData, decryptData } from '../utils/crypto';

const PasswordModalScreen = ({ route, navigation }) => {
  const { vaultKey } = useContext(VaultContext);
  const [site, setSite] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [passwordId, setPasswordId] = useState(null);

  useEffect(() => {
    if (route.params?.password) {
      const { id, site, username, password, category } = route.params.password;
      const decryptedPassword = decryptData(password, vaultKey);
      setSite(site);
      setUsername(username);
      setPassword(decryptedPassword);
      setCategory(category || '');
      setPasswordId(id);
      setIsEditMode(true);
    }
  }, [route.params?.password, vaultKey]);

  const handleSave = async () => {
    if (!vaultKey) {
        Alert.alert('Error', 'Vault is not open. Please re-login.');
        return;
    }
    const token = await SecureStore.getItemAsync('token');
    const url = isEditMode ? `http://localhost:3000/api/passwords/${passwordId}` : 'http://localhost:3000/api/passwords';
    const method = isEditMode ? 'PUT' : 'POST';

    const encryptedPassword = encryptData(password, vaultKey);

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ site, username, password: encryptedPassword, category }),
      });
      if (response.ok) {
        navigation.goBack();
      } else {
        const data = await response.json();
        Alert.alert('Error', data.error || 'Failed to save password');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while saving the password.');
    }
  };

  const handleDelete = async () => {
    const token = await SecureStore.getItemAsync('token');
    try {
        const response = await fetch(`http://localhost:3000/api/passwords/${passwordId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
            navigation.goBack();
        } else {
            const data = await response.json();
            Alert.alert('Error', data.error || 'Failed to delete password');
        }
    } catch (error) {
        Alert.alert('Error', 'An error occurred while deleting the password.');
    }
  };

  const generatePassword = (length = 16) => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
    let newPassword = "";
    for (let i = 0; i < length; ++i) {
        newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    // A simple shuffle
    return newPassword.split('').sort(() => 0.5 - Math.random()).join('');
  };

  return (
    <View style={styles.container}>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Text style={styles.closeButtonText}>X</Text>
        </TouchableOpacity>
      <Text style={styles.title}>{isEditMode ? 'Edit Password' : 'Add Password'}</Text>
      <TextInput style={styles.input} placeholder="Website" value={site} onChangeText={setSite} placeholderTextColor={COLORS.textSecondary} />
      <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername} placeholderTextColor={COLORS.textSecondary} />
      <TextInput style={styles.input} placeholder="Category (optional)" value={category} onChangeText={setCategory} placeholderTextColor={COLORS.textSecondary} />
      <View style={styles.passwordContainer}>
        <TextInput style={styles.passwordInput} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor={COLORS.textSecondary} />
        <TouchableOpacity style={styles.generateButton} onPress={() => setPassword(generatePassword())}>
            <Text style={styles.generateButtonText}>Generate</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
        <Text style={styles.primaryButtonText}>Save</Text>
      </TouchableOpacity>
      {isEditMode && (
        <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleDelete}>
                <Text style={styles.secondaryButtonText}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('PasswordHistory', { passwordId })}>
                <Text style={styles.secondaryButtonText}>View History</Text>
            </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: SIZES.padding,
      paddingTop: SIZES.padding * 3,
      backgroundColor: COLORS.background,
    },
    closeButton: {
        position: 'absolute',
        top: SIZES.padding * 2,
        right: SIZES.padding,
    },
    closeButtonText: {
        ...FONTS.h2,
        color: COLORS.textSecondary,
    },
    title: {
      ...FONTS.h1,
      color: COLORS.textPrimary,
      textAlign: 'center',
      marginVertical: SIZES.padding,
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
    passwordContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.surface,
      borderColor: COLORS.divider,
      borderWidth: 1,
      borderRadius: SIZES.buttonRadius,
      marginBottom: SIZES.margin,
    },
    passwordInput: {
      ...FONTS.body,
      flex: 1,
      padding: SIZES.margin,
      color: COLORS.textPrimary,
    },
    generateButton: {
        padding: SIZES.margin,
        borderLeftWidth: 1,
        borderLeftColor: COLORS.divider,
    },
    generateButtonText: {
        ...FONTS.body,
        color: COLORS.primary,
    },
    primaryButton: {
        backgroundColor: COLORS.primary,
        borderRadius: SIZES.buttonRadius,
        padding: SIZES.margin,
        alignItems: 'center',
    },
    primaryButtonText: {
        ...FONTS.bodyBold,
        color: COLORS.surface,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: SIZES.margin,
    },
    secondaryButton: {
        padding: SIZES.margin,
    },
    secondaryButtonText: {
        ...FONTS.body,
        color: COLORS.primary,
    },
  });

export default PasswordModalScreen;
