import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { LogoMark } from '../components';
import { RootStackScreenProps } from '../navigation/types';
import { appTheme, spacing } from '../theme/theme';

/**
 * Home screen.
 */
export const HomeScreen = ({ navigation }: RootStackScreenProps<'Home'>) => {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <View style={styles.logoSection}>
        <LogoMark size={165} />
        <Text variant="titleLarge" style={styles.title}>
          {t('brand.name').toUpperCase()}
        </Text>
      </View>

      <View style={styles.menu}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('OrderMenu')}
          style={styles.primaryButton}
          contentStyle={styles.buttonContent}
        >
          {t('home.createEditOrder')}
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('About')}
          style={styles.secondaryButton}
          contentStyle={styles.buttonContent}
        >
          {t('home.about')}
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('Gallery')}
          style={styles.secondaryButton}
          contentStyle={styles.buttonContent}
        >
          {t('home.gallery')}
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('Contact')}
          style={styles.secondaryButton}
          contentStyle={styles.buttonContent}
        >
          {t('home.contact')}
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: appTheme.colors.background,
    flex: 1,
    justifyContent: 'flex-start',
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,},
  logoSection: {
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.xxl,
  },
  title: {
    color: appTheme.colors.onBackground,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 3.2,
    lineHeight: 36,},
  menu: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  primaryButton: {
  },
  secondaryButton: {
    borderColor: appTheme.colors.outlineVariant,},
  buttonContent: {
    paddingVertical: spacing.sm,},
});
