import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Switch, Clipboard } from 'react-native';
import Slider from '@react-native-community/slider';
import { generatePassword } from '../utils/passwordGenerator';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const PasswordGeneratorModal = ({ visible, onClose, onUsePassword }) => {
  const [length, setLength] = useState(16);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [password, setPassword] = useState('');

  const handleGeneratePassword = async () => {
    const newPassword = await generatePassword({ length, useNumbers, useSymbols });
    setPassword(newPassword);
  };

  useEffect(() => {
    // Generate a password when the modal is opened or settings change
    if (visible) {
      handleGeneratePassword();
    }
  }, [visible, length, useNumbers, useSymbols]);

  const handleCopyPassword = () => {
    Clipboard.setString(password);
    alert('Password copied to clipboard!');
  };

  const handleUsePassword = () => {
    onUsePassword(password);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Password Generator</Text>

          <View style={styles.passwordContainer}>
            <Text style={styles.passwordText} selectable>{password}</Text>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopyPassword}>
                <Text style={styles.copyButtonText}>Copy</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Length: {length}</Text>
            <Slider
              style={{ flex: 1 }}
              minimumValue={8}
              maximumValue={64}
              step={1}
              value={length}
              onValueChange={setLength}
              minimumTrackTintColor={COLORS.primary}
              maximumTrackTintColor={COLORS.textSecondary}
              thumbTintColor={COLORS.primary}
            />
          </View>

          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Include Numbers</Text>
            <Switch
              trackColor={{ false: COLORS.textSecondary, true: COLORS.primary }}
              thumbColor={useNumbers ? COLORS.surface : COLORS.surface}
              onValueChange={() => setUseNumbers(previousState => !previousState)}
              value={useNumbers}
            />
          </View>

          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Include Symbols</Text>
            <Switch
              trackColor={{ false: COLORS.textSecondary, true: COLORS.primary }}
              thumbColor={useSymbols ? COLORS.surface : COLORS.surface}
              onValueChange={() => setUseSymbols(previousState => !previousState)}
              value={useSymbols}
            />
          </View>

          <TouchableOpacity style={styles.generateButton} onPress={handleGeneratePassword}>
            <Text style={styles.buttonText}>Regenerate</Text>
          </TouchableOpacity>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={[styles.button, styles.buttonClose]} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.buttonUse]} onPress={handleUsePassword}>
              <Text style={styles.buttonText}>Use Password</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        width: '90%',
        margin: SIZES.margin,
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radius,
        padding: SIZES.padding,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        ...FONTS.h2,
        marginBottom: SIZES.margin,
        color: COLORS.textPrimary,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        paddingHorizontal: SIZES.padding,
        paddingVertical: SIZES.margin,
        borderRadius: SIZES.radius,
        marginBottom: SIZES.margin,
        width: '100%',
    },
    passwordText: {
        ...FONTS.body,
        flex: 1,
        color: COLORS.textPrimary,
    },
    copyButton: {
        marginLeft: SIZES.margin,
        padding: 5,
    },
    copyButtonText: {
        ...FONTS.bodyBold,
        color: COLORS.primary,
    },
    optionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: SIZES.margin,
    },
    optionLabel: {
        ...FONTS.body,
        color: COLORS.textPrimary,
    },
    generateButton: {
        backgroundColor: COLORS.secondary,
        borderRadius: SIZES.buttonRadius,
        padding: SIZES.margin,
        width: '100%',
        alignItems: 'center',
        marginTop: SIZES.margin,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: SIZES.padding,
    },
    button: {
        borderRadius: SIZES.buttonRadius,
        padding: SIZES.margin,
        elevation: 2,
        flex: 1,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    buttonClose: {
        backgroundColor: COLORS.textSecondary,
    },
    buttonUse: {
        backgroundColor: COLORS.primary,
    },
    buttonText: {
        ...FONTS.bodyBold,
        color: COLORS.surface,
    }
});

export default PasswordGeneratorModal;
