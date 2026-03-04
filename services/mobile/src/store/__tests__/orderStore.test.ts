import { useOrderStore } from '../orderStore';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  removeItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('orderStore', () => {
  beforeEach(() => {
    useOrderStore.getState().reset();
  });

  it('adds and removes a-la-carte quantities', () => {
    const item = {
      category: 'Entree',
      description: null,
      id: 'item-1',
      isActive: true,
      name: 'grilled chicken',
      priceCents: 1000,
    };

    useOrderStore.getState().addALaCarteItem(item as any);
    useOrderStore.getState().addALaCarteItem(item as any);

    expect(useOrderStore.getState().aLaCarteItems[0].quantity).toBe(2);

    useOrderStore.getState().removeALaCarteItem(item.id);
    expect(useOrderStore.getState().aLaCarteItems[0].quantity).toBe(1);

    useOrderStore.getState().removeALaCarteItem(item.id);
    expect(useOrderStore.getState().aLaCarteItems).toHaveLength(0);
  });

  it('caps sauces to 2 and tracks combo completeness', () => {
    const state = useOrderStore.getState();

    state.setEntree('entree-1');
    state.setVegetable('veg-1');
    state.setFruit('fruit-1');
    state.setSide('side-1');

    state.addSauce('s1');
    state.addSauce('s2');
    state.addSauce('s3');

    expect(useOrderStore.getState().currentSelection.sauceIds).toEqual(['s1', 's2']);
    expect(useOrderStore.getState().isComboComplete()).toBe(true);
  });

  it('moves current selection into comboMeals and clears selection', () => {
    const state = useOrderStore.getState();

    state.setEntree('entree-1');
    state.setVegetable('veg-1');
    state.setFruit('fruit-1');
    state.setSide('side-1');
    state.addSauce('s1');
    state.addSauce('s2');

    state.addCurrentComboMeal(2100);

    expect(useOrderStore.getState().comboMeals).toHaveLength(1);
    expect(useOrderStore.getState().comboMeals[0].totalCents).toBe(2100);
    expect(useOrderStore.getState().currentSelection.entreeId).toBeUndefined();
  });
});
