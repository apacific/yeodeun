import { MD3DarkTheme as DefaultDarkTheme, configureFonts } from 'react-native-paper';

const fonts = configureFonts({
  config: {
    displayLarge: { fontFamily: 'Paperlogy-9Black', fontWeight: '900' },
    displayMedium: { fontFamily: 'Paperlogy-8ExtraBold', fontWeight: '800' },
    displaySmall: { fontFamily: 'Paperlogy-7Bold', fontWeight: '700' },
    headlineLarge: { fontFamily: 'Paperlogy-7Bold', fontWeight: '700' },
    headlineMedium: { fontFamily: 'Paperlogy-6SemiBold', fontWeight: '600' },
    headlineSmall: { fontFamily: 'Paperlogy-6SemiBold', fontWeight: '600' },
    titleLarge: { fontFamily: 'Paperlogy-6SemiBold', fontWeight: '600' },
    titleMedium: { fontFamily: 'Paperlogy-5Medium', fontWeight: '500' },
    titleSmall: { fontFamily: 'Paperlogy-5Medium', fontWeight: '500' },
    labelLarge: { fontFamily: 'Paperlogy-5Medium', fontWeight: '500' },
    labelMedium: { fontFamily: 'Paperlogy-4Regular', fontWeight: '400' },
    labelSmall: { fontFamily: 'Paperlogy-4Regular', fontWeight: '400' },
    bodyLarge: { fontFamily: 'Paperlogy-4Regular', fontWeight: '400' },
    bodyMedium: { fontFamily: 'Paperlogy-4Regular', fontWeight: '400' },
    bodySmall: { fontFamily: 'Paperlogy-3Light', fontWeight: '300' },
  },
});

const screenBackground = '#1A1A1A';

/**
 * App theme.
 */
export const appTheme = {
  ...DefaultDarkTheme,
  fonts,
  layout: {
    screenBackground,
  },
  colors: {
    ...DefaultDarkTheme.colors,
    // Primary color - bright, clean, modern
    primary: '#2196F3', // Bright blue
    secondary: '#FF6F00', // Bright orange
    tertiary: '#00BCD4', // Cyan

    // Backgrounds
    background: screenBackground, // Dark background for contrast
    surface: '#242424', // Slightly lighter surface
    surfaceVariant: '#3A3A3A',

    // State colors
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#F44336',
    info: '#2196F3',

    // Text colors with high contrast
    onBackground: '#FFFFFF',
    onSurface: '#FFFFFF',

    // Semantic colors
    outline: '#666666',
    outlineVariant: '#555555',

    // Disabled/muted
    surfaceDisabled: '#1F1F1F',
    onSurfaceDisabled: '#757575',
  },
  roundness: 0,
};

/**
 * Spacing.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

/**
 * Border radius.
 */
export const borderRadius = {
  sm: 0,
  md: 0,
  lg: 0,
  xl: 0,
  full: 0,
};

/**
 * Font size.
 */
export const fontSize = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

/**
 * Font weight.
 */
export const fontWeight = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

/**
 * Shadows.
 */
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
};
