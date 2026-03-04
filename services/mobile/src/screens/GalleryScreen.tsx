import React from 'react';
import { FlatList, Image, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ScreenHeader } from '../components';
import { RootStackScreenProps } from '../navigation/types';
import { appTheme, spacing } from '../theme/theme';
import { menuGalleryImages } from '../utils/menuImages';

/**
 * Gallery screen.
 */
export const GalleryScreen = ({
  navigation,
}: RootStackScreenProps<'Gallery'>) => {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <ScreenHeader title={t('gallery.title')} onBack={() => navigation.goBack()} />
      <FlatList
        data={menuGalleryImages}
        keyExtractor={(_, index) => `gallery-${index}`}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <Image source={item} style={styles.image} />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: appTheme.colors.background,
    flex: 1,},
  grid: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,},
  image: {
    aspectRatio: 1,
    backgroundColor: appTheme.colors.surface,
    width: '48%',},
  row: {
    gap: spacing.md,
    justifyContent: 'space-between',},
});
