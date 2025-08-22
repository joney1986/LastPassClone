import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useIsFocused } from '@react-navigation/native';

const HomeScreen = ({ navigation }) => {
  const [passwords, setPasswords] = useState([]);
  const isFocused = useIsFocused();

  const fetchPasswords = async () => {
    const token = await SecureStore.getItemAsync('token');
    if (!token) {
      navigation.replace('Login');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/passwords', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        await SecureStore.deleteItemAsync('token');
        navigation.replace('Login');
        return;
      }

      const data = await response.json();
      if (response.ok) {
        setPasswords(data.data);
      } else {
        Alert.alert('Error', data.error || 'Failed to fetch passwords');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An error occurred while fetching passwords.');
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchPasswords();
    }
  }, [isFocused]);

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('token');
    navigation.replace('Login');
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.itemContainer} onPress={() => navigation.navigate('PasswordModal', { password: item })}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemSite}>{item.site}</Text>
        {item.category && <Text style={styles.itemCategory}>{item.category}</Text>}
      </View>
      <Text style={styles.itemUsername}>{item.username}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Button title="Add New Password" onPress={() => navigation.navigate('PasswordModal')} />
      <FlatList
        data={passwords}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        ListEmptyComponent={<Text>No passwords saved yet.</Text>}
      />
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  itemContainer: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemSite: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemCategory: {
    fontSize: 12,
    color: 'white',
    backgroundColor: 'blue',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  itemUsername: {
    fontSize: 14,
    color: 'gray',
  },
});

export default HomeScreen;
