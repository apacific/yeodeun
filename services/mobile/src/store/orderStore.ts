import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Combo, DishSelectionDto, MenuItemDto } from '../types/api';

export interface ALaCarteItem {
  item: MenuItemDto;
  quantity: number;
}

export interface ComboMealEntry {
  id: string;
  selection: DishSelectionDto;
  totalCents: number;
}

export interface OrderState {
  currentCombo: Combo;
  currentSelection: DishSelectionDto;
  comboMeals: ComboMealEntry[];
  notes?: string;
  substitutions: {
    itemId: string;
    instruction: string;
  }[];
  aLaCarteItems: ALaCarteItem[];
  setEntree: (itemId?: string) => void;
  setVegetable: (itemId?: string) => void;
  setFruit: (itemId?: string) => void;
  setSide: (itemId?: string) => void;
  addSauce: (sauceId: string) => void;
  removeSauce: (sauceId: string) => void;
  addTopping: (toppingId: string) => void;
  removeTopping: (toppingId: string) => void;
  setBeverage: (beverageId?: string) => void;
  setNotes: (notes?: string) => void;
  addSubstitution: (itemId: string, instruction: string) => void;
  removeSubstitution: (itemId: string) => void;
  addALaCarteItem: (item: MenuItemDto) => void;
  removeALaCarteItem: (itemId: string) => void;
  clearALaCarte: () => void;
  addCurrentComboMeal: (totalCents: number) => void;
  removeComboMeal: (comboMealId: string) => void;
  clearCurrentSelection: () => void;
  reset: () => void;
  getSelection: () => DishSelectionDto;
  getSauceIds: () => string[];
  getToppingIds: () => string[];
  isComboComplete: () => boolean;
}

const createEmptySelection = (): DishSelectionDto => ({
  beverageId: undefined,
  entreeId: undefined,
  fruitId: undefined,
  sauceIds: [],
  sideId: undefined,
  toppingIds: [],
  vegetableId: undefined,
});

const cloneSelection = (selection: DishSelectionDto): DishSelectionDto => ({
  beverageId: selection.beverageId,
  entreeId: selection.entreeId,
  fruitId: selection.fruitId,
  sauceIds: [...(selection.sauceIds ?? [])],
  sideId: selection.sideId,
  toppingIds: [...(selection.toppingIds ?? [])],
  vegetableId: selection.vegetableId,
});

const createComboMealId = () =>
  `combo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Use order store.
 */
export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      addALaCarteItem: (item: MenuItemDto) =>
        set((state) => {
          const existing = state.aLaCarteItems.find((entry) => entry.item.id === item.id);
          if (!existing) {
            return {
              aLaCarteItems: [...state.aLaCarteItems, { item, quantity: 1 }],
            };
          }
          return {
            aLaCarteItems: state.aLaCarteItems.map((entry) =>
              entry.item.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry
            ),
          };
        }),
      addCurrentComboMeal: (totalCents: number) =>
        set((state) => {
          const selection = cloneSelection(state.currentSelection);
          return {
            comboMeals: [
              ...state.comboMeals,
              {
                id: createComboMealId(),
                selection,
                totalCents,
              },
            ],
            currentSelection: createEmptySelection(),
          };
        }),
      addSauce: (sauceId: string) =>
        set((state) => {
          const currentSauceIds = Array.isArray(state.currentSelection.sauceIds)
            ? state.currentSelection.sauceIds
            : [];
          const sauceIds = [...currentSauceIds];
          if (!sauceIds.includes(sauceId) && sauceIds.length < 2) {
            sauceIds.push(sauceId);
          }
          return {
            currentSelection: { ...state.currentSelection, sauceIds },
          };
        }),
      addSubstitution: (itemId: string, instruction: string) =>
        set((state) => {
          const existing = state.substitutions.filter((sub) => sub.itemId !== itemId);
          return {
            substitutions: [...existing, { instruction, itemId }],
          };
        }),
      addTopping: (toppingId: string) =>
        set((state) => {
          const currentToppingIds = Array.isArray(state.currentSelection.toppingIds)
            ? state.currentSelection.toppingIds
            : [];
          const toppingIds = [...currentToppingIds];
          if (!toppingIds.includes(toppingId)) {
            toppingIds.push(toppingId);
          }
          return {
            currentSelection: { ...state.currentSelection, toppingIds },
          };
        }),
      aLaCarteItems: [],

      clearALaCarte: () => set({ aLaCarteItems: [] }),

      clearCurrentSelection: () => set({ currentSelection: createEmptySelection() }),

      comboMeals: [],

      currentCombo: { sauces: [], toppings: [] },

      currentSelection: createEmptySelection(),

      getSauceIds: () => get().currentSelection.sauceIds ?? [],

      getSelection: () => get().currentSelection,

      getToppingIds: () => get().currentSelection.toppingIds ?? [],

      isComboComplete: () => {
        const sel = get().currentSelection;
        return !!(
          sel.entreeId &&
          sel.vegetableId &&
          sel.fruitId &&
          sel.sideId &&
          (sel.sauceIds?.length ?? 0) === 2
        );
      },

      notes: undefined,

      removeALaCarteItem: (itemId: string) =>
        set((state) => ({
          aLaCarteItems: state.aLaCarteItems.flatMap((entry) => {
            if (entry.item.id !== itemId) return [entry];
            if (entry.quantity <= 1) return [];
            return [{ ...entry, quantity: entry.quantity - 1 }];
          }),
        })),

      removeComboMeal: (comboMealId: string) =>
        set((state) => ({
          comboMeals: state.comboMeals.filter((comboMeal) => comboMeal.id !== comboMealId),
        })),

      removeSauce: (sauceId: string) =>
        set((state) => ({
          currentSelection: {
            ...state.currentSelection,
            sauceIds: (state.currentSelection.sauceIds ?? []).filter((id) => id !== sauceId),
          },
        })),

      removeSubstitution: (itemId: string) =>
        set((state) => ({
          substitutions: state.substitutions.filter((sub) => sub.itemId !== itemId),
        })),

      removeTopping: (toppingId: string) =>
        set((state) => ({
          currentSelection: {
            ...state.currentSelection,
            toppingIds: (state.currentSelection.toppingIds ?? []).filter(
              (id) => id !== toppingId
            ),
          },
        })),

      reset: () =>
        set({
          aLaCarteItems: [],
          comboMeals: [],
          currentCombo: { sauces: [], toppings: [] },
          currentSelection: createEmptySelection(),
          notes: undefined,
          substitutions: [],
        }),

      setBeverage: (beverageId?: string) =>
        set((state) => ({
          currentSelection: { ...state.currentSelection, beverageId },
        })),

      setEntree: (itemId?: string) =>
        set((state) => ({
          currentSelection: { ...state.currentSelection, entreeId: itemId },
        })),

      setFruit: (itemId?: string) =>
        set((state) => ({
          currentSelection: { ...state.currentSelection, fruitId: itemId },
        })),

      setNotes: (notes?: string) => set({ notes }),
      setSide: (itemId?: string) =>
        set((state) => ({
          currentSelection: { ...state.currentSelection, sideId: itemId },
        })),
      setVegetable: (itemId?: string) =>
        set((state) => ({
          currentSelection: { ...state.currentSelection, vegetableId: itemId },
        })),
      substitutions: [],
    }),
    {
      name: 'yeodeun-order-store',
      partialize: (state) => ({
        aLaCarteItems: state.aLaCarteItems,
        comboMeals: state.comboMeals,
        currentSelection: state.currentSelection,
        notes: state.notes,
        substitutions: state.substitutions,
      }),
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
