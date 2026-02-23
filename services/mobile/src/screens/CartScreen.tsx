import React, { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useMenuItems, usePricingQuote } from '../api/hooks';
import { ScreenHeader } from '../components';
import { RootStackScreenProps } from '../navigation/types';
import { useOrderStore } from '../store/orderStore';
import { formatPrice } from '../utils/formatting';
import { getMenuItemLabel } from '../i18n/menu';
import { appTheme, spacing } from '../theme/theme';

/**
 * Cart screen.
 */
export const CartScreen = ({ navigation }: RootStackScreenProps<'Cart'>) => {
  const { t } = useTranslation();
  const selection = useOrderStore((s) => s.currentSelection);
  const aLaCarteItems = useOrderStore((s) => s.aLaCarteItems);
  const pricingMutation = usePricingQuote();
  const { data: menuItems = [] } = useMenuItems();

  const menuLookup = useMemo(() => {
    return new Map(menuItems.map((item) => [item.id, item]));
  }, [menuItems]);

  const comboItemIds = [
    selection.entreeId,
    selection.vegetableId,
    selection.fruitId,
    selection.sideId,
    ...selection.sauceIds,
    ...selection.toppingIds,
    selection.beverageId,
  ].filter(Boolean) as string[];

  useEffect(() => {
    if (comboItemIds.length === 0) return;
    pricingMutation.mutate({ selection });
  }, [selection, comboItemIds.length]);

  const aLaCarteTotal = aLaCarteItems.reduce(
    (sum, entry) => sum + entry.item.priceCents * entry.quantity,
    0
  );
  const comboTotal = pricingMutation.data?.totalCents ?? 0;
  const orderTotal = aLaCarteTotal + comboTotal;

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('cart.title')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('cart.buildMealTitle')}
          </Text>
          {comboItemIds.length === 0 ? (
            <Text style={styles.emptyText}>{t('cart.noMeal')}</Text>
          ) : (
            comboItemIds.map((id) => {
              const item = menuLookup.get(id);
              return (
                <View key={id} style={styles.row}>
                  <Text style={styles.rowName}>
                    {item ? getMenuItemLabel(item.name, t) : id}
                  </Text>
                  <Text style={styles.rowPrice}>
                    {item ? formatPrice(item.priceCents) : '—'}
                  </Text>
                </View>
              );
            })
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
                <Text style={styles.rowName}>
                  {getMenuItemLabel(entry.item.name, t)} × {entry.quantity}
                </Text>
                <Text style={styles.rowPrice}>
                  {formatPrice(entry.item.priceCents * entry.quantity)}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('cart.totalTitle')}
          </Text>
          <View style={styles.row}>
            <Text style={styles.totalLabel}>{t('cart.orderTotalLabel')}</Text>
            <Text style={styles.totalValue}>{formatPrice(orderTotal)}</Text>
          </View>
        </View>

        <Button
          mode="contained"
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
    flex: 1,},
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,},
  section: {
    backgroundColor: appTheme.colors.surface,
    gap: spacing.sm,
    padding: spacing.md,},
  sectionTitle: {
    color: appTheme.colors.onSurface,
    fontWeight: '700',},
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',},
  rowName: {
    color: appTheme.colors.onSurface,},
  rowPrice: {
    color: appTheme.colors.primary,
    fontSize: 24,
    fontWeight: '700',},
  totalLabel: {
    color: appTheme.colors.onSurface,},
  totalValue: {
    color: appTheme.colors.primary,
    fontSize: 24,
    fontWeight: '700',},
  emptyText: {
    color: appTheme.colors.onSurfaceDisabled,},
  checkoutButton: {
    marginTop: spacing.sm,},
});
