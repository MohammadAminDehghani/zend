import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { BlurView } from 'expo-blur';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons: {
    text: string;
    onPress: () => void;
    style?: 'default' | 'destructive';
  }[];
}

export default function CustomAlert({ visible, title, message, buttons }: CustomAlertProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.container}>
        <BlurView intensity={20} style={styles.blurContainer}>
          <View style={styles.alertContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            <View style={styles.buttonContainer}>
              {buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    button.style === 'destructive' ? styles.destructiveButton : styles.defaultButton,
                    index > 0 && styles.buttonMargin
                  ]}
                  onPress={button.onPress}
                >
                  <Text style={[
                    styles.buttonText,
                    button.style === 'destructive' ? styles.destructiveButtonText : styles.defaultButtonText
                  ]}>
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </BlurView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  blurContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    width: Dimensions.get('window').width - spacing.xl * 2,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: colors.shadow.color,
    shadowOffset: colors.shadow.offset,
    shadowOpacity: colors.shadow.opacity,
    shadowRadius: colors.shadow.radius,
    elevation: 5,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: typography.fontSize.base,
    color: colors.gray[700],
    marginBottom: spacing.lg,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.base,
    alignItems: 'center',
  },
  defaultButton: {
    backgroundColor: colors.gray[100],
  },
  destructiveButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  buttonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '500',
  },
  defaultButtonText: {
    color: colors.primary,
  },
  destructiveButtonText: {
    color: colors.gray[600],
  },
  buttonMargin: {
    marginLeft: spacing.sm,
  },
}); 