import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const PasswordModalScreen = ({ route, navigation }) => {
  const [site, setSite] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [passwordId, setPasswordId] = useState(null);

  useEffect(() => {
    if (route.params?.password) {
      const { id, site, username, password, category } = route.params.password;
      setSite(site);
      setUsername(username);
      setPassword(password);
      setCategory(category || '');
      setPasswordId(id);
      setIsEditMode(true);
    }
  }, [route.params?.password]);

  const handleSave = async () => {
    const token = await SecureStore.getItemAsync('token');
    const url = isEditMode ? `http://localhost:3000/api/passwords/${passwordId}` : 'http://localhost:3000/api/passwords';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ site, username, password, category }),
      });

      const data = await response.json();

      if (response.ok) {
        navigation.goBack();
      } else {
        Alert.alert('Error', data.error || 'Failed to save password');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An error occurred while saving the password.');
    }
  };

  const handleDelete = async () => {
    const token = await SecureStore.getItemAsync('token');
    try {
        const response = await fetch(`http://localhost:3000/api/passwords/${passwordId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.ok) {
            navigation.goBack();
        } else {
            const data = await response.json();
            Alert.alert('Error', data.error || 'Failed to delete password');
        }
    } catch (error) {
        console.error(error);
        Alert.alert('Error', 'An error occurred while deleting the password.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isEditMode ? 'Edit Password' : 'Add Password'}</Text>
      <TextInput style={styles.input} placeholder="Website" value={site} onChangeText={setSite} />
      <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername} />
      <TextInput style={styles.input} placeholder="Category (optional)" value={category} onChangeText={setCategory} />
      <View style={styles.passwordContainer}>
        <TextInput style={styles.passwordInput} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <Button title="Generate" onPress={() => setPassword(generatePassword())} />
      </View>
      <Button title="Save" onPress={handleSave} />
      {isEditMode && (
        <View style={styles.buttonContainer}>
            <Button title="Delete" onPress={handleDelete} color="red" />
            <Button title="View History" onPress={() => navigation.navigate('PasswordHistory', { passwordId })} />
        </View>
      )}
    </View>
  );
};

const generatePassword = (length = 16) => {
    const charset = {
        lower: 'abcdefghijklmnopqrstuvwxyz',
        upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };

    let password = '';
    const allChars = Object.values(charset).join('');

    // Ensure at least one character from each set
    password += charset.lower[Math.floor(Math.random() * charset.lower.length)];
    password += charset.upper[Math.floor(Math.random() * charset.upper.length)];
    password += charset.numbers[Math.floor(Math.random() * charset.numbers.length)];
    password += charset.symbols[Math.floor(Math.random() * charset.symbols.length)];

    // Fill the rest of the password length
    for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password to randomize the order of the guaranteed characters
    return password.split('').sort(() => 0.5 - Math.random()).join('');
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      justifyContent: 'center',
    },
    title: {
      fontSize: 24,
      marginBottom: 24,
      textAlign: 'center',
    },
    input: {
      height: 40,
      borderColor: 'gray',
      borderWidth: 1,
      marginBottom: 16,
      paddingHorizontal: 8,
    },
    passwordContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderColor: 'gray',
      borderWidth: 1,
      marginBottom: 16,
    },
    passwordInput: {
      height: 40,
      paddingHorizontal: 8,
      flex: 1,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
    }
  });

export default PasswordModalScreen;
