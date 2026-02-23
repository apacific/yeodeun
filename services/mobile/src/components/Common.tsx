import React, { ReactNode } from 'react';
import {
  StyleSheet,
  View,
  ViewStyle,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Text } from 'react-native-paper';
import { appTheme, spacing, shadows } from '../theme/theme';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
}

/**
 * Card.
 */
export const Card = React.memo(
  ({ children, style, onPress, disabled, testID }: CardProps) => {
    return (
      <View
        style={[
          styles.card,
          disabled && styles.disabled,
          style,
        ]}
        onTouchEnd={!disabled ? onPress : undefined}
        testID={testID}
      >
        {children}
      </View>
    );
  }
);

Card.displayName = 'Card';

interface BadgeProps {
  label: string;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
}

/**
 * Badge.
 */
export const Badge = React.memo(
  ({ label, color, backgroundColor, style }: BadgeProps) => {
    return (
      <View
        style={[
          styles.badge,
          backgroundColor && { backgroundColor },
          style,
        ]}
      >
        <Text
          style={[
            styles.badgeText,
            color && { color },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    );
  }
);

Badge.displayName = 'Badge';

interface SectionProps {
  title?: string;
  children: ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

/**
 * Section.
 */
export const Section = React.memo(
  ({ title, children, style, contentContainerStyle }: SectionProps) => {
    return (
      <View style={[styles.section, style]}>
        {title && (
          <Text
            variant="headlineSmall"
            style={styles.sectionTitle}
          >
            {title}
          </Text>
        )}
        <View style={contentContainerStyle}>{children}</View>
      </View>
    );
  }
);

Section.displayName = 'Section';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

/**
 * Loading overlay.
 */
export const LoadingOverlay = React.memo(
  ({ visible, message }: LoadingOverlayProps) => {
    if (!visible) return null;

    return (
      <View style={styles.loadingOverlay}>
        <ActivityIndicator
          size="large"
          color={appTheme.colors.primary}
        />
        {message && (
          <Text
            style={styles.loadingText}
            variant="bodyMedium"
          >
            {message}
          </Text>
        )}
      </View>
    );
  }
);

LoadingOverlay.displayName = 'LoadingOverlay';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
}

/**
 * Empty state.
 */
export const EmptyState = React.memo(
  ({ title, description, icon }: EmptyStateProps) => {
    return (
      <View style={styles.emptyState}>
        {icon && <View style={styles.emptyStateIcon}>{icon}</View>}
        <Text
          variant="titleMedium"
          style={styles.emptyStateTitle}
        >
          {title}
        </Text>
        {description && (
          <Text
            variant="bodySmall"
            style={styles.emptyStateDescription}
          >
            {description}
          </Text>
        )}
      </View>
    );
  }
);

EmptyState.displayName = 'EmptyState';

const styles = StyleSheet.create({
  card: {
    backgroundColor: appTheme.colors.surface,
    marginBottom: spacing.md,
    padding: spacing.md,
    ...shadows.sm,},
  disabled: {
    opacity: 0.5,},
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: appTheme.colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,},
  badgeText: {
    color: appTheme.colors.onPrimary || '#000',
    fontSize: 12,},
  section: {
    marginBottom: spacing.lg,},
  sectionTitle: {
    color: appTheme.colors.onBackground,
    fontWeight: '700',
    marginBottom: spacing.md,},
  loadingOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    zIndex: 1000,
    ...StyleSheet.absoluteFillObject,},
  loadingText: {
    color: appTheme.colors.onBackground,
    marginTop: spacing.md,},
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,},
  emptyStateIcon: {
    marginBottom: spacing.md,},
  emptyStateTitle: {
    color: appTheme.colors.onBackground,
    marginBottom: spacing.sm,
    textAlign: 'center',},
  emptyStateDescription: {
    color: appTheme.colors.onSurfaceDisabled,
    maxWidth: 280,
    textAlign: 'center',},
});
