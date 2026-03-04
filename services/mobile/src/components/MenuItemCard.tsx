import React from 'react';
import {
  ImageBackground,
  StyleSheet,
  View,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Text, Checkbox } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { getMenuItemLabel } from '../i18n/menu';
import { MenuItemDto } from '../types/api';
import { Card } from './Common';
import { formatPrice } from '../utils/formatting';
import { getMenuItemImage } from '../utils/menuImages';
import { appTheme, spacing } from '../theme/theme';

interface MenuItemCardProps {
  item: MenuItemDto;
  selected?: boolean;
  onSelect?: (item: MenuItemDto) => void;
  style?: ViewStyle;
  selectable?: boolean;
  onViewNutrition?: (item: MenuItemDto) => void;
}

/**
 * Renders a single menu item with image overlay, price, and quick actions.
 *
 * @param item Menu item payload to display.
 * @param selected Indicates whether the item is currently selected.
 * @param onSelect Optional callback for card selection.
 * @param style Optional card style overrides.
 * @param selectable Enables checkbox selection UI.
 * @param onViewNutrition Optional callback to open nutrition details.
 * @returns Card content used in menu and builder flows.
 */
export const MenuItemCard = React.memo(
  ({
    item,
    selected,
    onSelect,
    style,
    selectable,
    onViewNutrition,
  }: MenuItemCardProps) => {
    const { t } = useTranslation();
    return (
      <Card
        style={StyleSheet.flatten([
          styles.card,
          selected && styles.selectedCard,
          style,
        ])}
        onPress={() => onSelect?.(item)}
      >
        <ImageBackground
          source={getMenuItemImage(item.name)}
          resizeMode="cover"
          style={styles.image}
        >
          <View style={styles.overlay}>
            <View style={styles.header}>
              {selectable ? (
                <Checkbox
                  status={selected ? 'checked' : 'unchecked'}
                  onPress={() => onSelect?.(item)}
                  color={appTheme.colors.primary}
                />
              ) : (
                <View />
              )}
            </View>

            <Text
              variant="titleMedium"
              style={styles.name}
              numberOfLines={2}
            >
              {getMenuItemLabel(item.name, t)}
            </Text>

            <View style={styles.footer}>
              <Text
                variant="titleSmall"
                style={styles.price}
              >
                {formatPrice(item.priceCents)}
              </Text>
              <TouchableOpacity
                onPress={() => onViewNutrition?.(item)}
                style={styles.nutritionButton}
              >
                <Text
                  style={styles.nutritionButtonText}
                  variant="labelSmall"
                >
                  {t('menu.nutritionInfoShort')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      </Card>
    );
  }
);

MenuItemCard.displayName = 'MenuItemCard';

interface MenuItemListProps {
  items: MenuItemDto[];
  onSelectItem: (item: MenuItemDto) => void;
  selectedIds?: string[];
  onViewNutrition?: (item: MenuItemDto) => void;
  isLoading?: boolean;
}

/**
 * Renders a vertical list of selectable menu item cards.
 *
 * @param items Menu items to render.
 * @param onSelectItem Selection callback invoked with the selected item.
 * @param selectedIds Set of selected menu item ids.
 * @param onViewNutrition Optional callback for nutrition modal navigation.
 * @param isLoading Unused placeholder flag for future skeleton support.
 * @returns Card list container for menu sections.
 */
export const MenuItemList = React.memo(
  ({
    items,
    onSelectItem,
    selectedIds = [],
    onViewNutrition,
    isLoading,
  }: MenuItemListProps) => {
    return (
      <View style={styles.listContainer}>
        {items.map((item) => (
          <MenuItemCard
            key={item.id}
            item={item}
            selected={selectedIds.includes(item.id)}
            onSelect={onSelectItem}
            selectable
            onViewNutrition={onViewNutrition}
            style={styles.listItem}
          />
        ))}
      </View>
    );
  }
);

MenuItemList.displayName = 'MenuItemList';

const styles = StyleSheet.create({
  card: {
    backgroundColor: appTheme.colors.surface,
    borderLeftColor: appTheme.colors.primary,
    borderLeftWidth: 4,},
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',},
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',},
  image: {
    minHeight: 140,},
  listContainer: {
    gap: spacing.sm,},
  listItem: {
    marginBottom: 0,},
  name: {
    color: appTheme.colors.onBackground,},
  nutritionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,},
  nutritionButtonText: {
    color: appTheme.colors.onBackground,},
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    flex: 1,
    gap: spacing.sm,
    padding: spacing.md,},
  price: {
    color: appTheme.colors.onBackground,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,},
  selectedCard: {
    backgroundColor: appTheme.colors.surfaceVariant,
    borderLeftColor: appTheme.colors.success,},
});
