import React, { useCallback, useMemo, useState } from 'react';
import { Alert, ImageBackground, SectionList, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useMenuItems } from '../api/hooks';
import { EmptyState, NutritionModal, ScreenHeader } from '../components';
import { getCategoryLabel, getMenuItemLabel } from '../i18n/menu';
import { RootStackScreenProps } from '../navigation/types';
import { useOrderStore } from '../store/orderStore';
import { MenuItemDto } from '../types/api';
import { MENU_CATEGORIES } from '../utils/constants';
import { formatPrice } from '../utils/formatting';
import { getMenuItemImage } from '../utils/menuImages';
import { appTheme, spacing } from '../theme/theme';

/**
 * A la carte screen.
 */
export const ALaCarteScreen = ({
  navigation,
}: RootStackScreenProps<'ALaCarte'>) => {
  const { t } = useTranslation();
  const {
    data: items = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useMenuItems(
    undefined,
    undefined,
    true
  );
  const loading = isLoading || isFetching;
  const menuErrorMessage =
    (error as { message?: string } | undefined)?.message ??
    'Failed to load menu items';
  const addALaCarteItem = useOrderStore((s) => s.addALaCarteItem);
  const removeALaCarteItem = useOrderStore((s) => s.removeALaCarteItem);
  const aLaCarteItems = useOrderStore((s) => s.aLaCarteItems);
  const [nutritionItem, setNutritionItem] = useState<MenuItemDto | undefined>();
  const [showNutritionModal, setShowNutritionModal] = useState(false);

  const quantityById = useMemo(() => {
    return new Map(
      aLaCarteItems.map((entry) => [entry.item.id, entry.quantity])
    );
  }, [aLaCarteItems]);

  const handleShowNutrition = useCallback((item: MenuItemDto) => {
    setNutritionItem(item);
    setShowNutritionModal(true);
  }, []);
  const handleAddItem = useCallback(
    (item: MenuItemDto) => {
      addALaCarteItem(item);
      Alert.alert(
        t('cart.itemAdded', {
          name: getMenuItemLabel(item.name, t),
        })
      );
    },
    [addALaCarteItem, t]
  );

  const sections = useMemo(() => {
    const grouped = new Map<string, MenuItemDto[]>();
    items.forEach((item) => {
      const list = grouped.get(item.category) ?? [];
      list.push(item);
      grouped.set(item.category, list);
    });

    const ordered = MENU_CATEGORIES.map((category) => ({
      data: grouped.get(category) ?? [],
      title: category,
    })).filter((section) => section.data.length > 0);

    const remaining = Array.from(grouped.entries())
      .filter(([category]) => !MENU_CATEGORIES.includes(category as any))
      .map(([category, data]) => ({ data, title: category }));

    return [...ordered, ...remaining];
  }, [items]);

  const renderItem = useCallback(
    ({ item }: { item: MenuItemDto }) => (
      <ALaCarteRow
        item={item}
        quantity={quantityById.get(item.id) ?? 0}
        onAdd={handleAddItem}
        onRemove={removeALaCarteItem}
        onShowNutrition={handleShowNutrition}
        nutritionLabel={t('menu.nutritionInfo')}
        displayName={getMenuItemLabel(item.name, t)}
      />
    ),
    [handleAddItem, removeALaCarteItem, quantityById, handleShowNutrition, t]
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('aLaCarte.title')} onBack={() => navigation.goBack()} />
      {loading ? (
        <View style={styles.state}>
          <Text>{t('menu.loading')}</Text>
        </View>
      ) : isError ? (
        <View style={styles.state}>
          <EmptyState title="Unable to load menu" description={menuErrorMessage} />
          <View style={styles.retryWrap}>
            <Button mode="outlined" onPress={() => refetch()}>
              Retry
            </Button>
          </View>
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
    </View>
  );
};

interface ALaCarteRowProps {
  item: MenuItemDto;
  quantity: number;
  onAdd: (item: MenuItemDto) => void;
  onRemove: (itemId: string) => void;
  onShowNutrition: (item: MenuItemDto) => void;
  nutritionLabel: string;
  displayName: string;
}

const ALaCarteRow = React.memo(
  ({
    item,
    quantity,
    onAdd,
    onRemove,
    onShowNutrition,
    nutritionLabel,
    displayName,
  }: ALaCarteRowProps) => (
    <ImageBackground
      source={getMenuItemImage(item.name)}
      resizeMode="cover"
      style={styles.row}
    >
      <View style={styles.overlay}>
        <View style={styles.rowInfo}>
          <Text variant="titleSmall" style={styles.rowName}>
            {displayName}
          </Text>
          <Text variant="bodySmall" style={styles.rowMeta}>
            {formatPrice(item.priceCents)}
          </Text>
          <Text
            variant="labelSmall"
            style={styles.nutritionLink}
            onPress={() => onShowNutrition(item)}
          >
            {nutritionLabel}
          </Text>
        </View>
        <View style={styles.rowActions}>
          <Button
            mode="outlined"
            compact
            onPress={() => onRemove(item.id)}
            disabled={quantity === 0}
          >
            −
          </Button>
          <Text style={styles.qty}>{quantity}</Text>
          <Button mode="contained" compact onPress={() => onAdd(item)}>
            +
          </Button>
        </View>
      </View>
    </ImageBackground>
  )
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: appTheme.colors.background,
    flex: 1,},
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,},
  nutritionLink: {
    color: appTheme.colors.onBackground,
    marginTop: spacing.xs,},
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    padding: spacing.md,},
  qty: {
    color: appTheme.colors.onBackground,
    textAlign: 'center',
    width: 24,},
  row: {
    justifyContent: 'center',
    minHeight: 140,},
  rowActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,},
  rowInfo: {
    flex: 1,
    gap: spacing.xs,},
  rowMeta: {
    color: appTheme.colors.onBackground,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,},
  rowName: {
    color: appTheme.colors.onBackground,},
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
  state: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  retryWrap: {
    marginTop: spacing.md,
  },
});

