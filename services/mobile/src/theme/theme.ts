import { MD3DarkTheme as DefaultDarkTheme, configureFonts } from 'react-native-paper';

const paperlogyFonts = configureFonts({
  config: {
    bodyLarge: { fontFamily: 'Paperlogy-4Regular', fontWeight: '400' },
    bodyMedium: { fontFamily: 'Paperlogy-4Regular', fontWeight: '400' },
    bodySmall: { fontFamily: 'Paperlogy-3Light', fontWeight: '300' },
    displayLarge: { fontFamily: 'Paperlogy-9Black', fontWeight: '900' },
    displayMedium: { fontFamily: 'Paperlogy-8ExtraBold', fontWeight: '800' },
    displaySmall: { fontFamily: 'Paperlogy-7Bold', fontWeight: '700' },
    headlineLarge: { fontFamily: 'Paperlogy-7Bold', fontWeight: '700' },
    headlineMedium: { fontFamily: 'Paperlogy-6SemiBold', fontWeight: '600' },
    headlineSmall: { fontFamily: 'Paperlogy-6SemiBold', fontWeight: '600' },
    labelLarge: { fontFamily: 'Paperlogy-5Medium', fontWeight: '500' },
    labelMedium: { fontFamily: 'Paperlogy-4Regular', fontWeight: '400' },
    labelSmall: { fontFamily: 'Paperlogy-4Regular', fontWeight: '400' },
    titleLarge: { fontFamily: 'Paperlogy-6SemiBold', fontWeight: '600' },
    titleMedium: { fontFamily: 'Paperlogy-5Medium', fontWeight: '500' },
    titleSmall: { fontFamily: 'Paperlogy-5Medium', fontWeight: '500' },
  },
});

const allerFonts = configureFonts({
  config: {
    bodyLarge: { fontFamily: 'Aller_Bd', fontWeight: 'normal' },
    bodyMedium: { fontFamily: 'Aller_Bd', fontWeight: 'normal' },
    bodySmall: { fontFamily: 'Aller_Bd', fontWeight: 'normal' },
    displayLarge: { fontFamily: 'Aller_Bd', fontWeight: 'normal' },
    displayMedium: { fontFamily: 'Aller_Bd', fontWeight: 'normal' },
    displaySmall: { fontFamily: 'Aller_Bd', fontWeight: 'normal' },
    headlineLarge: { fontFamily: 'Aller_Bd', fontWeight: 'normal' },
    headlineMedium: { fontFamily: 'Aller_Bd', fontWeight: 'normal' },
    headlineSmall: { fontFamily: 'Aller_Bd', fontWeight: 'normal' },
    labelLarge: { fontFamily: 'Aller_Bd', fontWeight: 'normal' },
    labelMedium: { fontFamily: 'Aller_Bd', fontWeight: 'normal' },
    labelSmall: { fontFamily: 'Aller_Bd', fontWeight: 'normal' },
    titleLarge: { fontFamily: 'Aller_Bd', fontWeight: 'normal' },
    titleMedium: { fontFamily: 'Aller_Bd', fontWeight: 'normal' },
    titleSmall: { fontFamily: 'Aller_Bd', fontWeight: 'normal' },
  },
});

const screenBackground = '#1A1A1A';

const colors = {
  ...DefaultDarkTheme.colors,
  background: screenBackground,
  error: '#F44336',
  info: '#2196F3',
  onBackground: '#FFFFFF',
  onSurface: '#FFFFFF',
  onSurfaceDisabled: '#757575',
  outline: '#666666',
  outlineVariant: '#555555',
  primary: '#2196F3',
  secondary: '#FF6F00',
  success: '#4CAF50',
  surface: '#242424',
  surfaceDisabled: '#1F1F1F',
  surfaceVariant: '#3A3A3A',
  tertiary: '#00BCD4',
  warning: '#FFC107',
};

export const createAppTheme = (useEnglishFont = false) => ({
  ...DefaultDarkTheme,
  colors,
  fonts: useEnglishFont ? allerFonts : paperlogyFonts,
  layout: {
    screenBackground,
  },
  roundness: 0,
});

/**
 * App theme.
 */
export const appTheme = createAppTheme(false);

/**
 * Spacing.
 */
export const spacing = {
  lg: 16,
  md: 12,
  sm: 8,
  xl: 24,
  xs: 4,
  xxl: 32,
};

/**
 * Border radius.
 */
export const borderRadius = {
  full: 0,
  lg: 0,
  md: 0,
  sm: 0,
  xl: 0,
};

/**
 * Font size.
 */
export const fontSize = {
  base: 14,
  lg: 18,
  md: 16,
  sm: 12,
  xl: 20,
  xs: 10,
  xxl: 24,
  xxxl: 32,
};

/**
 * Font weight.
 */
export const fontWeight = {
  bold: '700' as const,
  light: '300' as const,
  medium: '500' as const,
  regular: '400' as const,
  semibold: '600' as const,
};

/**
 * Shadows.
 */
export const shadows = {
  lg: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  md: {
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  sm: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
};
