import '@formatjs/intl-getcanonicallocales/polyfill';
import '@formatjs/intl-locale/polyfill';
import '@formatjs/intl-pluralrules/polyfill';
import '@formatjs/intl-pluralrules/locale-data/en';
import '@formatjs/intl-pluralrules/locale-data/ko';
import '@formatjs/intl-pluralrules/locale-data/ja';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text as RNText, TextInput as RNTextInput, View, useWindowDimensions } from 'react-native';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { IconButton, PaperProvider, Text as PaperText, TextInput as PaperTextInput } from 'react-native-paper';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { appTheme, createAppTheme } from './src/theme/theme';
import { i18n as i18nInstance, initI18n } from './src/i18n';
import {
  ALaCarteScreen,
  AboutScreen,
  AllMenuItemsScreen,
  BuilderScreen,
  CartScreen,
  CheckoutScreen,
  ContactScreen,
  GalleryScreen,
  HomeScreen,
  OrderMenuScreen,
} from './src/screens';
import { RootStackParamList } from './src/navigation/types';
import { LanguageToggle } from './src/components';
import { useOrderStore } from './src/store/orderStore';

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
      },
      mutations: {
        retry: 1,
      },
    },
  });

const queryClient = createQueryClient();

const baseRNTextDefaultProps = (RNText as any).defaultProps ?? {};
const basePaperTextDefaultProps = (PaperText as any).defaultProps ?? {};
const baseRNTextInputDefaultProps = (RNTextInput as any).defaultProps ?? {};
const basePaperTextInputDefaultProps = (PaperTextInput as any).defaultProps ?? {};

const applyGlobalTextDefaults = (fontFamily: string): void => {
  const centeredTextStyle = {
    textAlign: 'center',
    fontFamily,
  } as const;

  (RNText as any).defaultProps = {
    ...baseRNTextDefaultProps,
    style: [baseRNTextDefaultProps.style ?? null, centeredTextStyle],
  };

  (PaperText as any).defaultProps = {
    ...basePaperTextDefaultProps,
    style: [basePaperTextDefaultProps.style ?? null, centeredTextStyle],
  };

  (RNTextInput as any).defaultProps = {
    ...baseRNTextInputDefaultProps,
    style: [baseRNTextInputDefaultProps.style ?? null, centeredTextStyle],
    placeholderTextColor: baseRNTextInputDefaultProps.placeholderTextColor,
  };

  (PaperTextInput as any).defaultProps = {
    ...basePaperTextInputDefaultProps,
    style: [basePaperTextInputDefaultProps.style ?? null, centeredTextStyle],
  };
};

