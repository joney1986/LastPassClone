import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { COLORS, SIZES, FONTS } from '../constants/theme';

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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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
      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
        <Text style={styles.closeButtonText}>X</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{isEditMode ? 'Edit Note' : 'Add Note'}</Text>
      <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} placeholderTextColor={COLORS.textSecondary} />
      <TextInput
        style={[styles.input, styles.contentInput]}
        placeholder="Secure Content"
        value={content}
        onChangeText={setContent}
        multiline
        placeholderTextColor={COLORS.textSecondary}
      />
      <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
        <Text style={styles.primaryButtonText}>Save</Text>
      </TouchableOpacity>
      {isEditMode && (
          <TouchableOpacity style={styles.secondaryButton} onPress={handleDelete}>
            <Text style={styles.secondaryButtonText}>Delete Note</Text>
          </TouchableOpacity>
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
    contentInput: {
        height: 200,
        textAlignVertical: 'top',
        paddingTop: SIZES.margin,
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
    secondaryButton: {
        borderColor: COLORS.primary,
        borderWidth: 1,
        borderRadius: SIZES.buttonRadius,
        padding: SIZES.margin,
        alignItems: 'center',
        marginTop: SIZES.margin,
    },
    secondaryButtonText: {
        ...FONTS.bodyBold,
        color: COLORS.primary,
    },
  });

export default NoteDetailScreen;
