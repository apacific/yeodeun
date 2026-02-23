import React from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import MapView, { Marker } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import { LogoMark, ScreenHeader } from '../components';
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
            {t('about.addressTitle')}
          </Text>
          <Text style={[styles.sectionText, styles.leftText]}>
            {t('about.address')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            {t('about.hoursTitle')}
          </Text>
          <Text style={[styles.sectionText, styles.leftText]}>
            {t('about.hours')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            {t('about.mapTitle')}
          </Text>
          <MapView
            style={styles.map}
            initialRegion={{
              ...RESTAURANT_COORDS,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker coordinate={RESTAURANT_COORDS} title={t('brand.name')} />
          </MapView>
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
  paragraph: {
    alignSelf: 'center',
    color: appTheme.colors.onBackground,
    lineHeight: 20,
    maxWidth: 560,
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
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    textAlign: 'center',},
  section: {
    alignSelf: 'center',
    gap: spacing.sm,
    maxWidth: 560,
    width: '100%',},
  sectionTitle: {
    color: appTheme.colors.onBackground,
    fontWeight: '700',
    textAlign: 'center',},
  sectionText: {
    color: appTheme.colors.onSurfaceDisabled,
    textAlign: 'left',},
  leftText: {
    textAlign: 'left',
    width: '100%',},
  map: {
    height: 220,
    width: '100%',},
  image: {
    height: 180,
    width: '100%',},
});
