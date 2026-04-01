import React, { useState } from 'react';
import { ActivityIndicator, Image, Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText as Text, LogoMark, ScreenHeader } from '../components';
import { RootStackScreenProps } from '../navigation/types';
import { appTheme, spacing } from '../theme/theme';

const storefront = require('../../assets/img/store-front.png');

const RESTAURANT_COORDS = {
  latitude: 42.814243,
  longitude: -73.939569,
};

/**
 * About screen.
 */
export const AboutScreen = ({ navigation }: RootStackScreenProps<'About'>) => {
  const { t } = useTranslation();
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapLoadFailed, setMapLoadFailed] = useState(false);
  const [mapSourceIndex, setMapSourceIndex] = useState(0);
  const [mapErrorMessage, setMapErrorMessage] = useState<string>('');

  const STATIC_MAP_ZOOM = 16;
  const STATIC_MAP_SIZE = '640x320';
  const tileCount = Math.pow(2, STATIC_MAP_ZOOM);
  const tileX = Math.floor(((RESTAURANT_COORDS.longitude + 180) / 360) * tileCount);
  const latRad = (RESTAURANT_COORDS.latitude * Math.PI) / 180;
  const tileY = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * tileCount);
  const mapImageProviders = [
    {
      name: 'Carto Voyager',
      buildUri: () =>
        `https://a.basemaps.cartocdn.com/rastertiles/voyager/${STATIC_MAP_ZOOM}/${tileX}/${tileY}@2x.png`,
    },
    {
      name: 'Carto Positron',
      buildUri: () =>
        `https://a.basemaps.cartocdn.com/rastertiles/light_all/${STATIC_MAP_ZOOM}/${tileX}/${tileY}@2x.png`,
    },
    {
      name: 'ESRI Topographic',
      buildUri: () =>
        `https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${STATIC_MAP_ZOOM}/${tileY}/${tileX}.png`,
    },
  ];
  const activeMapSource = mapImageProviders[Math.min(mapSourceIndex, mapImageProviders.length - 1)];
  const mapImageUrl = activeMapSource.buildUri();
  const openStreetMapUrl = `https://www.openstreetmap.org/?mlat=${RESTAURANT_COORDS.latitude}&mlon=${RESTAURANT_COORDS.longitude}#map=16/${RESTAURANT_COORDS.latitude}/${RESTAURANT_COORDS.longitude}`;

  const handleOpenMap = async () => {
    try {
      await Linking.openURL(openStreetMapUrl);
    } catch (error) {
      // no-op; openURL failures are expected in some emulator setups without a browser
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('about.title')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <LogoMark size={110} />
        <Text style={styles.paragraph}>
          {t('about.paragraph')}
        </Text>
        <Text
          variant="titleLarge"
          style={styles.link}
          onPress={() => navigation.navigate('AllMenuItems')}
        >
          {t('about.viewMenu').toUpperCase()}
        </Text>

        <View style={styles.section}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            {t('about.hoursTitle')}
          </Text>
          <Text style={[styles.sectionText]}>
            {t('about.hours')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            {t('about.addressTitle')}
          </Text>
          <Text style={[styles.sectionText]}>
            {t('about.address')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            {t('about.mapTitle')}
          </Text>
          <TouchableOpacity onPress={handleOpenMap} activeOpacity={0.9} testID="about-map-link">
            <View style={styles.mapWrap}>
              <Image
                testID="about-map-image"
                source={{ uri: mapImageUrl }}
                style={styles.map}
                resizeMode="cover"
                onLoad={() => {
                  setIsMapReady(true);
                  setMapLoadFailed(false);
                  setMapErrorMessage('');
                }}
                onError={(error) => {
                  const errorMessage = (error as { nativeEvent?: { error?: string } }).nativeEvent?.error || 'Failed to load map image';
                  console.log('OSM_MAP_IMAGE_ERROR', {
                    provider: activeMapSource.name,
                    url: mapImageUrl,
                    error: errorMessage,
                  });
                  if (mapSourceIndex + 1 < mapImageProviders.length) {
                    setMapSourceIndex((prev) => prev + 1);
                    setIsMapReady(false);
                  } else {
                    setMapLoadFailed(true);
                    setIsMapReady(false);
                    setMapErrorMessage(errorMessage);
                  }
                }}
              />
              <View style={styles.mapMarker} />
              {(!isMapReady && !mapLoadFailed) && (
                <View style={styles.mapLoading}>
                  <ActivityIndicator size="large" color={appTheme.colors.onSurface} />
                </View>
              )}
              {mapLoadFailed && (
                <View style={styles.mapFallback}>
                  <Text style={styles.mapFallbackText}>
                    {t('about.mapUnavailable', { defaultValue: 'Map unavailable. Check network access and try again.' })}
                  </Text>
                  <Text style={styles.mapFallbackHint}>
                    {t('about.mapFallback', {
                      defaultValue: `Map source: ${mapImageProviders[Math.min(mapSourceIndex, mapImageProviders.length - 1)]?.name ?? 'unknown'}.`,
                    })}
                  </Text>
                  <Text style={styles.mapFallbackHint}>
                    {t('about.mapStaticHint', { defaultValue: 'Tap to open OpenStreetMap in a browser.' })}
                  </Text>
                  <Text style={styles.mapFallbackHint}>Source: {activeMapSource.name}</Text>
                  <Text style={styles.mapFallbackHint}>URL: {mapImageUrl}</Text>
                  {mapErrorMessage ? <Text style={styles.mapFallbackHint}>Error: {mapErrorMessage}</Text> : null}
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            {t('about.storefrontTitle')}
          </Text>
          <Image source={storefront} style={styles.image} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: appTheme.colors.background,
    flex: 1,},
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,},
  image: {
    height: 180,
    width: '100%',},
  leftText: {
    textAlign: 'left',
    width: '100%',},
  link: {
    alignSelf: 'center',
    borderColor: appTheme.colors.onBackground,
    borderWidth: 1,
    color: appTheme.colors.onBackground,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 2.6,
    marginVertical: spacing.xxl,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    textAlign: 'center',},
  mapFallback: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  mapFallbackText: {
    color: appTheme.colors.onSurface,
    fontSize: 13,
    textAlign: 'center',
  },
  mapFallbackHint: {
    color: appTheme.colors.onSurfaceDisabled,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  mapLoading: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  mapWrap: {
    borderRadius: 2,
    height: 220,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  map: {
    height: '100%',
    width: '100%',
  },
  mapMarker: {
    backgroundColor: appTheme.colors.error,
    borderColor: appTheme.colors.surface,
    borderRadius: 10,
    borderWidth: 2,
    height: 20,
    left: '50%',
    position: 'absolute',
    top: '50%',
    transform: [{ translateX: -10 }, { translateY: -20 }],
    width: 20,
  },
  mapLink: {
    color: appTheme.colors.primary,
    fontSize: 12,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  mapAttribution: {
    color: appTheme.colors.onSurfaceDisabled,
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  paragraph: {
    alignSelf: 'center',
    color: appTheme.colors.onBackground,
    fontSize: 15,
    lineHeight: 24,
    maxWidth: 560,
    textAlign: 'center',
    width: '82%',
  },
  section: {
    alignSelf: 'center',
    gap: spacing.md,
    maxWidth: 560,
    width: '100%',},
  sectionText: {
    color: appTheme.colors.onSurfaceDisabled,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  sectionTitle: {
    color: appTheme.colors.onBackground,
    fontWeight: '700',
    textAlign: 'center',},
});
