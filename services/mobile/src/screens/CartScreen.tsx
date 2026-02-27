import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useMenuItems } from '../api/hooks';
import { ScreenHeader } from '../components';
import { RootStackScreenProps } from '../navigation/types';
import { useOrderStore } from '../store/orderStore';
import { DishSelectionDto } from '../types/api';
import { getMenuItemLabel } from '../i18n/menu';
import { appTheme, spacing } from '../theme/theme';
import { formatPrice } from '../utils/formatting';

/**
 * Cart screen.
 */
export const CartScreen = ({ navigation }: RootStackScreenProps<'Cart'>) => {
  const { t } = useTranslation();
  const comboMeals = useOrderStore((s) => s.comboMeals) ?? [];
  const aLaCarteItems = useOrderStore((s) => s.aLaCarteItems) ?? [];
  const removeComboMeal = useOrderStore((s) => s.removeComboMeal);
  const removeALaCarteItem = useOrderStore((s) => s.removeALaCarteItem);
  const { data: menuItems = [] } = useMenuItems();

  const menuLookup = useMemo(() => {
    return new Map(menuItems.map((item) => [item.id, item]));
  }, [menuItems]);

  const summarizeCombo = (selection: DishSelectionDto): string => {
    const orderedIds = [
      selection.entreeId,
      selection.vegetableId,
      selection.fruitId,
      selection.sideId,
      ...(selection.sauceIds ?? []),
      ...(selection.toppingIds ?? []),
      selection.beverageId,
    ].filter(Boolean) as string[];

    return orderedIds
      .map((id) => {
        const item = menuLookup.get(id);
        return item ? getMenuItemLabel(item.name, t) : id;
      })
      .join(', ');
  };

  const aLaCarteTotal = aLaCarteItems.reduce(
    (sum, entry) => sum + entry.item.priceCents * entry.quantity,
    0
  );
  const comboTotal = comboMeals.reduce((sum, comboMeal) => sum + comboMeal.totalCents, 0);
  const orderTotal = aLaCarteTotal + comboTotal;

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('cart.title')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('cart.buildMealTitle')}
          </Text>
          {comboMeals.length === 0 ? (
            <Text style={styles.emptyText}>{t('cart.noMeal')}</Text>
          ) : (
            comboMeals.map((comboMeal, index) => (
              <View key={comboMeal.id} style={styles.row}>
                <View style={styles.rowTextGroup}>
                  <Text style={styles.rowName}>{t('cart.comboMeal')}</Text>
                  <Text style={styles.comboSummary}>{summarizeCombo(comboMeal.selection)}</Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.rowPrice}>{formatPrice(comboMeal.totalCents)}</Text>
                  <Button
                    compact
                    mode="text"
                    onPress={() => removeComboMeal(comboMeal.id)}
                    contentStyle={styles.removeButtonContent}
                    labelStyle={styles.removeButtonLabel}
                  >
                    {t('cart.remove')}
                  </Button>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('cart.aLaCarteTitle')}
          </Text>
          {aLaCarteItems.length === 0 ? (
            <Text style={styles.emptyText}>{t('cart.noALaCarte')}</Text>
          ) : (
            aLaCarteItems.map((entry) => (
              <View key={entry.item.id} style={styles.row}>
                <View style={styles.rowTextGroup}>
                  <Text style={styles.rowName}>
                    {getMenuItemLabel(entry.item.name, t)} × {entry.quantity}
                  </Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.rowPrice}>
                    {formatPrice(entry.item.priceCents * entry.quantity)}
                  </Text>
                  <Button
                    compact
                    mode="text"
                    onPress={() => removeALaCarteItem(entry.item.id)}
                    contentStyle={styles.removeButtonContent}
                    labelStyle={styles.removeButtonLabel}
                  >
                    {t('cart.remove')}
                  </Button>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              {t('cart.totalTitle')}
            </Text>
            <Text style={styles.totalValue}>
              {formatPrice(orderTotal)}  
            </Text>
          </View>
        </View>

        <Button
          mode="outlined"
          contentStyle={styles.actionButtonContent}
          labelStyle={styles.actionButtonLabel}
          style={[styles.checkoutButton, styles.addToOrderButton]}
          onPress={() => navigation.navigate('OrderMenu')}
        >
          {t('cart.addToOrder')}
        </Button>

        <Button
          mode="contained"
          contentStyle={styles.actionButtonContent}
          labelStyle={styles.actionButtonLabel}
          style={styles.checkoutButton}
          onPress={() => navigation.navigate('Checkout', { from: 'cart' })}
        >
          {t('cart.startCheckout')}
        </Button>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: appTheme.colors.background,
    flex: 1,
  },
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  section: {
    backgroundColor: appTheme.colors.surface,
    gap: spacing.sm,
    padding: spacing.md,
  },
  sectionTitle: {
    color: appTheme.colors.onSurface,
    fontWeight: '700',
    paddingBottom: spacing.md,
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowTextGroup: {
    alignItems: 'flex-start',
    flex: 1,
  },
  rowRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
    marginLeft: spacing.sm,
  },
  rowName: {
    color: appTheme.colors.onSurface,
  },
  comboSummary: {
    color: appTheme.colors.onSurfaceDisabled,
    fontSize: 13,
    lineHeight: 18,
    marginRight: 5,
    marginTop: 5,
    textAlign: 'left',
  },
  rowPrice: {
    color: appTheme.colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  removeButtonContent: {
    minHeight: 28,
    paddingHorizontal: 0,
  },
  removeButtonLabel: {
    color: appTheme.colors.onSurfaceDisabled,
    fontSize: 12,
    marginHorizontal: 0,
    marginVertical: 0,
  },
  totalLabel: {
    color: appTheme.colors.onSurface,
  },
  totalValue: {
    color: appTheme.colors.primary,
    fontSize: 24,
    fontWeight: '700',
  },
  emptyText: {
    color: appTheme.colors.onSurfaceDisabled,
  },
  checkoutButton: {
    marginTop: spacing.sm,
  },
  addToOrderButton: {
    backgroundColor: appTheme.colors.background,
    borderColor: appTheme.colors.onSurface,
    borderWidth: 1,
  },
  actionButtonContent: {
    minHeight: 48,
  },
  actionButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
});
