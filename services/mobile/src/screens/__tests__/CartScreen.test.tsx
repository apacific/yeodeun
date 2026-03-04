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
  aLaCarteItems: [],
  comboMeals: [],
  removeALaCarteItem: jest.fn(),
  removeComboMeal: jest.fn(),
};

jest.mock('../../store/orderStore', () => ({
  useOrderStore: (selector: any) => selector(mockState),
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
      };

      return map[key] ?? key;
    },
  }),
}));

describe('CartScreen', () => {
  it('navigates to OrderMenu when Add Items is pressed', () => {
    const navigate = jest.fn();
    const goBack = jest.fn();

    const { getByText } = render(
      <CartScreen
        navigation={{ goBack, navigate }}
        route={{ key: 'cart', name: 'Cart', params: undefined }}
      />
    );

    fireEvent.press(getByText('Add Items'));

    expect(navigate).toHaveBeenCalledWith('OrderMenu');
  });
});
