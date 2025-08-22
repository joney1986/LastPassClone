import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useIsFocused } from '@react-navigation/native';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const HomeScreen = ({ navigation }) => {
  const [passwords, setPasswords] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPasswords, setFilteredPasswords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();

  // This function will be moved to an API service file in a larger app
  const fetchPasswords = async () => {
    setLoading(true);
    const token = await SecureStore.getItemAsync('token');
    if (!token) {
      navigation.replace('Login');
      return;
    }
    try {
      const response = await fetch('http://localhost:3000/api/passwords', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.status === 401) {
        await SecureStore.deleteItemAsync('token');
        navigation.replace('Login');
        return;
      }
      const data = await response.json();
      if (response.ok) {
        setPasswords(data.data);
        setFilteredPasswords(data.data);
      } else {
        Alert.alert('Error', data.error || 'Failed to fetch passwords');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An error occurred while fetching passwords.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchPasswords();
    }
  }, [isFocused]);

  useEffect(() => {
    if (searchQuery === '') {
      setFilteredPasswords(passwords);
    } else {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filtered = passwords.filter(p =>
        p.site.toLowerCase().includes(lowercasedQuery) ||
        p.username.toLowerCase().includes(lowercasedQuery)
      );
      setFilteredPasswords(filtered);
    }
  }, [searchQuery, passwords]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPasswords();
    setRefreshing(false);
  }, []);

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
      <TextInput
        style={styles.searchInput}
        placeholder="Search by site or username..."
        placeholderTextColor={COLORS.textSecondary}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('PasswordModal')}>
        <Text style={styles.addButtonText}>Add New Password</Text>
      </TouchableOpacity>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={filteredPasswords}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>No passwords saved yet.</Text></View>}
          contentContainerStyle={{ paddingBottom: SIZES.padding }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SIZES.padding,
    backgroundColor: COLORS.background,
  },
  searchInput: {
    ...FONTS.body,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.divider,
    borderWidth: 1,
    borderRadius: SIZES.buttonRadius,
    padding: SIZES.margin,
    marginBottom: SIZES.margin,
    color: COLORS.textPrimary,
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
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.margin / 2,
  },
  itemSite: {
    ...FONTS.h2,
    color: COLORS.textPrimary,
  },
  itemCategory: {
    ...FONTS.caption,
    color: COLORS.surface,
    backgroundColor: COLORS.accent,
    paddingHorizontal: SIZES.margin / 2,
    paddingVertical: SIZES.margin / 4,
    borderRadius: SIZES.buttonRadius / 2,
    overflow: 'hidden',
  },
  itemUsername: {
    ...FONTS.body,
    color: COLORS.textSecondary,
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
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default HomeScreen;
