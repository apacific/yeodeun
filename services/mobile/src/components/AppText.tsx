import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Text as PaperText } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

type AppTextProps = React.ComponentProps<typeof PaperText>;

export const AppText = ({ style, ...props }: AppTextProps) => {
  const { i18n } = useTranslation();
  const isEnglish = useMemo(
    () => (i18n.resolvedLanguage || i18n.language || 'en').toLowerCase().startsWith('en'),
    [i18n.language, i18n.resolvedLanguage]
  );

  return (
    <PaperText
      {...props}
      style={[style, isEnglish ? styles.englishFont : null]}
    />
  );
};

const styles = StyleSheet.create({
  englishFont: {
    fontFamily: 'Aller_Bd',
    fontWeight: 'normal',
  },
});