export default function App() {
  const [i18nReady, setI18nReady] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState('en');
  const [currentRouteName, setCurrentRouteName] = useState<keyof RootStackParamList | undefined>();
  const { height } = useWindowDimensions();
  const isEnglishSelected = activeLanguage.startsWith('en');
  const defaultFontFamily = isEnglishSelected ? 'Aller_Bd' : 'Paperlogy-4Regular';
  const theme = useMemo(() => createAppTheme(isEnglishSelected), [isEnglishSelected]);
  const topViewportMargin = Math.round(height * 0.12);
  const bottomViewportMargin = Math.round(height * 0.07);
  const contentStyle = {
    backgroundColor: theme.layout.screenBackground,
    paddingTop: topViewportMargin,
    paddingBottom: bottomViewportMargin,
  } as const;
  const [fontsLoaded] = useFonts({
    Aller_Bd: require('./assets/fonts/Aller_Bd.ttf'),
    'Paperlogy-1Thin': require('./assets/fonts/Paperlogy-1Thin.ttf'),
    'Paperlogy-2ExtraLight': require('./assets/fonts/Paperlogy-2ExtraLight.ttf'),
    'Paperlogy-3Light': require('./assets/fonts/Paperlogy-3Light.ttf'),
    'Paperlogy-4Regular': require('./assets/fonts/Paperlogy-4Regular.ttf'),
    'Paperlogy-5Medium': require('./assets/fonts/Paperlogy-5Medium.ttf'),
    'Paperlogy-6SemiBold': require('./assets/fonts/Paperlogy-6SemiBold.ttf'),
    'Paperlogy-7Bold': require('./assets/fonts/Paperlogy-7Bold.ttf'),
    'Paperlogy-8ExtraBold': require('./assets/fonts/Paperlogy-8ExtraBold.ttf'),
    'Paperlogy-9Black': require('./assets/fonts/Paperlogy-9Black.ttf'),
  });

  useEffect(() => {
    const handleLanguageChanged = (language: string): void => {
      setActiveLanguage((language || 'en').toLowerCase());
    };

    i18nInstance.on('languageChanged', handleLanguageChanged);
    initI18n()
      .then(() => {
        handleLanguageChanged(i18nInstance.resolvedLanguage || i18nInstance.language || 'en');
      })
      .finally(() => setI18nReady(true));

    return () => {
      i18nInstance.off('languageChanged', handleLanguageChanged);
    };
  }, []);

  useEffect(() => {
    applyGlobalTextDefaults(defaultFontFamily);
  }, [defaultFontFamily]);


  if (!fontsLoaded || !i18nReady) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={theme}>
            <View style={styles.appRoot}>
              <NavigationContainer
                ref={navigationRef}
                onReady={() => setCurrentRouteName(navigationRef.getCurrentRoute()?.name as keyof RootStackParamList | undefined)}
                onStateChange={() => setCurrentRouteName(navigationRef.getCurrentRoute()?.name as keyof RootStackParamList | undefined)}
              >
                <Stack.Navigator
                  initialRouteName="Home"
                  screenOptions={{
                    headerShown: false,
                    contentStyle,
                  }}
                >
                  <Stack.Screen name="Home" component={HomeScreen} />
                  <Stack.Screen name="OrderMenu" component={OrderMenuScreen} />
                  <Stack.Screen name="ALaCarte" component={ALaCarteScreen} />
                  <Stack.Screen name="Builder" component={BuilderScreen} />
                  <Stack.Screen name="Cart" component={CartScreen} />
                  <Stack.Screen name="Checkout" component={CheckoutScreen} />
                  <Stack.Screen name="About" component={AboutScreen} />
                  <Stack.Screen name="AllMenuItems" component={AllMenuItemsScreen} />
                  <Stack.Screen name="Gallery" component={GalleryScreen} />
                  <Stack.Screen name="Contact" component={ContactScreen} />
                </Stack.Navigator>
              </NavigationContainer>
              <TopOverlayControls currentRouteName={currentRouteName} />
            </View>
          </PaperProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Global top overlay controls.
 */
const TopOverlayControls = ({
  currentRouteName,
}: {
  currentRouteName?: keyof RootStackParamList;
}) => {
  const hasOrder = useOrderStore((state) => {
    const sel = state.currentSelection ?? {};
    const aLaCarteItems = state.aLaCarteItems ?? [];
    const comboMeals = state.comboMeals ?? [];
    const sauceIds = Array.isArray((sel as any).sauceIds) ? (sel as any).sauceIds : [];
    const toppingIds = Array.isArray((sel as any).toppingIds) ? (sel as any).toppingIds : [];

    return Boolean(
      comboMeals.length > 0 ||
      aLaCarteItems.length > 0 ||
      (sel as any).entreeId ||
      (sel as any).vegetableId ||
      (sel as any).fruitId ||
      (sel as any).sideId ||
      (sel as any).beverageId ||
      sauceIds.length > 0 ||
      toppingIds.length > 0
    );
  });

  const showPersistentOrderButton =
    hasOrder && currentRouteName !== 'OrderMenu' && currentRouteName !== 'Cart';

  return (
    <View style={styles.topOverlayRow}>
      <LanguageToggle />
      {showPersistentOrderButton ? (
        <IconButton
          icon="shopping-outline"
          size={20}
          onPress={() => {
            if (navigationRef.isReady()) {
              navigationRef.navigate('Cart');
            }
          }}
          style={styles.orderDockButton}
          iconColor={appTheme.colors.onBackground}
        />
      ) : (
        <View />
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
  },
  orderDockButton: {
    backgroundColor: appTheme.colors.background,
    borderColor: appTheme.colors.onBackground,
    borderWidth: 1,
    margin: 0,
  },
  topOverlayRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 16,
    position: 'absolute',
    right: 16,
    top: 48,
  },
});
