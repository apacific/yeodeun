// Pricing constants
/**
 * Combo price cents.
 */
export const COMBO_PRICE_CENTS = 2100; // $21.00
/**
 * Combo discount cents.
 */
export const COMBO_DISCOUNT_CENTS = 500; // $5.00 discount
/**
 * Free sauce per vegetable.
 */
export const FREE_SAUCE_PER_VEGETABLE = 1;
/**
 * Free sauce per entree.
 */
export const FREE_SAUCE_PER_ENTREE = 1;
/**
 * Max sauces per dish.
 */
export const MAX_SAUCES_PER_DISH = 2;
/**
 * Sauce price cents.
 */
export const SAUCE_PRICE_CENTS = 100; // $1.00

// Combo requirements
/**
 * Combo requirements.
 */
export const COMBO_REQUIREMENTS = {
  entree: true,
  fruit: true,
  sauces: 2,
  side: true,
  vegetable: true,
};

// Menu categories
/**
 * Menu categories.
 */
export const MENU_CATEGORIES = [
  'Entree',
  'Vegetable',
  'Fruit',
  'Side',
  'Sauce',
  'Topping',
  'Beverage',
] as const;

// API timeouts
/**
 * Api timeout ms.
 */
export const API_TIMEOUT_MS = 10000;
/**
 * Api retry count.
 */
export const API_RETRY_COUNT = 1;

// Offline message
/**
 * Offline message.
 */
export const OFFLINE_MESSAGE =
  'No internet connection. Please check your connection and try again.';

// Toast messages
/**
 * Messages.
 */
export const MESSAGES = {
  comboComplete: 'Combo complete! Ready to checkout.',
  networkError: 'Network error. Please try again.',
  orderSubmitted: 'Order submitted successfully!',
  sauceLimitReached: 'Maximum 2 sauces per dish.',
  selectionValid: 'Selection updated successfully.',
};
