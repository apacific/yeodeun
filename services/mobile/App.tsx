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
import { PaperProvider, Text as PaperText, TextInput as PaperTextInput } from 'react-native-paper';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { appTheme } from './src/theme/theme';
import { initI18n } from './src/i18n';
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
  LanguageScreen,
  OrderMenuScreen,
} from './src/screens';
import { RootStackParamList } from './src/navigation/types';
import { LanguageToggle } from './src/components';

const Stack = createStackNavigator<RootStackParamList>();
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
  const { height } = useWindowDimensions();
  const viewportMargin = Math.round(height * 0.1);
  const contentStyle = {
    backgroundColor: appTheme.layout.screenBackground,
    paddingTop: viewportMargin,
    paddingBottom: viewportMargin,
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
              <NavigationContainer>
                <Stack.Navigator
                  initialRouteName="Home"
                  screenOptions={{
                    headerShown: false,
                    cardStyle: contentStyle,
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
                  <Stack.Screen name="Language" component={LanguageScreen} />
                </Stack.Navigator>
              </NavigationContainer>
              <View style={styles.languageDock}>
                <LanguageToggle />
              </View>
            </View>
          </PaperProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}


const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
  },
  languageDock: {
    alignItems: 'center',
    bottom: 60,
    left: 0,
    position: 'absolute',
    right: 0,
  },
});
