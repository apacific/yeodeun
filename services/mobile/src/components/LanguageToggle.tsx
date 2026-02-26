import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppLanguage, setLanguage, supportedLanguages } from '../i18n';
import { appTheme, spacing } from '../theme/theme';

const languageFlagLabel: Record<AppLanguage, string> = {
  en: '🇺🇸',
  ko: '🇰🇷',
  ja: '🇯🇵',
};

const languageTextLabel: Record<AppLanguage, string> = {
  en: 'EN',
  ko: '한국어',
  ja: '日本語',
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
      <Text style={styles.flag}>{languageFlagLabel[activeLanguage]}</Text>
      <Text style={styles.label}>{languageTextLabel[activeLanguage]}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    minWidth: 72,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  flag: {
    fontSize: 18,
    marginRight: spacing.xs,
  },
  label: {
    color: appTheme.colors.onBackground,
    fontSize: 16,
    fontWeight: '700',
  },
});
