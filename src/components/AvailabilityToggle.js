import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../theme/ThemeProvider';
import { useLanguage } from '../i18n/LanguageProvider';

function AvailabilityToggle({ statusLabel, onPress, disabled = false }) {
  const { colors, radius, spacing, typography } = useAppTheme();
  const { t } = useLanguage();

  return (
    <View
      style={{
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        minHeight: spacing[6],
      }}
    >
      <Text style={[typography.label, { color: colors.textSecondary }]}> 
        {t('homeSimple.availability')}
      </Text>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        disabled={disabled}
        style={{
          alignItems: 'center',
          backgroundColor: disabled ? colors.border : colors.primary,
          borderRadius: radius.pill,
          justifyContent: 'center',
          minHeight: spacing[6],
          minWidth: 140,
          paddingHorizontal: spacing[2],
        }}
      >
        <Text style={[typography.label, { color: colors.textOnColor }]}> 
          {statusLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default AvailabilityToggle;
