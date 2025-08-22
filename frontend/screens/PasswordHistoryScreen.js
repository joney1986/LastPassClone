import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const PasswordHistoryScreen = ({ route }) => {
  const { passwordId } = route.params;
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const token = await SecureStore.getItemAsync('token');
      try {
        const response = await fetch(`http://localhost:3000/api/passwords/${passwordId}/history`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setHistory(data.data);
        } else {
          Alert.alert('Error', data.error || 'Failed to fetch history');
        }
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'An error occurred while fetching history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [passwordId]);

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
        <View style={styles.itemHeader}>
            <Text style={styles.itemSite}>{item.site}</Text>
            {item.category && <Text style={styles.itemCategory}>{item.category}</Text>}
        </View>
      <Text style={styles.itemUsername}>Username: {item.username}</Text>
      <Text style={styles.itemPassword}>Password: {item.password}</Text>
      <Text style={styles.itemDate}>Saved on: {new Date(item.created_at).toLocaleDateString()}</Text>
    </View>
  );

  if (loading) {
    return (
        <View style={[styles.container, styles.centered]}>
            <Text style={styles.loadingText}>Loading history...</Text>
        </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        ListEmptyComponent={<View style={styles.centered}><Text style={styles.emptyText}>No history found for this password.</Text></View>}
        ListHeaderComponent={<Text style={styles.title}>Password History</Text>}
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...FONTS.h1,
    color: COLORS.textPrimary,
    marginBottom: SIZES.padding,
    textAlign: 'center',
  },
  loadingText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
  },
  emptyText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
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
    marginBottom: SIZES.margin / 2,
  },
  itemPassword: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    marginBottom: SIZES.margin / 2,
  },
  itemDate: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
});

export default PasswordHistoryScreen;
