import React, { useCallback, useMemo, useState } from 'react';
import {
  ImageBackground,
  Modal,
  SectionList,
  StyleSheet,
  View,
} from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useMenuItems } from '../api/hooks';
import { NutritionModal, ScreenHeader } from '../components';
import { getCategoryLabel, getMenuItemDescription, getMenuItemLabel } from '../i18n/menu';
import { RootStackScreenProps } from '../navigation/types';
import { MenuItemDto } from '../types/api';
import { MENU_CATEGORIES } from '../utils/constants';
import { formatPrice } from '../utils/formatting';
import { getMenuItemImage } from '../utils/menuImages';
import { appTheme, spacing } from '../theme/theme';

/**
 * All menu items screen.
 */
export const AllMenuItemsScreen = ({
  navigation,
}: RootStackScreenProps<'AllMenuItems'>) => {
  const { t } = useTranslation();
  const { data: items = [], isLoading } = useMenuItems(
    undefined,
    undefined,
    true
  );
  const [nutritionItem, setNutritionItem] = useState<MenuItemDto | undefined>();
  const [showNutritionModal, setShowNutritionModal] = useState(false);
  const [descriptionItem, setDescriptionItem] = useState<MenuItemDto | undefined>();
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);

  const handleShowNutrition = useCallback((item: MenuItemDto) => {
    setNutritionItem(item);
    setShowNutritionModal(true);
  }, []);

  const handleShowDescription = useCallback((item: MenuItemDto) => {
    setDescriptionItem(item);
    setShowDescriptionModal(true);
  }, []);

  const descriptionText = useMemo(() => {
    if (!descriptionItem) return '';

    return getMenuItemDescription(
      descriptionItem.name,
      t,
      descriptionItem.description
    );
  }, [descriptionItem, t]);

  const sections = useMemo(() => {
    const grouped = new Map<string, MenuItemDto[]>();
    items.forEach((item) => {
      const list = grouped.get(item.category) ?? [];
      list.push(item);
      grouped.set(item.category, list);
    });

    const ordered = MENU_CATEGORIES.map((category) => ({
      title: category,
      data: grouped.get(category) ?? [],
    })).filter((section) => section.data.length > 0);

    const remaining = Array.from(grouped.entries())
      .filter(([category]) => !MENU_CATEGORIES.includes(category as any))
      .map(([category, data]) => ({ title: category, data }));

    return [...ordered, ...remaining];
  }, [items]);

  const renderItem = useCallback(
    ({ item }: { item: MenuItemDto }) => (
      <ImageBackground
        source={getMenuItemImage(item.name)}
        resizeMode="cover"
        style={styles.row}
      >
        <View style={styles.overlay}>
          <View style={styles.rowInfo}>
            <Text variant="titleMedium" style={styles.rowName}>
              {getMenuItemLabel(item.name, t)}
            </Text>
            <Text variant="bodySmall" style={styles.rowMeta}>
              {formatPrice(item.priceCents)}
            </Text>
            <View style={styles.rowLinks}>
              <Text
                variant="labelSmall"
                style={styles.link}
                onPress={() => handleShowNutrition(item)}
              >
                {t('menu.nutritionInfo')}
              </Text>
              <Text
                variant="labelSmall"
                style={styles.link}
                onPress={() => handleShowDescription(item)}
              >
                {t('menu.description')}
              </Text>
            </View>
          </View>
        </View>
      </ImageBackground>
    ),
    [handleShowNutrition, handleShowDescription, t]
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('menu.title')} onBack={() => navigation.goBack()} />
      {isLoading ? (
        <View style={styles.state}>
          <Text>{t('menu.loading')}</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text variant="titleSmall" style={styles.sectionTitle}>
                {getCategoryLabel(section.title, t)}
              </Text>
            </View>
          )}
          contentContainerStyle={styles.list}
          initialNumToRender={12}
          windowSize={7}
          removeClippedSubviews
          stickySectionHeadersEnabled={false}
        />
      )}

      <NutritionModal
        visible={showNutritionModal}
        onClose={() => setShowNutritionModal(false)}
        menuItem={nutritionItem}
        title={t('menu.nutritionTitle', {
          name: nutritionItem ? getMenuItemLabel(nutritionItem.name, t) : '',
        })}
      />

      <Modal
        visible={showDescriptionModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDescriptionModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text variant="titleMedium" style={styles.modalTitle}>
              {descriptionItem ? getMenuItemLabel(descriptionItem.name, t) : ''}
            </Text>
            <Text style={styles.modalText}>{descriptionText}</Text>
            <Button
              mode="contained"
              onPress={() => setShowDescriptionModal(false)}
            >
              {t('menu.descriptionBack')}
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: appTheme.colors.background,
    flex: 1,},
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,},
  sectionHeader: {
    alignItems: 'center',
    paddingBottom: spacing.sm,
    paddingTop: spacing.lg,
  },
  sectionTitle: {
    color: appTheme.colors.onBackground,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.4,
    opacity: 0.9,
    textAlign: 'center',
  },
  row: {
    justifyContent: 'center',
    minHeight: 140,},
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    padding: spacing.md,},
  rowInfo: {
    gap: spacing.md,},
  rowName: {
    color: appTheme.colors.onBackground,},
  rowMeta: {
    alignSelf: 'flex-end',
    color: appTheme.colors.onBackground,
    fontSize: 22,
    lineHeight: 22,},
  rowLinks: {
    flexDirection: 'row',
    gap: spacing.md,},
  link: {
    color: appTheme.colors.onBackground,},
  state: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',},
  modalBackdrop: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,},
  modalCard: {
    backgroundColor: appTheme.colors.surface,
    gap: spacing.md,
    padding: spacing.lg,},
  modalTitle: {
    color: appTheme.colors.onSurface,},
  modalText: {
    color: appTheme.colors.onSurface,
    lineHeight: 20,},
});
