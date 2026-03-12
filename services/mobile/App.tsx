import '@formatjs/intl-getcanonicallocales/polyfill';
import '@formatjs/intl-locale/polyfill';
import '@formatjs/intl-pluralrules/polyfill';
import '@formatjs/intl-pluralrules/locale-data/en';
import '@formatjs/intl-pluralrules/locale-data/ko';
import '@formatjs/intl-pluralrules/locale-data/ja';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text as RNText, TextInput as RNTextInput, View, useWindowDimensions } from 'react-native';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { IconButton, PaperProvider, Text as PaperText, TextInput as PaperTextInput } from 'react-native-paper';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { appTheme } from './src/theme/theme';
import { initI18n } from './src/i18n';
import { useTranslation } from 'react-i18next';
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

const centeredTextStyle = { textAlign: 'center' } as const;

(RNText as any).defaultProps = {
  ...((RNText as any).defaultProps ?? {}),
  style: [((RNText as any).defaultProps?.style ?? null), centeredTextStyle],
};

(PaperText as any).defaultProps = {
  ...((PaperText as any).defaultProps ?? {}),
  style: [((PaperText as any).defaultProps?.style ?? null), centeredTextStyle],
};

(RNTextInput as any).defaultProps = {
  ...((RNTextInput as any).defaultProps ?? {}),
  style: [((RNTextInput as any).defaultProps?.style ?? null), centeredTextStyle],
  placeholderTextColor: (RNTextInput as any).defaultProps?.placeholderTextColor,
};

(PaperTextInput as any).defaultProps = {
  ...((PaperTextInput as any).defaultProps ?? {}),
  style: [((PaperTextInput as any).defaultProps?.style ?? null), centeredTextStyle],
};

export default function App() {
  const [i18nReady, setI18nReady] = useState(false);
  const [currentRouteName, setCurrentRouteName] = useState<keyof RootStackParamList | undefined>();
  const { height } = useWindowDimensions();
  const topViewportMargin = Math.round(height * 0.12);
  const bottomViewportMargin = Math.round(height * 0.07);
  const contentStyle = {
    backgroundColor: appTheme.layout.screenBackground,
    paddingTop: topViewportMargin,
    paddingBottom: bottomViewportMargin,
  } as const;
  const [fontsLoaded] = useFonts({
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
    initI18n()
      .finally(() => setI18nReady(true));
  }, []);


  if (!fontsLoaded || !i18nReady) {
    return (
      <View style={{ flex: 1, backgroundColor: appTheme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={appTheme.colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={appTheme}>
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
  const { t } = useTranslation();
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
