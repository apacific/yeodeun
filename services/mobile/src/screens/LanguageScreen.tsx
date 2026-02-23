import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { RadioButton, Text } from 'react-native-paper';
import { ScreenHeader } from '../components';
import { RootStackScreenProps } from '../navigation/types';
import { appTheme, spacing } from '../theme/theme';
import {
  AppLanguage,
  getActiveLanguage,
  languageOptions,
  setLanguage,
} from '../i18n';

/**
 * Language screen.
 */
export const LanguageScreen = ({
  navigation,
}: RootStackScreenProps<'Language'>) => {
  const [selected, setSelected] = useState<AppLanguage>(getActiveLanguage());

  const handleSelect = async (code: AppLanguage) => {
    setSelected(code);
    await setLanguage(code);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Language" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        {languageOptions.map((option) => {
          const isSelected = option.code === selected;
          return (
            <TouchableOpacity
              key={option.code}
              style={styles.row}
              onPress={() => handleSelect(option.code)}
            >
              <RadioButton
                value={option.code}
                status={isSelected ? 'checked' : 'unchecked'}
              />
              <Text style={styles.label}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: appTheme.colors.background,
    flex: 1,},
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,},
  row: {
    alignItems: 'center',
    backgroundColor: appTheme.colors.surface,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,},
  label: {
    color: appTheme.colors.onSurface,},
});
