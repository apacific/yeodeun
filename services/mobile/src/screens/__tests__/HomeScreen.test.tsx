import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { HomeScreen } from '../HomeScreen';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        'home.about': 'About',
        'home.contact': 'Contact',
        'home.createEditOrder': 'Order',
        'home.gallery': 'Gallery',
        'brand.name': 'Yeodeun',
      }[key] ?? key),
  }),
}));

jest.mock('../../components', () => ({
  LogoMark: () => null,
}));

describe('HomeScreen', () => {
  it('navigates to each top-level route', () => {
    const navigate = jest.fn();

    const { getByText } = render(
      <HomeScreen
        navigation={{
          navigate,
          goBack: jest.fn(),
        }}
        route={{ key: 'home', name: 'Home', params: undefined }}
      />
    );

    fireEvent.press(getByText('Order'));
    expect(navigate).toHaveBeenCalledWith('OrderMenu');

    fireEvent.press(getByText('About'));
    expect(navigate).toHaveBeenCalledWith('About');

    fireEvent.press(getByText('Gallery'));
    expect(navigate).toHaveBeenCalledWith('Gallery');

    fireEvent.press(getByText('Contact'));
    expect(navigate).toHaveBeenCalledWith('Contact');

    expect(navigate).toHaveBeenCalledTimes(4);
  });
});
