import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../theme/ThemeProvider';

function OfflineBanner() {
  const { colors, spacing, typography } = useAppTheme();

  return (
    <View
      style={[
        styles.banner,
        {
        backgroundColor: colors.warning,
        borderBottomColor: colors.border,
        paddingHorizontal: spacing[2],
        },
      ]}
    >
      <Text style={[typography.caption, styles.text]}>
        Offline Mode: Live submissions are paused. Showing last synced operational data.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderBottomWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
  },
  text: {
    color: '#FFFFFF',
  },
});

export default OfflineBanner;
