import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { CartScreen } from '../CartScreen';

const mockState = {
  aLaCarteItems: [
    {
      item: {
        category: 'Entree',
        description: 'Grilled chicken meal',
        id: 'item-chicken',
        isActive: true,
        name: 'grilled chicken',
        priceCents: 1000,
      },
      quantity: 2,
    },
  ],
  comboMeals: [
    {
      id: 'combo-1',
      selection: {
        beverageId: 'water-1',
        entreeId: 'entree-1',
        fruitId: 'fruit-1',
        sauceIds: ['sauce-1'],
        sideId: 'side-1',
        toppingIds: ['topping-1'],
        vegetableId: 'vegetable-1',
      },
      totalCents: 2100,
    },
  ],
  removeALaCarteItem: jest.fn(),
  removeComboMeal: jest.fn(),
};

jest.mock('../../api/hooks', () => ({
  useMenuItems: () => ({
    data: [
      {
        category: 'Entree',
        description: null,
        id: 'entree-1',
        isActive: true,
        name: 'grilled chicken',
        priceCents: 900,
      },
      {
        category: 'Vegetable',
        description: null,
        id: 'vegetable-1',
        isActive: true,
        name: 'steamed broccoli',
        priceCents: 500,
      },
      {
        category: 'Fruit',
        description: null,
        id: 'fruit-1',
        isActive: true,
        name: 'mandarin orange',
        priceCents: 300,
      },
      {
        category: 'Side',
        description: null,
        id: 'side-1',
        isActive: true,
        name: 'roasted potatoes',
        priceCents: 400,
      },
      {
        category: 'Sauce',
        description: null,
        id: 'sauce-1',
        isActive: true,
        name: 'hot sauce',
        priceCents: 100,
      },
      {
        category: 'Topping',
        description: null,
        id: 'topping-1',
        isActive: true,
        name: 'peanut',
        priceCents: 50,
      },
      {
        category: 'Beverage',
        description: null,
        id: 'water-1',
        isActive: true,
        name: 'water',
        priceCents: 0,
      },
    ],
  }),
}));

jest.mock('../../components', () => ({
  ScreenHeader: () => null,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'cart.addToOrder': 'Add Items',
        'cart.aLaCarteTitle': 'A-la-carte',
        'cart.buildMealTitle': 'Build a Meal',
        'cart.noALaCarte': 'No a-la-carte items yet.',
        'cart.noMeal': 'No meal started yet.',
        'cart.startCheckout': 'Start Checkout',
        'cart.title': 'Your Order',
        'cart.totalTitle': 'Total',
        'cart.remove': 'Remove',
        'cart.comboMeal': 'Combo Meal',
        'menu.itemNames.grilled_chicken': 'Grilled Chicken',
        'menu.itemNames.vegetable_1': 'Steamed Broccoli',
        'menu.itemNames.fruit_1': 'Mandarin Orange',
        'menu.itemNames.side_1': 'Roasted Potatoes',
        'menu.itemNames.sauce_1': 'Hot Sauce',
        'menu.itemNames.topping_1': 'Peanut',
        'menu.itemNames.water_1': 'Water',
      };
      return map[key] ?? key;
    },
  }),
}));

jest.mock('../../i18n/menu', () => ({
  getMenuItemLabel: (name: string) => {
    const map: Record<string, string> = {
      'grilled chicken': 'Grilled Chicken',
      entree: 'Grilled Chicken',
      'steamed broccoli': 'Steamed Broccoli',
      'mandarin orange': 'Mandarin Orange',
      'roasted potatoes': 'Roasted Potatoes',
      'hot sauce': 'Hot Sauce',
      peanut: 'Peanut',
      water: 'Water',
    };

    return map[name] ?? name;
  },
}));

let orderStoreState = mockState;
const mockUseOrderStore = jest.fn((selector: any) => selector(orderStoreState));

jest.mock('../../store/orderStore', () => ({
  useOrderStore: (selector: any) => mockUseOrderStore(selector),
}));

describe('CartScreen', () => {
  beforeEach(() => {
    mockState.removeALaCarteItem.mockClear();
    mockState.removeComboMeal.mockClear();
    mockUseOrderStore.mockClear();
    orderStoreState = mockState;
  });

  it('renders order sections and total', () => {
    const { getByText } = render(
      <CartScreen
        navigation={{
          goBack: jest.fn(),
          navigate: jest.fn(),
        }}
        route={{ key: 'cart', name: 'Cart', params: undefined }}
      />
    );

    expect(getByText('Build a Meal')).toBeTruthy();
    expect(getByText('A-la-carte')).toBeTruthy();
    expect(getByText('Combo Meal')).toBeTruthy();
    expect(getByText('Grilled Chicken × 2')).toBeTruthy();
    expect(getByText('$41.00')).toBeTruthy();
  });

  it('navigates to OrderMenu when Add Items is pressed', () => {
    const navigate = jest.fn();
    const { getByText } = render(
      <CartScreen
        navigation={{
          goBack: jest.fn(),
          navigate,
        }}
        route={{ key: 'cart', name: 'Cart', params: undefined }}
      />
    );

    fireEvent.press(getByText('Add Items'));

    expect(navigate).toHaveBeenCalledWith('OrderMenu');
  });

  it('navigates to Checkout with the from=cart context', () => {
    const navigate = jest.fn();
    const { getByText } = render(
      <CartScreen
        navigation={{
          goBack: jest.fn(),
          navigate,
        }}
        route={{ key: 'cart', name: 'Cart', params: undefined }}
      />
    );

    fireEvent.press(getByText('Start Checkout'));

    expect(navigate).toHaveBeenCalledWith('Checkout', { from: 'cart' });
  });

  it('calls remove handlers when remove buttons are pressed', () => {
    const { getAllByText } = render(
      <CartScreen
        navigation={{
          goBack: jest.fn(),
          navigate: jest.fn(),
        }}
        route={{ key: 'cart', name: 'Cart', params: undefined }}
      />
    );

    const removeButtons = getAllByText('Remove');
    fireEvent.press(removeButtons[0]);
    fireEvent.press(removeButtons[1]);

    expect(mockState.removeComboMeal).toHaveBeenCalledWith('combo-1');
    expect(mockState.removeALaCarteItem).toHaveBeenCalledWith('item-chicken');
  });

  it('renders empty states when order is blank', () => {
    orderStoreState = {
      ...mockState,
      aLaCarteItems: [],
      comboMeals: [],
    };

    const { getByText } = render(
      <CartScreen
        navigation={{
          goBack: jest.fn(),
          navigate: jest.fn(),
        }}
        route={{ key: 'cart', name: 'Cart', params: undefined }}
      />
    );

    expect(getByText('No meal started yet.')).toBeTruthy();
    expect(getByText('No a-la-carte items yet.')).toBeTruthy();
  });
});
