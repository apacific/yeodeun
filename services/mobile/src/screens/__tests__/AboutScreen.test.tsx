import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { AboutScreen } from '../AboutScreen';

jest.mock('../../components', () => ({
  LogoMark: () => null,
  ScreenHeader: () => null,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'about.title': 'About Yeodeun',
        'about.paragraph': 'About paragraph',
        'about.mapTitle': 'Map',
        'about.mapUnavailable': 'Map unavailable. Check network access and try again.',
        'about.mapFallback': 'Source: {provider}.',
        'about.mapStaticHint': 'Tap to open OpenStreetMap in a browser.',
        'about.hoursTitle': 'Hours',
        'about.hours': 'Mon-Sat',
        'about.addressTitle': 'Address',
        'about.address': '123 Main St',
        'about.storefrontTitle': 'Storefront',
        'about.viewMenu': 'View menu',
      };

      return map[key] ?? key;
    },
    i18n: {
      resolvedLanguage: 'en',
      language: 'en',
    },
  }),
}));

describe('AboutScreen map fallback behavior', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('tries each provider when map tiles fail and then shows the fallback', () => {
    const { getByTestId, queryByText, getByText } = render(
      <AboutScreen
        navigation={{
          goBack: jest.fn(),
          navigate: jest.fn(),
        } as never}
        route={{ key: 'about', name: 'About', params: undefined } as never}
      />
    );

    const mapImage = getByTestId('about-map-image');

    expect(queryByText('Map unavailable. Check network access and try again.')).toBeNull();
    expect(mapImage.props.source.uri).toContain('rastertiles/voyager');

    fireEvent(mapImage, 'error', { nativeEvent: { error: 'tile blocked' } });
    expect(mapImage.props.source.uri).toContain('rastertiles/light_all');
    expect(queryByText('Map unavailable. Check network access and try again.')).toBeNull();

    fireEvent(mapImage, 'error', { nativeEvent: { error: 'tile blocked' } });
    expect(mapImage.props.source.uri).toContain('World_Topo_Map');
    expect(queryByText('Map unavailable. Check network access and try again.')).toBeNull();

    fireEvent(mapImage, 'error', { nativeEvent: { error: 'tile blocked' } });

    expect(getByText('Map unavailable. Check network access and try again.')).toBeTruthy();
    expect(getByText('Source: ESRI Topographic')).toBeTruthy();
    expect(getByText(/Error: tile blocked/)).toBeTruthy();
  });

  it('opens the static OSM fallback URL when map area is tapped', async () => {
    const openURLMock = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);

    const { getByTestId } = render(
      <AboutScreen
        navigation={{
          goBack: jest.fn(),
          navigate: jest.fn(),
        } as never}
        route={{ key: 'about', name: 'About', params: undefined } as never}
      />
    );

    fireEvent.press(getByTestId('about-map-link'));

    expect(openURLMock).toHaveBeenCalledWith(
      'https://www.openstreetmap.org/?mlat=42.814243&mlon=-73.939569#map=16/42.814243/-73.939569'
    );
  });
});
