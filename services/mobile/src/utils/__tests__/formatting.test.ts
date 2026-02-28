import { formatPrice, formatGrams, formatNutritionValue } from '../formatting';

describe('formatting utils', () => {
  it('formats cents into dollars', () => {
    expect(formatPrice(2100)).toBe('$21.00');
    expect(formatPrice(99)).toBe('$0.99');
  });

  it('formats grams and kilograms', () => {
    expect(formatGrams(85)).toBe('85g');
    expect(formatGrams(1250)).toBe('1.3kg');
  });

  it('formats nutrition values by unit', () => {
    expect(formatNutritionValue(12.8, 'g')).toBe('12.8g');
    expect(formatNutritionValue(12.8, 'mg')).toBe('13mg');
    expect(formatNutritionValue(85.6, 'kcal')).toBe('86kcal');
  });

  it('handles invalid nutrition values defensively', () => {
    expect(formatNutritionValue(Number.NaN, 'g')).toBe('0g');
  });
});
