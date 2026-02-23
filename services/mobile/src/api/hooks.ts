import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import {
  MenuItemDto,
  MenuCategoryCountDto,
  QuoteResponseDto,
  NutritionQuoteResponseDto,
  SelectionRequestDto,
  NutritionQuoteRequestDto,
  ContactRequestDto,
  ContactResponseDto,
  CheckoutRequestDto,
  CheckoutResponseDto,
} from '../types/api';

// Query keys factory
/**
 * Menu keys.
 */
export const menuKeys = {
  all: ['menu'] as const,
  categories: () => [...menuKeys.all, 'categories'] as const,
  counts: () => [...menuKeys.all, 'counts'] as const,
  items: () => [...menuKeys.all, 'items'] as const,
  itemsByCategory: (category: string) =>
    [...menuKeys.items(), category] as const,
  itemsSearched: (q: string, category?: string) =>
    [...menuKeys.items(), 'search', q, category] as const,
};

/**
 * Quote keys.
 */
export const quoteKeys = {
  all: ['quote'] as const,
  pricing: () => [...quoteKeys.all, 'pricing'] as const,
  nutrition: () => [...quoteKeys.all, 'nutrition'] as const,
};

// Menu queries
/**
 * Use menu categories.
 */
export const useMenuCategories = () => {
  return useQuery({
    queryKey: menuKeys.categories(),
    queryFn: async () => {
      const categories = await apiClient.get<string[]>('/api/menu/categories');
      return categories;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

/**
 * Use menu counts.
 */
export const useMenuCounts = () => {
  return useQuery({
    queryKey: menuKeys.counts(),
    queryFn: async () => {
      const counts = await apiClient.get<MenuCategoryCountDto[]>(
        '/api/menu/counts'
      );
      return counts;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

/**
 * Use menu items.
 */
export const useMenuItems = (
  category?: string,
  searchQuery?: string,
  includeNutrition: boolean = false
) => {
  return useQuery({
    queryKey:
      searchQuery && category
        ? menuKeys.itemsSearched(searchQuery, category)
        : category
          ? menuKeys.itemsByCategory(category)
          : menuKeys.items(),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (searchQuery) params.append('q', searchQuery);
      if (includeNutrition) params.append('includeNutrition', 'true');

      const items = await apiClient.get<MenuItemDto[]>(
        `/api/menu/items?${params.toString()}`
      );
      return items;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

// Quote mutations
/**
 * Use pricing quote.
 */
export const usePricingQuote = () => {
  return useMutation({
    mutationFn: async (request: SelectionRequestDto) => {
      const response = await apiClient.post<QuoteResponseDto>(
        '/api/quote',
        request
      );
      return response;
    },
  });
};

/**
 * Use nutrition quote.
 */
export const useNutritionQuote = () => {
  return useMutation({
    mutationFn: async (request: NutritionQuoteRequestDto) => {
      const response = await apiClient.post<NutritionQuoteResponseDto>(
        '/api/nutrition-quote',
        request
      );
      return response;
    },
  });
};

/**
 * Use contact submit.
 */
export const useContactSubmit = () => {
  return useMutation({
    mutationFn: async (request: ContactRequestDto) => {
      const response = await apiClient.post<ContactResponseDto>(
        '/api/contact',
        request
      );
      return response;
    },
  });
};

/**
 * Use checkout submit.
 */
export const useCheckoutSubmit = () => {
  return useMutation({
    mutationFn: async (request: CheckoutRequestDto) => {
      const response = await apiClient.post<CheckoutResponseDto>(
        '/api/checkout',
        request
      );
      return response;
    },
  });
};
