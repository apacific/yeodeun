import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { CartScreen } from '../CartScreen';

jest.mock('../../api/hooks', () => ({
  useMenuItems: () => ({ data: [] }),
}));

jest.mock('../../components', () => ({
  ScreenHeader: () => null,
}));

const mockState = {
  comboMeals: [],
  aLaCarteItems: [],
  removeComboMeal: jest.fn(),
  removeALaCarteItem: jest.fn(),
};

jest.mock('../../store/orderStore', () => ({
  useOrderStore: (selector: any) => selector(mockState),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'cart.title': 'Your Order',
        'cart.buildMealTitle': 'Build a Meal',
        'cart.noMeal': 'No meal started yet.',
        'cart.aLaCarteTitle': 'A-la-carte',
        'cart.noALaCarte': 'No a-la-carte items yet.',
        'cart.totalTitle': 'Total',
        'cart.addToOrder': 'Add to Order',
        'cart.startCheckout': 'Start Checkout',
      };

      return map[key] ?? key;
    },
  }),
}));

describe('CartScreen', () => {
  it('navigates to OrderMenu when Add to Order is pressed', () => {
    const navigate = jest.fn();
    const goBack = jest.fn();

    const { getByText } = render(
      <CartScreen
        navigation={{ navigate, goBack }}
        route={{ key: 'cart', name: 'Cart', params: undefined }}
      />
    );

    fireEvent.press(getByText('Add to Order'));

    expect(navigate).toHaveBeenCalledWith('OrderMenu');
  });
});
