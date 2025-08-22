import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useIsFocused } from '@react-navigation/native';
import { COLORS, SIZES, FONTS } from '../constants/theme';

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
      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('NoteDetail')}>
        <Text style={styles.addButtonText}>Add New Note</Text>
      </TouchableOpacity>
      <FlatList
        data={notes}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>No secure notes yet.</Text></View>}
        contentContainerStyle={{ paddingBottom: SIZES.padding }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SIZES.padding,
    backgroundColor: COLORS.background,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.buttonRadius,
    padding: SIZES.margin,
    alignItems: 'center',
    marginBottom: SIZES.margin,
  },
  addButtonText: {
    ...FONTS.bodyBold,
    color: COLORS.surface,
  },
  itemContainer: {
    backgroundColor: COLORS.surface,
    padding: SIZES.margin,
    marginVertical: SIZES.margin / 2,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  itemTitle: {
    ...FONTS.h2,
    color: COLORS.textPrimary,
  },
  itemDate: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    marginTop: SIZES.margin / 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SIZES.padding * 2,
  },
  emptyText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
  },
});

export default NotesListScreen;
