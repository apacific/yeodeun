import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './resources/en';
import { ja } from './resources/ja';
import { ko } from './resources/ko';

export const LANGUAGE_STORAGE_KEY = 'yeodeun:language';

export const supportedLanguages = ['en', 'ko', 'ja'] as const;
export type AppLanguage = (typeof supportedLanguages)[number];

export const languageOptions: { code: AppLanguage; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'ko', label: 'Korean (한국어)' },
  { code: 'ja', label: 'Japanese (日本語)' },
];

const resources = {
  en: { translation: en },
  ja: { translation: ja },
  ko: { translation: ko },
};

export const initI18n = async (): Promise<void> => {
  if (!i18n.isInitialized) {
    await i18n.use(initReactI18next).init({
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      lng: 'en',
      resources,
    });
  }

  const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored && supportedLanguages.includes(stored as AppLanguage)) {
    await i18n.changeLanguage(stored);
    return;
  }

  // Ensure first launch and invalid stored values both resolve to English.
  await i18n.changeLanguage('en');
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
};

export const setLanguage = async (language: AppLanguage): Promise<void> => {
  await i18n.changeLanguage(language);
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
};

export const getActiveLanguage = (): AppLanguage => {
  if (supportedLanguages.includes(i18n.language as AppLanguage)) {
    return i18n.language as AppLanguage;
  }
  return 'en';
};

export { i18n };
