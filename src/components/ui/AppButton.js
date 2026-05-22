import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useLanguage } from '../../i18n/LanguageProvider';

function AppButton({ title, onPress, disabled = false, variant = 'primary', style }) {
  const { colors, radius, spacing, typography } = useAppTheme();
  const { tx } = useLanguage();

  const isSecondary = variant === 'secondary';
  const variantStyle = isSecondary
    ? {
        backgroundColor: colors.surfaceAlt,
        borderColor: colors.border,
        borderWidth: 1,
      }
    : {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
        borderWidth: 0,
      };
  const disabledStyle = {
    backgroundColor: colors.border,
    borderColor: colors.border,
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        {
          minHeight: spacing[6],
          borderRadius: radius.card,
        },
        disabled ? disabledStyle : variantStyle,
        style,
      ]}
    >
      <Text
        style={[
          typography.body,
          styles.text,
          { color: isSecondary ? colors.textPrimary : colors.textOnColor },
        ]}
      >
        {tx(title)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  text: {
    fontWeight: '700',
    textAlign: 'center',
    flexShrink: 1,
  },
});

export default AppButton;
