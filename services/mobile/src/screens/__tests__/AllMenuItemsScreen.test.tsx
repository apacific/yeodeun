import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { AllMenuItemsScreen } from '../AllMenuItemsScreen';

const mockEmptyState = jest.fn();

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({
    bottom: 8,
    left: 0,
    right: 0,
    top: 0,
  }),
}));

jest.mock('../../components', () => ({
  EmptyState: (...args: any[]) => {
    mockEmptyState(...args);
    return null;
  },
  NutritionModal: () => null,
  ScreenHeader: () => null,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'menu.description': 'Description',
        'menu.nutritionInfo': 'Nutrition Info',
        'menu.loading': 'Loading menu',
        'menu.title': 'Menu',
        'menu.descriptionBack': 'Back',
        'menu.itemNames.grilled_chicken': 'Grilled Chicken',
        'menu.nutritionTitle': 'Nutrition details',
        'menu.categories.entree': 'Entree',
      };
      return map[key] ?? key;
    },
    i18n: {
      resolvedLanguage: 'en',
      language: 'en',
    },
  }),
}));

jest.mock('../../i18n/menu', () => ({
  getMenuItemLabel: (name: string) =>
    ({
      'grilled chicken': 'Grilled Chicken',
    } as Record<string, string>)[name] ?? name,
  getCategoryLabel: (category: string) => category,
  getMenuItemDescription: (
    _name: string,
    _t: any,
    defaultDescription?: string | null
  ) => defaultDescription || '',
}));

const mockUseMenuItems = jest.fn();
jest.mock('../../api/hooks', () => ({
  useMenuItems: (...args: any[]) => mockUseMenuItems(...args),
}));

describe('AllMenuItemsScreen', () => {
  const route = { key: 'all', name: 'AllMenuItems', params: undefined };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state', () => {
    mockUseMenuItems.mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
      error: null,
      isFetching: false,
      refetch: jest.fn(),
    });

    const { getByText } = render(
      <AllMenuItemsScreen
        navigation={{
          goBack: jest.fn(),
          navigate: jest.fn(),
        }}
        route={route as any}
      />
    );

    expect(getByText('Loading menu')).toBeTruthy();
  });

  it('renders error state with retry action', () => {
    const refetch = jest.fn();
    mockUseMenuItems.mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
      error: { message: 'Network down' },
      isFetching: false,
      refetch,
    });

    const { getByText } = render(
      <AllMenuItemsScreen
        navigation={{
          goBack: jest.fn(),
          navigate: jest.fn(),
        }}
        route={route as any}
      />
    );

    expect(mockEmptyState).toHaveBeenCalled();
    expect(mockEmptyState.mock.calls[0][0]).toMatchObject({
      title: 'Unable to load menu',
      description: 'Network down',
    });
    fireEvent.press(getByText('Retry'));
    expect(refetch).toHaveBeenCalled();
  });

  it('renders menu sections and opens the description modal', () => {
    mockUseMenuItems.mockReturnValue({
      data: [
        {
          category: 'Entree',
          description: 'smoky grilled chicken',
          id: 'entree-1',
          isActive: true,
          name: 'grilled chicken',
          priceCents: 950,
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      isFetching: false,
      refetch: jest.fn(),
    });

    const { getByText } = render(
      <AllMenuItemsScreen
        navigation={{
          goBack: jest.fn(),
          navigate: jest.fn(),
        }}
        route={route as any}
      />
    );

    expect(getByText('Entree')).toBeTruthy();
    expect(getByText('Grilled Chicken')).toBeTruthy();
    expect(getByText('$9.50')).toBeTruthy();
    expect(getByText('Description')).toBeTruthy();

    fireEvent.press(getByText('Description'));
    expect(getByText('smoky grilled chicken')).toBeTruthy();
  });
});
