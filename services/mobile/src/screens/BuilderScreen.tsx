import React, { useState, useCallback } from 'react';
import {
  Alert,
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Text, Button, Chip } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import {
  useMenuItems,
  usePricingQuote,
  useNutritionQuote,
} from '../api/hooks';
import { useOrderStore } from '../store/orderStore';
import { MenuItemDto } from '../types/api';
import { NutritionModal } from '../components/NutritionModal';
import { Card, Section, EmptyState, LoadingOverlay } from '../components/Common';
import { formatPrice } from '../utils/formatting';
import { getMenuItemLabel } from '../i18n/menu';
import { appTheme, spacing } from '../theme/theme';
import { RootStackScreenProps } from '../navigation/types';

type BuilderStep = 'entree' | 'vegetable' | 'fruit' | 'side' | 'sauce' | 'topping' | 'beverage' | 'review';

const BUILDER_STEPS: BuilderStep[] = ['entree', 'vegetable', 'fruit', 'side', 'sauce', 'topping', 'beverage'];

/**
 * Builder screen.
 */
export const BuilderScreen = React.memo(({ navigation }: RootStackScreenProps<'Builder'>) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<BuilderStep>('entree');
  const [nutritionItem, setNutritionItem] = useState<MenuItemDto | undefined>();
  const [showNutritionModal, setShowNutritionModal] = useState(false);

  const {
    currentSelection,
    setEntree,
    setVegetable,
    setFruit,
    setSide,
    addSauce,
    removeSauce,
    addTopping,
    removeTopping,
    setBeverage,
    addCurrentComboMeal,
    reset,
    isComboComplete,
    getSauceIds,
    getToppingIds,
  } = useOrderStore();

  const pricingMutation = usePricingQuote();
  const nutritionMutation = useNutritionQuote();

  // Fetch menu items for current step
  const { data: stepItems = [], isLoading: isLoadingItems } = useMenuItems(
    currentStep === 'sauce'
      ? 'Sauce'
      : currentStep === 'topping'
        ? 'Topping'
        : currentStep === 'beverage'
          ? 'Beverage'
          : capitalize(currentStep),
    undefined,
    true
  );

  const handleSelectItem = useCallback(
    (item: MenuItemDto) => {
      switch (currentStep) {
        case 'entree':
          setEntree(currentSelection.entreeId === item.id ? undefined : item.id);
          break;
        case 'vegetable':
          setVegetable(
            currentSelection.vegetableId === item.id ? undefined : item.id
          );
          break;
        case 'fruit':
          setFruit(currentSelection.fruitId === item.id ? undefined : item.id);
          break;
        case 'side':
          setSide(currentSelection.sideId === item.id ? undefined : item.id);
          break;
        case 'sauce': {
          const sauceIds = getSauceIds();
          if (sauceIds.includes(item.id)) {
            removeSauce(item.id);
          } else {
            addSauce(item.id);
          }
          break;
        }
        case 'topping': {
          const toppingIds = getToppingIds();
          if (toppingIds.includes(item.id)) {
            removeTopping(item.id);
          } else {
            addTopping(item.id);
          }
          break;
        }
        case 'beverage':
          setBeverage(
            currentSelection.beverageId === item.id ? undefined : item.id
          );
          break;
      }
    },
    [currentStep, currentSelection, setEntree, setVegetable, setFruit, setSide, addSauce, removeSauce, addTopping, removeTopping, setBeverage, getSauceIds, getToppingIds]
  );

  const handleNextStep = useCallback(async () => {
    if (currentStep === 'beverage') {
      if (!isComboComplete()) {
        return;
      }

      try {
        const quote = await pricingMutation.mutateAsync({ selection: currentSelection });
        addCurrentComboMeal(quote.totalCents);
        Alert.alert(t('cart.itemAdded', { name: t('cart.comboMeal') }));
        setCurrentStep('entree');
        navigation.navigate('Cart');
      } catch {
        // Pricing errors are surfaced by existing mutation UI state.
      }
      return;
    }

    const currentIndex = BUILDER_STEPS.indexOf(currentStep);
    if (currentIndex < BUILDER_STEPS.length - 1) {
      setCurrentStep(BUILDER_STEPS[currentIndex + 1]);
    }
  }, [
    addCurrentComboMeal,
    currentSelection,
    currentStep,
    isComboComplete,
    navigation,
    pricingMutation,
    t,
  ]);

  const handlePreviousStep = useCallback(() => {
    if (currentStep === 'entree') {
      navigation.navigate('OrderMenu');
      return;
    }

    const currentIndex = BUILDER_STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(BUILDER_STEPS[currentIndex - 1]);
    }
  }, [currentStep, navigation]);

  const handleViewNutrition = useCallback((item: MenuItemDto) => {
    setNutritionItem(item);
    setShowNutritionModal(true);
  }, []);

  const getStepTitle = (): string => {
    const titles: Record<BuilderStep, string> = {
      entree: t('builder.steps.entree'),
      vegetable: t('builder.steps.vegetable'),
      fruit: t('builder.steps.fruit'),
      side: t('builder.steps.side'),
      sauce: t('builder.steps.sauce'),
      topping: t('builder.steps.topping'),
      beverage: t('builder.steps.beverage'),
      review: t('builder.steps.review'),
    };
    return titles[currentStep];
  };

  const getStepNumber = (): number => BUILDER_STEPS.indexOf(currentStep) + 1;

  const getSelectedItemCount = (): number => {
    let count = 0;
    if (currentSelection.entreeId) count++;
    if (currentSelection.vegetableId) count++;
    if (currentSelection.fruitId) count++;
    if (currentSelection.sideId) count++;
    count += currentSelection.sauceIds.length;
    count += currentSelection.toppingIds.length;
    if (currentSelection.beverageId) count++;
    return count;
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'entree':
        return !!currentSelection.entreeId;
      case 'vegetable':
        return !!currentSelection.vegetableId;
      case 'fruit':
        return !!currentSelection.fruitId;
      case 'side':
        return !!currentSelection.sideId;
      case 'sauce':
        return currentSelection.sauceIds.length === 2;
      case 'topping':
      case 'beverage':
        return true;
      case 'review':
        return isComboComplete();
      default:
        return false;
    }
  };

  const renderReviewStep = () => {
    return (
      <View style={styles.reviewContainer}>
        <Section
          title={t('builder.review.orderSummary')}
          contentContainerStyle={styles.reviewContent}
        >
          {currentSelection.entreeId && (
            <OrderItemRow
              label={t('builder.labels.entree')}
              itemId={currentSelection.entreeId}
            />
          )}
          {currentSelection.vegetableId && (
            <OrderItemRow
              label={t('builder.labels.vegetable')}
              itemId={currentSelection.vegetableId}
            />
          )}
          {currentSelection.fruitId && (
            <OrderItemRow
              label={t('builder.labels.fruit')}
              itemId={currentSelection.fruitId}
            />
          )}
          {currentSelection.sideId && (
            <OrderItemRow
              label={t('builder.labels.side')}
              itemId={currentSelection.sideId}
            />
          )}
          {currentSelection.sauceIds.map((id, idx) => (
            <OrderItemRow
              key={`sauce-${id}`}
              label={t('builder.labels.sauceNumber', { index: idx + 1 })}
              itemId={id}
            />
          ))}
          {currentSelection.toppingIds.map((id) => (
            <OrderItemRow
              key={`topping-${id}`}
              label={t('builder.labels.topping')}
              itemId={id}
            />
          ))}
          {currentSelection.beverageId && (
            <OrderItemRow
              label={t('builder.labels.beverage')}
              itemId={currentSelection.beverageId}
            />
          )}
        </Section>

        <Section title={t('builder.review.orderTotal')}>
          {pricingMutation.data && (
            <View style={styles.priceBreakdown}>
              <PriceRow
                label={t('builder.review.subtotal')}
                amount={pricingMutation.data.listPriceCents}
              />
              {pricingMutation.data.sauceDiscountCents > 0 && (
                <PriceRow
                  label={t('builder.review.sauceDiscount')}
                  amount={-pricingMutation.data.sauceDiscountCents}
                  highlight
                />
              )}
              {pricingMutation.data.comboApplied && (
                <PriceRow
                  label={t('builder.review.comboDiscount')}
                  amount={-pricingMutation.data.comboDiscountCents}
                  highlight
                />
              )}
              <Divider />
              <PriceRow
                label={t('builder.review.total')}
                amount={pricingMutation.data.totalCents}
                isBold
              />
            </View>
          )}
        </Section>

        <Button
          mode="contained"
          onPress={() => {
            if (!pricingMutation.data) {
              pricingMutation.mutate({ selection: currentSelection });
              return;
            }

            addCurrentComboMeal(pricingMutation.data.totalCents);
            Alert.alert(t('cart.itemAdded', { name: t('cart.comboMeal') }));
            setCurrentStep('entree');
            navigation.navigate('Cart');
          }}
          style={styles.checkoutButton}
          contentStyle={styles.checkoutButtonContent}
        >
          {t('builder.review.proceed')}
        </Button>

        {pricingMutation.data?.notes && pricingMutation.data.notes.length > 0 && (
          <View style={styles.notesSection}>
            <Text variant="labelSmall" style={styles.notesTitle}>
              {t('builder.review.notesTitle')}
            </Text>
            {pricingMutation.data.notes.map((note, idx) => (
              <Text key={`note-${idx}`} variant="bodySmall" style={styles.note}>
                • {note}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LoadingOverlay
        visible={isLoadingItems || pricingMutation.isPending || nutritionMutation.isPending}
        message={pricingMutation.isPending ? t('builder.loading.calculatingPrice') : t('builder.loading.loading')}
      />

      <View style={styles.header}>
        <View>
          <Text variant="headlineSmall" style={styles.title}>
            {t('builder.title')}
          </Text>
          <Text variant="bodySmall" style={styles.subtitle}>
            {t('builder.steps.withNumber', { step: getStepNumber(), title: getStepTitle() })}
          </Text>
        </View>
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>
            {t('builder.progress', { count: getSelectedItemCount() })}
          </Text>
        </View>
      </View>

      {currentStep === 'review' ? (
        renderReviewStep()
      ) : (
        <>
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentInner}
          >
            {isLoadingItems ? (
              <EmptyState title={t('builder.empty.loadingItems')} />
            ) : stepItems.length === 0 ? (
              <EmptyState
                title={t('builder.empty.noItems')}
                description={t('builder.empty.tryAnother')}
              />
            ) : (
              <MenuItemList
                items={stepItems}
                onSelectItem={handleSelectItem}
                selectedIds={
                  currentStep === 'sauce'
                    ? getSauceIds()
                    : currentStep === 'topping'
                      ? getToppingIds()
                      : currentStep === 'entree'
                        ? currentSelection.entreeId
                          ? [currentSelection.entreeId]
                          : []
                        : currentStep === 'vegetable'
                          ? currentSelection.vegetableId
                            ? [currentSelection.vegetableId]
                            : []
                          : currentStep === 'fruit'
                            ? currentSelection.fruitId
                              ? [currentSelection.fruitId]
                              : []
                            : currentStep === 'side'
                              ? currentSelection.sideId
                                ? [currentSelection.sideId]
                                : []
                              : currentStep === 'beverage'
                                ? currentSelection.beverageId
                                  ? [currentSelection.beverageId]
                                  : []
                                : []
                }
                onViewNutrition={handleViewNutrition}
              />
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Button
              mode="outlined"
              onPress={handlePreviousStep}
              style={styles.navButton}
            >
              {t('builder.nav.back')}
            </Button>
            <Button
              mode="contained"
              onPress={handleNextStep}
              disabled={!canProceed()}
              style={styles.navButton}
            >
              {currentStep === 'beverage' ? t('builder.nav.addToOrder') : t('builder.nav.next')}
            </Button>
          </View>
        </>
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
});

BuilderScreen.displayName = 'BuilderScreen';

// Helper components
const OrderItemRow = ({ label, itemId }: { label: string; itemId: string }) => (
  <View style={styles.orderItemRow}>
    <Text style={styles.orderItemLabel}>{label}:</Text>
    <Text style={styles.orderItemValue}>{itemId}</Text>
  </View>
);

const PriceRow = ({
  label,
  amount,
  highlight = false,
  isBold = false,
}: {
  label: string;
  amount: number;
  highlight?: boolean;
  isBold?: boolean;
}) => (
  <View style={styles.priceRow}>
    <Text style={[styles.priceLabel, isBold && styles.priceLabelBold]}>
      {label}
    </Text>
    <Text
      style={[
        styles.priceAmount,
        highlight && styles.priceAmountHighlight,
        isBold && styles.priceAmountBold,
      ]}
    >
      {formatPrice(amount)}
    </Text>
  </View>
);

import { Divider } from 'react-native-paper';
import { MenuItemList } from '../components/MenuItemCard';

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

const styles = StyleSheet.create({
  container: {
    backgroundColor: appTheme.colors.background,
    flex: 1,},
  header: {
    alignItems: 'center',
    backgroundColor: appTheme.colors.surface,
    borderBottomColor: appTheme.colors.outlineVariant,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,},
  title: {
    color: appTheme.colors.onSurface,},
  subtitle: {
    color: appTheme.colors.onSurfaceDisabled,
    marginTop: spacing.xs,},
  progressBadge: {
    backgroundColor: appTheme.colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,},
  progressText: {
    color: appTheme.colors.onPrimary || '#000',
    fontSize: 12,},
  content: {
    flex: 1,},
  contentInner: {
    padding: spacing.lg,},
  footer: {
    backgroundColor: appTheme.colors.surface,
    borderTopColor: appTheme.colors.outlineVariant,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,},
  navButton: {
    flex: 1,},
  reviewContainer: {
    flex: 1,
    paddingVertical: spacing.lg,},
  reviewContent: {
    gap: spacing.md,},
  orderItemRow: {
    borderBottomColor: appTheme.colors.surfaceVariant,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,},
  orderItemLabel: {
    color: appTheme.colors.onSurface,},
  orderItemValue: {
    color: appTheme.colors.onSurfaceDisabled,},
  priceBreakdown: {
    backgroundColor: appTheme.colors.background,
    gap: spacing.sm,
    padding: spacing.md,},
  priceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,},
  priceLabel: {
    color: appTheme.colors.onSurface,},
  priceLabelBold: {
    fontSize: 16,},
  priceAmount: {
    color: appTheme.colors.primary,},
  priceAmountHighlight: {
    color: appTheme.colors.success,},
  priceAmountBold: {
    fontSize: 16,},
  checkoutButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,},
  checkoutButtonContent: {
    paddingVertical: spacing.md,},
  notesSection: {
    backgroundColor: appTheme.colors.surface,
    borderLeftColor: appTheme.colors.info,
    borderLeftWidth: 4,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,},
  notesTitle: {
    color: appTheme.colors.onSurface,
    marginBottom: spacing.xs,},
  note: {
    color: appTheme.colors.onSurfaceDisabled,
    marginTop: spacing.xs,},
});



