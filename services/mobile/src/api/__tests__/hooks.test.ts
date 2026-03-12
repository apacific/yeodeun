import React from 'react';
import { Text } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react-native';
import { useMenuItems } from '../hooks';
import { apiClient } from '../client';
import { MenuItemDto } from '../../types/api';

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn((cb: (state: { isConnected: boolean; isInternetReachable?: boolean }) => void) => {
    cb({
      isConnected: true,
      isInternetReachable: true,
    });
    return {
      remove: jest.fn(),
    };
  }),
}));

const menuItems: MenuItemDto[] = [
  {
    id: 'entree-1',
    category: 'Entree',
    description: 'Grilled chicken meal',
    isActive: true,
    name: 'grilled chicken',
    priceCents: 1200,
  },
];

const MenuItemsProbe = ({ category }: { category: string }) => {
  const query = useMenuItems(category);

  if (query.isLoading) {
    return React.createElement(Text, null, 'loading');
  }

  if (query.isError) {
    return React.createElement(Text, null, 'error');
  }

  return React.createElement(Text, { testID: 'result' }, query.data?.[0]?.id);
};

describe('menu hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('queries /api/menu/items with category filter and returns data', async () => {
    jest.spyOn(apiClient, 'get').mockResolvedValue(menuItems);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
          gcTime: 0,
        },
      },
    });

    const { getByText, getByTestId } = render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(MenuItemsProbe, { category: 'Entree' })
      )
    );

    expect(getByText('loading')).toBeTruthy();

    await waitFor(() => {
      expect(getByTestId('result')).toBeTruthy();
      expect(getByTestId('result').props.children).toBe('entree-1');
    });

    expect(apiClient.get).toHaveBeenCalledWith('/api/menu/items?category=Entree');
  });

  it('supports a refetch cycle after query invalidation', async () => {
    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValue(menuItems);
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
          gcTime: 0,
        },
      },
    });

    const { getByTestId } = render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(MenuItemsProbe, { category: 'Entree' })
      )
    );

    await waitFor(() => {
      expect(getByTestId('result')).toBeTruthy();
    });

    await queryClient.invalidateQueries({ queryKey: ['menu', 'items', 'Entree'] });

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledTimes(2);
    });
  });
});
