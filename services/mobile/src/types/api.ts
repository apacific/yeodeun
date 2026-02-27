// Menu DTOs from backend
export interface MenuItemDto {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  priceCents: number;
  isActive: boolean;
  nutrition?: NutritionProfileDto;
}

export interface MenuCategoryCountDto {
  category: string;
  count: number;
}

export type MenuCategory =
  | 'Entree'
  | 'Vegetable'
  | 'Fruit'
  | 'Side'
  | 'Sauce'
  | 'Topping'
  | 'Beverage';

// Nutrition DTOs
export interface NutritionProfileDto {
  servingGrams: number;
  calories: number;
  totalFatG: number;
  saturatedFatG: number;
  transFatG: number;
  cholesterolMg: number;
  sodiumMg: number;
  totalCarbG: number;
  dietaryFiberG: number;
  totalSugarsG: number;
  addedSugarsG: number;
  proteinG: number;
  sourceName: string;
  sourceUrl?: string;
  externalRef?: string;
  lastUpdatedUtc: string;
}

export interface NutritionTotalsDto {
  calories: number;
  totalFatG: number;
  saturatedFatG: number;
  transFatG: number;
  cholesterolMg: number;
  sodiumMg: number;
  totalCarbsG: number;
  dietaryFiberG: number;
  totalSugarsG: number;
  addedSugarsG: number;
  proteinG: number;
}

export interface NutritionQuoteLineDto {
  id: string;
  name: string;
  category: string;
  nutrition?: NutritionProfileDto;
}

export interface NutritionQuoteResponseDto {
  totals: NutritionTotalsDto;
  lines: NutritionQuoteLineDto[];
  missingNutritionForItemIds: string[];
  notes: string[];
}

// Pricing DTOs
export interface QuoteLineDto {
  id: string;
  name: string;
  category: string;
  priceCents: number;
}

export interface QuoteResponseDto {
  lines: QuoteLineDto[];
  listPriceCents: number;
  sauceCredits: number;
  saucesSelected: number;
  saucesCharged: number;
  sauceDiscountCents: number;
  comboApplied: boolean;
  comboBasePriceCents: number;
  comboDiscountCents: number;
  totalCents: number;
  notes: string[];
}

// Selection DTOs
export interface DishSelectionDto {
  entreeId?: string;
  vegetableId?: string;
  fruitId?: string;
  sideId?: string;
  sauceIds: string[];
  toppingIds: string[];
  beverageId?: string;
}

export interface SelectionRequestDto {
  selection: DishSelectionDto;
  selections?: DishSelectionDto[];
}

export interface NutritionQuoteRequestDto {
  selection: DishSelectionDto;
}

export interface ContactRequestDto {
  message?: string;
  email?: string;
  phone?: string;
}

export interface ContactResponseDto {
  message: string;
}

export interface CheckoutTotalsDto {
  comboTotalCents: number;
  aLaCarteTotalCents: number;
  orderTotalCents: number;
}

export interface CheckoutCardDto {
  name: string;
  number: string;
  expiry: string;
  cvv: string;
}

export interface CheckoutALaCarteItemDto {
  menuItemId: string;
  quantity: number;
}

export interface CheckoutRequestDto {
  paymentMethod: 'card' | 'cash' | 'delivery';
  notes?: string;
  selection: DishSelectionDto;
  selections?: DishSelectionDto[];
  aLaCarteItems: CheckoutALaCarteItemDto[];
  totals: CheckoutTotalsDto;
  card?: CheckoutCardDto;
}

export interface CheckoutResponseDto {
  message: string;
  orderId: string;
}

// Order management types
export interface OrderItem {
  id: string; // UUID for this order item (not menu item ID)
  menuItemId: string;
  menuItemName: string;
  category: MenuCategory;
  priceCents: number;
  notes?: string;
  substitutions?: {
    itemId: string;
    itemName: string;
    instruction: string;
  }[];
}

export interface Order {
  id: string;
  items: OrderItem[];
  createdAt: Date;
}

export interface Combo {
  entree?: MenuItemDto;
  vegetable?: MenuItemDto;
  fruit?: MenuItemDto;
  side?: MenuItemDto;
  sauces: MenuItemDto[]; // max 2
  toppings: MenuItemDto[];
  beverage?: MenuItemDto;
}
