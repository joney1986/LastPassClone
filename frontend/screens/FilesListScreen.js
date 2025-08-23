import React, { useState, useEffect, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { AppContext } from '../context/AppContext';
import { VaultContext } from '../context/VaultContext';
import { decryptData, encryptData } from '../utils/crypto';

const FilesListScreen = ({ navigation }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();
  const { token } = useContext(AppContext);
  const { vaultKey } = useContext(VaultContext);

  const fetchFiles = async () => {
    if (!vaultKey) return;
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/files', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        const decryptedFiles = data.data.map(file => ({
            ...file,
            decryptedName: decryptData(file.file_name_encrypted, vaultKey),
        }));
        setFiles(decryptedFiles);
      } else {
        Alert.alert('Error', data.error || 'Failed to fetch files');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An error occurred while fetching files.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchFiles();
    }
  }, [isFocused, vaultKey]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFiles();
    setRefreshing(false);
  }, [vaultKey]);

  const handleUpload = async () => {
    setUploading(true);
    try {
        const result = await DocumentPicker.getDocumentAsync({
            copyToCacheDirectory: true,
        });

        if (result.type === 'success') {
            const fileContent = await FileSystem.readAsStringAsync(result.uri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            const encryptedName = encryptData(result.name, vaultKey);
            const encryptedContent = encryptData(fileContent, vaultKey);

            const response = await fetch('http://localhost:3000/api/files/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fileNameEncrypted: encryptedName,
                    fileType: result.mimeType,
                    fileContentEncrypted: encryptedContent,
                }),
            });

            const responseJson = await response.json();
            if (response.ok) {
                Alert.alert('Success', 'File uploaded successfully.');
                fetchFiles();
            } else {
                Alert.alert('Upload Failed', responseJson.error || 'Could not upload file.');
            }
        }
    } catch (error) {
        console.error('Upload error:', error);
        Alert.alert('Error', 'An unexpected error occurred during upload.');
    } finally {
        setUploading(false);
    }
  };

  const handleViewFile = async (file) => {
    if (downloading) return;
    setDownloading(file.id);
    try {
        const response = await fetch(`http://localhost:3000/api/files/${file.id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
            throw new Error('Failed to download file.');
        }

        const encryptedBase64 = await response.text();
        const decryptedBase64 = decryptData(encryptedBase64, vaultKey);

        const tempUri = FileSystem.cacheDirectory + file.decryptedName.replace(/ /g, '_');
        await FileSystem.writeAsStringAsync(tempUri, decryptedBase64, {
            encoding: FileSystem.EncodingType.Base64,
        });

        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(tempUri, { mimeType: file.file_type, dialogTitle: file.decryptedName });
        } else {
            Alert.alert("Sharing not available", "The sharing feature is not available on your device.");
        }
    } catch (error) {
        console.error('View file error:', error);
        Alert.alert('Error', 'Could not open the file.');
    } finally {
        setDownloading(null);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.itemContainer} onPress={() => handleViewFile(item)} disabled={downloading}>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.decryptedName}</Text>
        <Text style={styles.itemDate}>Last updated: {new Date(item.updated_at).toLocaleDateString()}</Text>
      </View>
      {downloading === item.id && <ActivityIndicator color={COLORS.primary} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={handleUpload} disabled={uploading}>
        <Text style={styles.addButtonText}>{uploading ? 'Uploading...' : 'Upload New File'}</Text>
      </TouchableOpacity>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={files}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>No secure files yet.</Text></View>}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemContent: {
      flex: 1,
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
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default FilesListScreen;
