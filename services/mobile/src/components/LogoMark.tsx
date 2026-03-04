import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

const logo = require('../../assets/img/yeodeun-logo.png');

interface LogoMarkProps {
  size?: number;
}

/**
 * Renders the Yeodeun logo mark at a configurable square size.
 *
 * @param size Target width and height in pixels.
 * @returns Centered logo image.
 */
export const LogoMark = ({ size = 120 }: LogoMarkProps) => {
  return (
    <View style={styles.container}>
      <Image source={logo} style={{ height: size, width: size }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
