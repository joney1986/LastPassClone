import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Button, TouchableOpacity, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useIsFocused } from '@react-navigation/native';

const NotesListScreen = ({ navigation }) => {
  const [notes, setNotes] = useState([]);
  const isFocused = useIsFocused();

  useEffect(() => {
    const fetchNotes = async () => {
      const token = await SecureStore.getItemAsync('token');
      try {
        const response = await fetch('http://localhost:3000/api/notes', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          setNotes(data.data);
        } else {
          Alert.alert('Error', data.error || 'Failed to fetch notes');
        }
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'An error occurred while fetching notes.');
      }
    };

    if (isFocused) {
      fetchNotes();
    }
  }, [isFocused]);

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.itemContainer} onPress={() => navigation.navigate('NoteDetail', { note: item })}>
      <Text style={styles.itemTitle}>{item.title}</Text>
      <Text style={styles.itemDate}>Last updated: {new Date(item.updated_at).toLocaleDateString()}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Button title="Add New Note" onPress={() => navigation.navigate('NoteDetail')} />
      <FlatList
        data={notes}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        ListEmptyComponent={<Text>No secure notes yet.</Text>}
      />
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
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemDate: {
    fontSize: 12,
    color: 'gray',
    marginTop: 4,
  },
});

export default NotesListScreen;
