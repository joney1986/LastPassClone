import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';

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
      <Text style={styles.itemSite}>{item.site}</Text>
      <Text style={styles.itemUsername}>Username: {item.username}</Text>
      <Text style={styles.itemPassword}>Password: {item.password.substring(0, 3)}********</Text>
      <Text style={styles.itemDate}>Saved on: {new Date(item.created_at).toLocaleDateString()}</Text>
    </View>
  );

  if (loading) {
    return <View style={styles.container}><Text>Loading history...</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Password History</Text>
      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        ListEmptyComponent={<Text>No history found for this password.</Text>}
      />
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
    marginBottom: 16,
    textAlign: 'center',
  },
  itemContainer: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  itemSite: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemUsername: {
    fontSize: 14,
    color: 'gray',
    marginTop: 4,
  },
  itemPassword: {
    fontSize: 14,
    color: 'gray',
    marginTop: 4,
  },
  itemDate: {
    fontSize: 12,
    color: 'gray',
    marginTop: 8,
    textAlign: 'right',
  },
});

export default PasswordHistoryScreen;
