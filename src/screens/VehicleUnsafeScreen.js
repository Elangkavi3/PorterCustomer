import React from 'react';
import { Text, View } from 'react-native';
import AppScreen from '../components/ui/AppScreen';
import AppCard from '../components/ui/AppCard';
import AppButton from '../components/ui/AppButton';
import AppHeader from '../components/ui/AppHeader';
import { useAppTheme } from '../theme/ThemeProvider';
import { useLanguage } from '../i18n/LanguageProvider';

function VehicleUnsafeScreen({ navigation }) {
  const { colors, spacing, typography } = useAppTheme();
  const { t } = useLanguage();

  return (
    <AppScreen>
      <AppHeader title={t('vehicleUnsafe.title')} subtitle={t('vehicleUnsafe.subtitle')} />
      <View style={{ paddingHorizontal: spacing[2] }}>
        <AppCard>
          <Text style={[typography.body, { color: colors.textPrimary }]}>{t('vehicleUnsafe.message')}</Text>
          <AppButton title={t('vehicleUnsafe.backToDashboard')} onPress={() => navigation.navigate('HomeMain')} style={{ marginTop: spacing[2] }} />
        </AppCard>
      </View>
    </AppScreen>
  );
}

export default VehicleUnsafeScreen;
