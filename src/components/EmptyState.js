import React from 'react';
import { Text, View } from 'react-native';
import { useAppTheme } from '../theme/ThemeProvider';
import { useLanguage } from '../i18n/LanguageProvider';

function EmptyState({ title, message }) {
  const { colors, spacing, radius, typography } = useAppTheme();
  const { tx } = useLanguage();

  return (
    <View style={{ alignItems: 'center', paddingVertical: spacing[2] }}>
      <View
        style={{
          alignItems: 'center',
          backgroundColor: colors.surfaceAlt,
          borderColor: colors.border,
          borderRadius: radius.pill,
          borderWidth: 1,
          height: 64,
          justifyContent: 'center',
          width: 64,
        }}
      >
        <Text style={[typography.label, { color: colors.textSecondary }]}>TRIP</Text>
      </View>
      <Text
        style={[
          typography.h2,
          { color: colors.textPrimary, marginTop: spacing[1], textAlign: 'center' },
        ]}
      >
        {tx(title)}
      </Text>
      <Text
        style={[
          typography.caption,
          { color: colors.textSecondary, marginTop: spacing[1], textAlign: 'center' },
        ]}
      >
        {tx(message)}
      </Text>
    </View>
  );
}

export default EmptyState;
