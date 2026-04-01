import { getCategoryKey, getMenuItemKey } from '../menu';

describe('i18n menu key helpers', () => {
  it('normalizes category keys', () => {
    expect(getCategoryKey('  Entree  ')).toBe('entree');
    expect(getCategoryKey('SIDE')).toBe('side');
  });

  it('normalizes menu item keys', () => {
    expect(getMenuItemKey('Salmon Filet')).toBe('salmon_filet');
    expect(getMenuItemKey('  Hot Pepper Sauce  ')).toBe('hot_pepper_sauce');
    expect(getMenuItemKey('hóngshāo ròu')).toBe('h_ngsh_o_r_u');
  });
});
