import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { LogoMark, ScreenHeader } from '../components';
import { RootStackScreenProps } from '../navigation/types';
import { appTheme, spacing } from '../theme/theme';

/**
 * Order menu screen.
 */
export const OrderMenuScreen = ({
  navigation,
}: RootStackScreenProps<'OrderMenu'>) => {
  const { t } = useTranslation();

  const handleBackToHome = useCallback(() => {
    (navigation as any).reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  }, [navigation]);
  return (
    <View style={styles.container}>
      <ScreenHeader title={t('orderMenu.title')} onBack={handleBackToHome} />

      <View style={styles.logoSection}>
        <LogoMark size={120} />
        <Text variant="titleMedium" style={styles.subtitle}>
          {t('orderMenu.subtitle')}
        </Text>
      </View>

      <View style={styles.menu}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('ALaCarte')}
          style={styles.primaryButton}
          contentStyle={styles.buttonContent}
        >
          {t('orderMenu.actions.aLaCarte')}
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('Builder')}
          style={styles.secondaryButton}
          contentStyle={styles.buttonContent}
        >
          {t('orderMenu.actions.buildMeal')}
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('Cart')}
          style={styles.secondaryButton}
          contentStyle={styles.buttonContent}
        >
          {t('orderMenu.actions.viewOrder')}
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContent: {
    paddingVertical: spacing.sm,},
  container: {
    backgroundColor: appTheme.colors.background,
    flex: 1,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,},
  logoSection: {
    alignItems: 'center',
    gap: spacing.xxl,
    paddingVertical: spacing.xxl,},
  menu: {
    gap: spacing.md,},
  primaryButton: {
  },
  secondaryButton: {
    borderColor: appTheme.colors.outlineVariant,},
  subtitle: {
    color: appTheme.colors.onBackground,
    fontSize: 20,},
});


