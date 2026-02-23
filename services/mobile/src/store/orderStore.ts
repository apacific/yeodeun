import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DishSelectionDto, Combo, MenuItemDto } from '../types/api';

export interface ALaCarteItem {
  item: MenuItemDto;
  quantity: number;
}

export interface OrderState {
  // Current combo being built
  currentCombo: Combo;
  
  // Current selection DTO (for API calls)
  currentSelection: DishSelectionDto;

  // Order notes
  notes?: string;

  // Substitutions
  substitutions: {
    itemId: string;
    instruction: string;
  }[];

  // A-la-carte items
  aLaCarteItems: ALaCarteItem[];

  // Setters
  setEntree: (itemId?: string) => void;
  setVegetable: (itemId?: string) => void;
  setFruit: (itemId?: string) => void;
  setSide: (itemId?: string) => void;
  addSauce: (sauceId: string) => void;
  removeSauce: (sauceId: string) => void;
  addTopping: (toppingId: string) => void;
  removeTopping: (toppingId: string) => void;
  setBeverage: (beverageId?: string) => void;

  // Notes and substitutions
  setNotes: (notes?: string) => void;
  addSubstitution: (itemId: string, instruction: string) => void;
  removeSubstitution: (itemId: string) => void;

  // A-la-carte actions
  addALaCarteItem: (item: MenuItemDto) => void;
  removeALaCarteItem: (itemId: string) => void;
  clearALaCarte: () => void;

  // Reset
  reset: () => void;

  // Getters
  getSelection: () => DishSelectionDto;
  getSauceIds: () => string[];
  getToppingIds: () => string[];
  isComboComplete: () => boolean;
}

const initialSelection: DishSelectionDto = {
  entreeId: undefined,
  vegetableId: undefined,
  fruitId: undefined,
  sideId: undefined,
  sauceIds: [],
  toppingIds: [],
  beverageId: undefined,
};

/**
 * Use order store.
 */
export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      currentCombo: { sauces: [], toppings: [] },
      currentSelection: initialSelection,
      notes: undefined,
      substitutions: [],
      aLaCarteItems: [],

  setEntree: (itemId?: string) =>
    set((state) => ({
      currentSelection: { ...state.currentSelection, entreeId: itemId },
    })),

  setVegetable: (itemId?: string) =>
    set((state) => ({
      currentSelection: { ...state.currentSelection, vegetableId: itemId },
    })),

  setFruit: (itemId?: string) =>
    set((state) => ({
      currentSelection: { ...state.currentSelection, fruitId: itemId },
    })),

  setSide: (itemId?: string) =>
    set((state) => ({
      currentSelection: { ...state.currentSelection, sideId: itemId },
    })),

  addSauce: (sauceId: string) =>
    set((state) => {
      const sauceIds = [...state.currentSelection.sauceIds];
      if (!sauceIds.includes(sauceId) && sauceIds.length < 2) {
        sauceIds.push(sauceId);
      }
      return {
        currentSelection: { ...state.currentSelection, sauceIds },
      };
    }),

  removeSauce: (sauceId: string) =>
    set((state) => ({
      currentSelection: {
        ...state.currentSelection,
        sauceIds: state.currentSelection.sauceIds.filter((id) => id !== sauceId),
      },
    })),

  addTopping: (toppingId: string) =>
    set((state) => {
      const toppingIds = [...state.currentSelection.toppingIds];
      if (!toppingIds.includes(toppingId)) {
        toppingIds.push(toppingId);
      }
      return {
        currentSelection: { ...state.currentSelection, toppingIds },
      };
    }),

  removeTopping: (toppingId: string) =>
    set((state) => ({
      currentSelection: {
        ...state.currentSelection,
        toppingIds: state.currentSelection.toppingIds.filter(
          (id) => id !== toppingId
        ),
      },
    })),

  setBeverage: (beverageId?: string) =>
    set((state) => ({
      currentSelection: { ...state.currentSelection, beverageId },
    })),

  setNotes: (notes?: string) => set({ notes }),

  addSubstitution: (itemId: string, instruction: string) =>
    set((state) => {
      const existing = state.substitutions.filter(
        (sub) => sub.itemId !== itemId
      );
      return {
        substitutions: [...existing, { itemId, instruction }],
      };
    }),

  removeSubstitution: (itemId: string) =>
    set((state) => ({
      substitutions: state.substitutions.filter(
        (sub) => sub.itemId !== itemId
      ),
    })),

  addALaCarteItem: (item: MenuItemDto) =>
    set((state) => {
      const existing = state.aLaCarteItems.find(
        (entry) => entry.item.id === item.id
      );
      if (!existing) {
        return {
          aLaCarteItems: [...state.aLaCarteItems, { item, quantity: 1 }],
        };
      }
      return {
        aLaCarteItems: state.aLaCarteItems.map((entry) =>
          entry.item.id === item.id
            ? { ...entry, quantity: entry.quantity + 1 }
            : entry
        ),
      };
    }),

  removeALaCarteItem: (itemId: string) =>
    set((state) => ({
      aLaCarteItems: state.aLaCarteItems.flatMap((entry) => {
        if (entry.item.id !== itemId) return [entry];
        if (entry.quantity <= 1) return [];
        return [{ ...entry, quantity: entry.quantity - 1 }];
      }),
    })),

  clearALaCarte: () => set({ aLaCarteItems: [] }),

  reset: () =>
    set({
      currentCombo: { sauces: [], toppings: [] },
      currentSelection: initialSelection,
      notes: undefined,
      substitutions: [],
      aLaCarteItems: [],
    }),

  getSelection: () => get().currentSelection,
  getSauceIds: () => get().currentSelection.sauceIds,
  getToppingIds: () => get().currentSelection.toppingIds,
      isComboComplete: () => {
        const sel = get().currentSelection;
        return !!(
          sel.entreeId &&
          sel.vegetableId &&
          sel.fruitId &&
          sel.sideId &&
          sel.sauceIds.length === 2
        );
      },
    }),
    {
      name: 'yeodeun-order-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentSelection: state.currentSelection,
        notes: state.notes,
        substitutions: state.substitutions,
        aLaCarteItems: state.aLaCarteItems,
      }),
    }
  )
);
