import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  TextInput as RNTextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { AsYouType, getCountries, getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';
import { useTranslation } from 'react-i18next';
import { useContactSubmit } from '../api/hooks';
import { ScreenHeader } from '../components';
import { RootStackScreenProps } from '../navigation/types';
import { appTheme, spacing } from '../theme/theme';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

const normalizeEmail = (value: string) =>
  value.replace(/\s+/g, '').toLowerCase();

const DEFAULT_COUNTRY_CODE: CountryCode = 'US';

const isCountryCode = (value: string): value is CountryCode =>
  getCountries().includes(value as CountryCode);

/**
 * Contact screen.
 */
export const ContactScreen = ({
  navigation,
  route,
}: RootStackScreenProps<'Contact'>) => {
  const { t, i18n } = useTranslation();
  const submitMutation = useContactSubmit();

  const [message, setMessage] = useState(route.params?.prefill?.message ?? '');
  const [email, setEmail] = useState(route.params?.prefill?.email ?? '');
  const [phone, setPhone] = useState(route.params?.prefill?.phone ?? '');
  const getLocaleCountry = (): CountryCode => {
    try {
      const locale =
        Intl.DateTimeFormat().resolvedOptions().locale || 'en-US';
      const parts = locale.split(/[-_]/);
      const candidate = parts.length > 1 ? parts[1].toUpperCase() : DEFAULT_COUNTRY_CODE;
      return isCountryCode(candidate) ? candidate : DEFAULT_COUNTRY_CODE;
    } catch {
      return DEFAULT_COUNTRY_CODE;
    }
  };

  const [countryCode, setCountryCode] = useState<CountryCode>(getLocaleCountry());
  const [callingCode, setCallingCode] = useState(() => {
    try {
      return getCountryCallingCode(getLocaleCountry());
    } catch {
      return '1';
    }
  });
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const hasAnyField = useMemo(
    () => message.trim() || email.trim() || phone.trim(),
    [message, email, phone]
  );

  const countryOptions = useMemo(() => {
    const displayNames = typeof Intl !== 'undefined' && 'DisplayNames' in Intl
      ? new Intl.DisplayNames([i18n.language], { type: 'region' })
      : null;
    return getCountries().map((code) => {
      const name = displayNames?.of(code) ?? code;
      const flag = code
        .toUpperCase()
        .replace(/./g, (char) =>
          String.fromCodePoint(127397 + char.charCodeAt(0))
        );
      return {
        code,
        name,
        callingCode: getCountryCallingCode(code),
        flag,
      };
    });
  }, [i18n.language]);

  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return countryOptions;
    const q = countrySearch.trim().toLowerCase();
    return countryOptions.filter((c) =>
      c.name.toLowerCase().includes(q) || c.callingCode.includes(q)
    );
  }, [countryOptions, countrySearch]);

  useEffect(() => {
    try {
      const localCode = getLocaleCountry();
      const localCalling = getCountryCallingCode(localCode);
      setCountryCode(localCode);
      setCallingCode(localCalling);
    } catch {
      // fallback stays as-is
    }
  }, []);

  const handleSubmit = async () => {
    const trimmedMessage = message.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedMessage && !trimmedEmail && !trimmedPhone) {
      setError(t('contact.form.errorAtLeastOne'));
      return;
    }

    if (trimmedEmail && !emailRegex.test(trimmedEmail)) {
      setError(t('contact.form.errorEmail'));
      return;
    }

    if (trimmedPhone) {
      const parsed = parsePhoneNumberFromString(
        trimmedPhone,
        countryCode
      );
      if (!parsed || !parsed.isValid()) {
        setError(t('contact.form.errorPhone'));
        return;
      }
    }

    setError(null);
    try {
      await submitMutation.mutateAsync({
        message: trimmedMessage || undefined,
        email: trimmedEmail || undefined,
        phone: trimmedPhone || undefined,
      });
      Alert.alert(t('contact.form.successTitle'), t('contact.form.successMessage'));
      setMessage('');
      setEmail('');
      setPhone('');
    } catch (err: any) {
      setError(err?.message ?? t('contact.form.errorSubmit'));
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('contact.title')} onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Text style={styles.infoText}>{t('contact.mailingAddress')}</Text>
        <Text style={styles.infoValue}>{t('contact.addressLine1')}</Text>
        <Text style={styles.infoValue}>{t('contact.addressLine2')}</Text>

        <Text style={styles.infoText}>{t('contact.emailLabel')}</Text>
        <Text style={styles.infoValue}>{t('contact.emailValue')}</Text>

        <Text style={styles.infoText}>{t('contact.phoneLabel')}</Text>
        <Text style={styles.infoValue}>{t('contact.phoneValue')}</Text>

        <Text style={styles.infoText}>{t('contact.instagramLabel')}</Text>
        <Text style={styles.infoValue}>{t('contact.instagramValue')}</Text>

        <View style={styles.form}>
          <TextInput
            label={t('contact.form.messageLabel')}
            mode="outlined"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            style={styles.input}
          />
          <TextInput
            label={t('contact.form.emailLabel')}
            mode="outlined"
            value={email}
            onChangeText={(value) => setEmail(normalizeEmail(value))}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
          <View style={styles.phoneRow}>
            <TouchableOpacity
              onPress={() => setShowCountryPicker(true)}
              style={styles.countryButton}
            >
              <Text style={styles.countryCodeText}>+{callingCode}</Text>
            </TouchableOpacity>
            <TextInput
              label={t('contact.form.phoneLabel')}
              mode="outlined"
              value={phone}
              onChangeText={(value) => {
                const trimmed = value.trim();
                if (trimmed.startsWith('+')) {
                  const formatted = new AsYouType().input(trimmed);
                  setPhone(formatted);
                  return;
                }
                const formatter = new AsYouType(countryCode);
                const formatted = formatter.input(trimmed);
                setPhone(formatted);
              }}
              keyboardType="phone-pad"
              style={[styles.input, styles.phoneInput]}
            />
          </View>
          <Modal
            transparent
            visible={showCountryPicker}
            animationType="fade"
            onRequestClose={() => setShowCountryPicker(false)}
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <Text variant="titleMedium" style={styles.modalTitle}>
                    {t('contact.form.selectCountry')}
                  </Text>
                  <Button onPress={() => setShowCountryPicker(false)}>
                    {t('contact.form.close')}
                  </Button>
                </View>
                <RNTextInput
                  placeholder={t('contact.form.searchPlaceholder')}
                  placeholderTextColor={appTheme.colors.onSurfaceDisabled}
                  value={countrySearch}
                  onChangeText={setCountrySearch}
                  style={styles.searchInput}
                />
                <FlatList
                  data={filteredCountries}
                  keyExtractor={(item) => item.code}
                  contentContainerStyle={styles.modalList}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.countryRow}
                      onPress={() => {
                        setCountryCode(item.code);
                        setCallingCode(item.callingCode);
                        setShowCountryPicker(false);
                      }}
                    >
                      <Text style={styles.countryFlag}>{item.flag}</Text>
                      <Text style={styles.countryName}>{item.name}</Text>
                      <Text style={styles.countryDial}>
                        +{item.callingCode}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </Modal>
          {error && <Text style={styles.error}>{error}</Text>}
          <Button
            mode="contained"
            onPress={handleSubmit}
            disabled={!hasAnyField || submitMutation.isPending}
          >
            {t('contact.form.submit')}
          </Button>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: appTheme.colors.background,
    flex: 1,},
  content: {
    gap: spacing.xs,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,},
  infoText: {
    color: appTheme.colors.onSurfaceDisabled,
    marginTop: spacing.md,},
  infoValue: {
    color: appTheme.colors.onSurface,},
  form: {
    gap: spacing.md,
    marginTop: spacing.lg,},
  phoneRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,},
  countryButton: {
    backgroundColor: appTheme.colors.surface,
    borderColor: appTheme.colors.outlineVariant,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,},
  countryCodeText: {
    color: appTheme.colors.onSurface,},
  phoneInput: {
    flex: 1,},
  modalBackdrop: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,},
  modalCard: {
    backgroundColor: appTheme.colors.surface,
    maxHeight: '80%',
    padding: spacing.md,},
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,},
  modalTitle: {
    color: appTheme.colors.onSurface,},
  searchInput: {
    backgroundColor: appTheme.colors.background,
    color: appTheme.colors.onSurface,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,},
  modalList: {
    gap: spacing.sm,},
  countryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,},
  countryFlag: {
    fontSize: 18,},
  countryName: {
    color: appTheme.colors.onSurface,
    flex: 1,},
  countryDial: {
    color: appTheme.colors.onSurfaceDisabled,},
  input: {
    backgroundColor: appTheme.colors.surface,},
  error: {
    color: appTheme.colors.error,},
});
