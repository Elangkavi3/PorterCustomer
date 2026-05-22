import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import AppScreen from '../../components/ui/AppScreen';
import AppCard from '../../components/ui/AppCard';
import AppButton from '../../components/ui/AppButton';
import { useAppTheme } from '../../theme/ThemeProvider';

function AadhaarKYCScreen({ navigation }) {
  const { colors, spacing, typography } = useAppTheme();

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing[2], paddingBottom: spacing[6], flexGrow: 1, justifyContent: 'center' }}>
        <AppCard>
          <Text style={[typography.h1, { color: colors.textPrimary }]}>Aadhaar KYC</Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>
            Verify your identity using Aadhaar number.
          </Text>

          <View style={{ marginTop: spacing[4], alignItems: 'center', justifyContent: 'center', minHeight: 120, borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: colors.border }}>
            <Text style={[typography.label, { color: colors.textSecondary }]}>KYC Module Placeholder</Text>
          </View>

          <AppButton
            title="Continue"
            onPress={() => navigation.navigate('DLValidation')}
            style={{ marginTop: spacing[4] }}
          />
        </AppCard>
      </ScrollView>
    </AppScreen>
  );
}

export default AadhaarKYCScreen;
