import React from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import { appTheme, spacing } from '../theme/theme';
import { AppText as Text } from './AppText';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
}

/**
 * Renders a consistent page header with an optional back action.
 *
 * @param title Header text shown in uppercase.
 * @param onBack Optional callback invoked when the back icon is pressed.
 * @returns Header layout used by top-level screens.
 */
export const ScreenHeader = ({ title, onBack }: ScreenHeaderProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.side}>
        {onBack ? (
          <IconButton
            icon="chevron-left"
            size={24}
            onPress={onBack}
            iconColor={appTheme.colors.onSurface}
          />
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      <Text variant="titleLarge" style={styles.title}>
        {title.toUpperCase()}
      </Text>

      <View style={styles.side}>
        <View style={styles.placeholder} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  placeholder: {
    width: 48,
  },
  side: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 72,
  },
  title: {
    color: appTheme.colors.onSurface,
    flex: 1,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
  },
});
