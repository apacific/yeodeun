import React, { useMemo } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { NutritionTotalsDto, MenuItemDto } from '../types/api';
import { formatNutritionValue, capitalize } from '../utils/formatting';
import { appTheme, spacing, shadows } from '../theme/theme';
import { getMenuItemLabel } from '../i18n/menu';

interface NutritionRow {
  label: string;
  value: string;
  unit?: string;
  isBold?: boolean;
}

interface NutritionModalProps {
  visible: boolean;
  onClose: () => void;
  menuItem?: MenuItemDto;
  totals?: NutritionTotalsDto;
  title?: string;
}

/**
 * Displays per-item or aggregate nutrition details in a full-screen modal.
 *
 * @param visible Controls modal visibility.
 * @param onClose Callback to dismiss the modal.
 * @param menuItem Optional menu item whose nutrition should be shown.
 * @param totals Optional aggregate nutrition totals for composed selections.
 * @param title Optional title override for the modal header.
 * @returns Nutrition details view with serving metrics and data source metadata.
 */
export const NutritionModal = React.memo(
  ({
    visible,
    onClose,
    menuItem,
    totals,
    title,
  }: NutritionModalProps) => {
    const { t } = useTranslation();
    const nutritionData = useMemo(() => {
      if (!totals && !menuItem?.nutrition) return [];

      const data = totals || menuItem?.nutrition;
      if (!data) return [];

      const rows: NutritionRow[] = [
        {
          label: t('nutrition.calories'),
          value: formatNutritionValue(data.calories || 0, 'kcal'),
          isBold: true,
        },
        {
          label: t('nutrition.totalFat'),
          value: `${data.totalFatG?.toFixed(1) || 0}g`,
        },
        {
          label: `  ${t('nutrition.saturatedFat')}`,
          value: `${data.saturatedFatG?.toFixed(1) || 0}g`,
        },
        {
          label: `  ${t('nutrition.transFat')}`,
          value: `${data.transFatG?.toFixed(1) || 0}g`,
        },
        {
          label: t('nutrition.cholesterol'),
          value: formatNutritionValue(data.cholesterolMg || 0, 'mg'),
        },
        {
          label: t('nutrition.sodium'),
          value: formatNutritionValue(data.sodiumMg || 0, 'mg'),
        },
        {
          label: t('nutrition.totalCarbs'),
          value: `${((data as NutritionTotalsDto).totalCarbsG || 0).toFixed(1)}g`,
        },
        {
          label: `  ${t('nutrition.dietaryFiber')}`,
          value: `${data.dietaryFiberG?.toFixed(1) || 0}g`,
        },
        {
          label: `  ${t('nutrition.totalSugars')}`,
          value: `${data.totalSugarsG?.toFixed(1) || 0}g`,
        },
        {
          label: `    ${t('nutrition.addedSugars')}`,
          value: `${data.addedSugarsG?.toFixed(1) || 0}g`,
        },
        {
          label: t('nutrition.protein'),
          value: `${data.proteinG?.toFixed(1) || 0}g`,
          isBold: true,
        },
      ];

      return rows;
    }, [totals, menuItem, t]);

    const displayTitle =
      title ||
      (menuItem ? getMenuItemLabel(menuItem.name, t) : undefined) ||
      t('nutrition.titleDefault');

    return (
      <Modal
        visible={visible}
        onRequestClose={onClose}
        animationType="slide"
        transparent={false}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text
              variant="headlineMedium"
              style={styles.headerTitle}
            >
              {displayTitle}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Divider style={styles.divider} />

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentInner}
          >
            <View style={styles.nutritionContainer}>
              <Text
                variant="titleSmall"
                style={styles.subtitle}
              >
                {t('nutrition.perServing')}
              </Text>

              {nutritionData.length === 0 ? (
                <Text style={styles.emptyText}>
                  {t('nutrition.empty')}
                </Text>
              ) : (
                nutritionData.map((row, index) => (
                  <NutritionRow
                    key={`${row.label}-${index}`}
                    label={row.label}
                    value={row.value}
                    isBold={row.isBold}
                  />
                ))
              )}

              {menuItem?.nutrition && (
                <>
                  <Divider style={styles.divider} />
                  <Text
                    variant="bodySmall"
                    style={styles.disclaimer}
                  >
                    {t('nutrition.servingSize', {
                      grams: menuItem.nutrition.servingGrams,
                    })}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={styles.disclaimer}
                  >
                    {t('nutrition.source', {
                      source: menuItem.nutrition.sourceName,
                    })}
                  </Text>
                  {menuItem.nutrition.sourceUrl && (
                    <Text
                      variant="bodySmall"
                      style={styles.sourceUrl}
                    >
                      {menuItem.nutrition.sourceUrl}
                    </Text>
                  )}
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  }
);

NutritionModal.displayName = 'NutritionModal';

interface NutritionRowProps {
  label: string;
  value: string;
  isBold?: boolean;
}

const NutritionRow = React.memo(
  ({ label, value, isBold }: NutritionRowProps) => {
    return (
      <View style={styles.row}>
        <Text
          style={[
            styles.label,
            isBold && styles.labelBold,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
        <Text
          style={[
            styles.value,
            isBold && styles.valueBold,
          ]}
        >
          {value}
        </Text>
      </View>
    );
  }
);

NutritionRow.displayName = 'NutritionRow';

const styles = StyleSheet.create({
  container: {
    backgroundColor: appTheme.colors.background,
    flex: 1,},
  header: {
    alignItems: 'center',
    backgroundColor: appTheme.colors.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingVertical: spacing.lg,},
  headerTitle: {
    color: appTheme.colors.onSurface,
    flex: 1,},
  closeButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,},
  closeButtonText: {
    color: appTheme.colors.onSurface,
    fontSize: 24,},
  divider: {
    backgroundColor: appTheme.colors.outlineVariant,},
  content: {
    flex: 1,},
  contentInner: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,},
  nutritionContainer: {
    backgroundColor: appTheme.colors.surface,
    padding: spacing.lg,
    ...shadows.sm,},
  subtitle: {
    color: appTheme.colors.onSurface,
    marginBottom: spacing.md,},
  row: {
    alignItems: 'center',
    borderBottomColor: appTheme.colors.surfaceVariant,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,},
  label: {
    color: appTheme.colors.onSurface,
    flex: 1,
    fontSize: 14,},
  labelBold: {
    fontSize: 15,},
  value: {
    color: appTheme.colors.primary,
    marginLeft: spacing.md,},
  valueBold: {
    fontSize: 16,},
  disclaimer: {
    color: appTheme.colors.onSurfaceDisabled,
    fontStyle: 'italic',
    marginTop: spacing.md,},
  sourceUrl: {
    color: appTheme.colors.primary,
    marginTop: spacing.xs,},
  emptyText: {
    color: appTheme.colors.onSurfaceDisabled,
    marginTop: spacing.sm,},
});
