import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppLanguage, setLanguage, supportedLanguages } from '../i18n';
import { appTheme, spacing } from '../theme/theme';

const languageFlagLabel: Record<AppLanguage, string> = {
  en: '🇺🇸',
  ko: '🇰🇷',
  ja: '🇯🇵',
};

/**
 * Cycles application language in-place.
 */
export const LanguageToggle = () => {
  const { i18n } = useTranslation();

  const activeLanguage = useMemo<AppLanguage>(() => {
    const current = i18n.resolvedLanguage ?? i18n.language;
    if (supportedLanguages.includes(current as AppLanguage)) {
      return current as AppLanguage;
    }
    return 'en';
  }, [i18n.language, i18n.resolvedLanguage]);

  const handlePress = async () => {
    const index = supportedLanguages.indexOf(activeLanguage);
    const next = supportedLanguages[(index + 1) % supportedLanguages.length];
    await setLanguage(next);
  };

  return (
    <Pressable onPress={handlePress} style={styles.button}>
      <View>
        <Text style={styles.label}>{languageFlagLabel[activeLanguage]}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  label: {
    fontSize: 18,
  },
});
