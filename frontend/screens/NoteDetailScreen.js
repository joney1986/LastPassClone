import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const NoteDetailScreen = ({ route, navigation }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [noteId, setNoteId] = useState(null);

  useEffect(() => {
    if (route.params?.note) {
      const { id, title } = route.params.note;
      setTitle(title);
      setNoteId(id);
      setIsEditMode(true);
      // Fetch full note content for editing
      fetchNoteContent(id);
    }
  }, [route.params?.note]);

  const fetchNoteContent = async (id) => {
    const token = await SecureStore.getItemAsync('token');
    try {
      const response = await fetch(`http://localhost:3000/api/notes/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setContent(data.data.content);
      } else {
        Alert.alert('Error', 'Failed to fetch note content.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while fetching the note.');
    }
  };

  const handleSave = async () => {
    const token = await SecureStore.getItemAsync('token');
    const url = isEditMode ? `http://localhost:3000/api/notes/${noteId}` : 'http://localhost:3000/api/notes';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content }),
      });

      if (response.ok) {
        navigation.goBack();
      } else {
        const data = await response.json();
        Alert.alert('Error', data.error || 'Failed to save note');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while saving the note.');
    }
  };

  const handleDelete = async () => {
    const token = await SecureStore.getItemAsync('token');
    try {
        const response = await fetch(`http://localhost:3000/api/notes/${noteId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
            navigation.goBack();
        } else {
            const data = await response.json();
            Alert.alert('Error', data.error || 'Failed to delete note');
        }
    } catch (error) {
        Alert.alert('Error', 'An error occurred while deleting the note.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isEditMode ? 'Edit Note' : 'Add Note'}</Text>
      <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
      <TextInput
        style={[styles.input, styles.contentInput]}
        placeholder="Secure Content"
        value={content}
        onChangeText={setContent}
        multiline
      />
      <Button title="Save" onPress={handleSave} />
      {isEditMode && <Button title="Delete" onPress={handleDelete} color="red" />}
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
      marginBottom: 24,
      textAlign: 'center',
    },
    input: {
      height: 40,
      borderColor: 'gray',
      borderWidth: 1,
      marginBottom: 16,
      paddingHorizontal: 8,
      borderRadius: 8,
    },
    contentInput: {
        height: 200,
        textAlignVertical: 'top',
        paddingTop: 8,
    }
  });

export default NoteDetailScreen;
