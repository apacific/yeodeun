import type { TFunction } from 'i18next';

/**
 * Get category key.
 */
export const getCategoryKey = (category: string): string =>
  category.trim().toLowerCase();

/**
 * Get category label.
 */
export const getCategoryLabel = (category: string, t: TFunction): string =>
  t(`menu.categories.${getCategoryKey(category)}`, {
    defaultValue: category,
  });

/**
 * Get menu item key.
 */
export const getMenuItemKey = (name: string): string =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');

/**
 * Get menu item label.
 */
export const getMenuItemLabel = (name: string, t: TFunction): string =>
  t(`menu.itemNames.${getMenuItemKey(name)}`, {
    defaultValue: name,
  });
