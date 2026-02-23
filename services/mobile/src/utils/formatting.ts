/**
 * Format cents to currency string (e.g., 2100 -> "$21.00")
 */
/**
 * Format price.
 */
export const formatPrice = (cents: number): string => {
  const dollars = (cents / 100).toFixed(2);
  return `$${dollars}`;
};

/**
 * Format grams with appropriate unit
 */
/**
 * Format grams.
 */
export const formatGrams = (grams: number): string => {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(1)}kg`;
  }
  return `${grams.toFixed(0)}g`;
};

/**
 * Format nutrition value with appropriate precision
 */
/**
 * Format nutrition value.
 */
export const formatNutritionValue = (value: number, unit: string): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0' + unit;
  }

  if (unit === 'mg' || unit === 'kcal') {
    return `${Math.round(value)}${unit}`;
  }

  return `${value.toFixed(1)}${unit}`;
};

/**
 * Get category badge color
 */
/**
 * Get category color.
 */
export const getCategoryColor = (
  category: string
): {
  background: string;
  text: string;
} => {
  const categoryLower = category.toLowerCase();

  const colorMap: Record<string, { background: string; text: string }> = {
    entree: { background: '#FF6F00', text: '#FFFFFF' },
    vegetable: { background: '#4CAF50', text: '#FFFFFF' },
    fruit: { background: '#E91E63', text: '#FFFFFF' },
    side: { background: '#9C27B0', text: '#FFFFFF' },
    sauce: { background: '#FF5722', text: '#FFFFFF' },
    topping: { background: '#00BCD4', text: '#FFFFFF' },
    beverage: { background: '#2196F3', text: '#FFFFFF' },
  };

  return colorMap[categoryLower] || { background: '#666666', text: '#FFFFFF' };
};

/**
 * Capitalize first letter
 */
/**
 * Capitalize.
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Generate a UUID v4 locally (for client-side order item IDs)
 */
/**
 * Generate uuid.
 */
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
