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


/**
 * Get menu item description in the active language.
 */
export const getMenuItemDescription = (
  name: string,
  t: TFunction,
  defaultDescription?: string | null
): string => {
  const key = `menu.itemDescriptions.${getMenuItemKey(name)}`;
  const localized = t(key, { defaultValue: '' }).trim();

  if (localized.length > 0) {
    return localized;
  }

  const activeLanguage = ((t as any)?.i18n?.resolvedLanguage ?? '').toLowerCase();
  if (activeLanguage.startsWith('en') && defaultDescription) {
    return defaultDescription;
  }

  return t('menu.descriptionFallback', {
    name: getMenuItemLabel(name, t),
  });
};
