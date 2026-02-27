import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, RadioButton, Text, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useCheckoutSubmit, useMenuItems } from '../api/hooks';
import { ScreenHeader } from '../components';
import { RootStackScreenProps } from '../navigation/types';
import { useOrderStore } from '../store/orderStore';
import { DishSelectionDto } from '../types/api';
import { getMenuItemLabel } from '../i18n/menu';
import { appTheme, spacing } from '../theme/theme';
import { formatPrice } from '../utils/formatting';

type PaymentMethod = 'card' | 'cash' | 'delivery';

const emptySelection = (): DishSelectionDto => ({
  entreeId: undefined,
  vegetableId: undefined,
  fruitId: undefined,
  sideId: undefined,
  sauceIds: [],
  toppingIds: [],
  beverageId: undefined,
});

/**
 * Checkout screen.
 */
export const CheckoutScreen = ({
  navigation,
  route,
}: RootStackScreenProps<'Checkout'>) => {
  const { t } = useTranslation();
  const comboMeals = useOrderStore((s) => s.comboMeals) ?? [];
  const aLaCarteItems = useOrderStore((s) => s.aLaCarteItems) ?? [];
  const resetOrder = useOrderStore((s) => s.reset);
  const checkoutMutation = useCheckoutSubmit();
  const { data: menuItems = [] } = useMenuItems();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

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

  const comboTotal = comboMeals.reduce((sum, comboMeal) => sum + comboMeal.totalCents, 0);
  const aLaCarteTotal = aLaCarteItems.reduce(
    (sum, entry) => sum + entry.item.priceCents * entry.quantity,
    0
  );
  const orderTotal = comboTotal + aLaCarteTotal;

  const normalizeCardNumber = (value: string) =>
    value.replace(/\D+/g, '').slice(0, 19);

  const formatCardNumber = (value: string) => {
    const digits = normalizeCardNumber(value);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D+/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  const luhnCheck = (value: string) => {
    const digits = value.replace(/\D+/g, '');
    let sum = 0;
    let shouldDouble = false;
    for (let i = digits.length - 1; i >= 0; i -= 1) {
      let digit = Number(digits[i]);
      if (Number.isNaN(digit)) return false;
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return digits.length >= 12 && sum % 10 === 0;
  };

  const cardIsValid = () => {
    if (paymentMethod !== 'card') return true;
    const numberDigits = cardNumber.replace(/\s+/g, '');
    const cvvDigits = cardCvv.replace(/\s+/g, '');
    const expiryOk = /^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(cardExpiry);
    return (
      cardName.trim().length > 0 &&
      luhnCheck(numberDigits) &&
      cvvDigits.length >= 3 &&
      cvvDigits.length <= 4 &&
      expiryOk
    );
  };

  const handleSubmit = async () => {
    const hasItems = comboMeals.length > 0 || aLaCarteItems.length > 0;
    if (!hasItems) {
      setError(t('checkout.errorEmpty'));
      return;
    }
    if (!cardIsValid()) {
      setError(t('checkout.errorPayment'));
      return;
    }
    setError(null);

    try {
      const response = await checkoutMutation.mutateAsync({
        paymentMethod,
        notes: notes.trim() || undefined,
        selection: comboMeals[0]?.selection ?? emptySelection(),
        selections: comboMeals.map((comboMeal) => comboMeal.selection),
        aLaCarteItems: aLaCarteItems.map((entry) => ({
          menuItemId: entry.item.id,
          quantity: entry.quantity,
        })),
        totals: {
          comboTotalCents: comboTotal,
          aLaCarteTotalCents: aLaCarteTotal,
          orderTotalCents: orderTotal,
        },
        card:
          paymentMethod === 'card'
            ? {
                name: cardName.trim(),
                number: cardNumber.replace(/\s+/g, ''),
                expiry: cardExpiry.trim(),
                cvv: cardCvv.trim(),
              }
            : undefined,
      });
      Alert.alert(t('checkout.successTitle'), response.message, [
        {
          text: t('checkout.successOk'),
          onPress: () => {
            resetOrder();
            navigation.navigate('Home');
          },
        },
      ]);
    } catch (err: any) {
      setError(err?.message ?? t('checkout.errorSubmit'));
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('checkout.title')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('checkout.orderSummary')}
          </Text>
          {comboMeals.map((comboMeal, index) => (
            <View key={comboMeal.id} style={styles.row}>
              <View style={styles.rowTextGroup}>
                <Text style={styles.rowName}>{`${t('cart.buildMealTitle')} ${index + 1}`}</Text>
                <Text style={styles.comboSummary}>{summarizeCombo(comboMeal.selection)}</Text>
              </View>
              <Text style={styles.rowPrice}>{formatPrice(comboMeal.totalCents)}</Text>
            </View>
          ))}
          {aLaCarteItems.map((entry) => (
            <View key={entry.item.id} style={styles.row}>
              <Text style={styles.rowName}>
                {getMenuItemLabel(entry.item.name, t)} × {entry.quantity}
              </Text>
              <Text style={styles.rowPrice}>
                {formatPrice(entry.item.priceCents * entry.quantity)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('checkout.totalDue')}
          </Text>
          <View style={styles.row}>
            <Text style={styles.totalLabel}>{t('checkout.orderTotal')}</Text>
            <Text style={styles.totalValue}>{formatPrice(orderTotal)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('checkout.payment')}
          </Text>
          <RadioButton.Group
            onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
            value={paymentMethod}
          >
            <View style={styles.radioRow}>
              <RadioButton value="card" />
              <Text style={styles.radioLabel}>{t('checkout.paymentMethods.card')}</Text>
            </View>
            <View style={styles.radioRow}>
              <RadioButton value="cash" />
              <Text style={styles.radioLabel}>{t('checkout.paymentMethods.store')}</Text>
            </View>
            <View style={styles.radioRow}>
              <RadioButton value="delivery" />
              <Text style={styles.radioLabel}>{t('checkout.paymentMethods.delivery')}</Text>
            </View>
          </RadioButton.Group>

          {paymentMethod === 'card' && (
            <View style={styles.cardFields}>
              <TextInput label={t('checkout.card.name')} mode="outlined" value={cardName} onChangeText={setCardName} style={styles.input} />
              <TextInput
                label={t('checkout.card.number')}
                mode="outlined"
                value={cardNumber}
                onChangeText={(value) => setCardNumber(formatCardNumber(value))}
                keyboardType="number-pad"
                style={styles.input}
              />
              <View style={styles.inlineRow}>
                <TextInput
                  label={t('checkout.card.expiry')}
                  mode="outlined"
                  value={cardExpiry}
                  onChangeText={(value) => setCardExpiry(formatExpiry(value))}
                  placeholder={t('checkout.card.expiryPlaceholder')}
                  style={[styles.input, styles.inlineField]}
                />
                <TextInput
                  label={t('checkout.card.cvv')}
                  mode="outlined"
                  value={cardCvv}
                  onChangeText={(value) => setCardCvv(value.replace(/\D+/g, '').slice(0, 4))}
                  keyboardType="number-pad"
                  style={[styles.input, styles.inlineField]}
                />
              </View>
            </View>
          )}

          <TextInput
            label={t('checkout.notesLabel')}
            mode="outlined"
            value={notes}
            onChangeText={setNotes}
            multiline
            style={styles.input}
          />

          {error && <Text style={styles.error}>{error}</Text>}
          <Button
            mode="contained"
            contentStyle={styles.submitButtonContent}
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={checkoutMutation.isPending}
          >
            {t('checkout.submit')}
          </Button>
        </View>
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
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowTextGroup: {
    alignItems: 'flex-start',
    flex: 1,
    marginRight: spacing.sm,
  },
  rowName: {
    color: appTheme.colors.onSurface,
  },
  comboSummary: {
    color: appTheme.colors.onSurfaceDisabled,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
    textAlign: 'left',
  },
  rowPrice: {
    color: appTheme.colors.primary,
    fontSize: 24,
    fontWeight: '700',
  },
  totalLabel: {
    color: appTheme.colors.onSurface,
  },
  totalValue: {
    color: appTheme.colors.primary,
    fontSize: 24,
    fontWeight: '700',
  },
  radioRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  radioLabel: {
    color: appTheme.colors.onSurface,
  },
  cardFields: {
    gap: spacing.sm,
  },
  inlineRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inlineField: {
    flex: 1,
  },
  input: {
    backgroundColor: appTheme.colors.surface,
  },
  submitButton: {
    marginTop: spacing.sm,
    width: '100%',
  },
  submitButtonContent: {
    minHeight: 56,
  },
  error: {
    color: appTheme.colors.error,
  },
});
