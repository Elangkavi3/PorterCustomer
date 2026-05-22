import React, { useCallback } from 'react';
import { Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppButton from '../components/ui/AppButton';
import AppCard from '../components/ui/AppCard';
import AppHeader from '../components/ui/AppHeader';
import AppScreen from '../components/ui/AppScreen';
import { useAppTheme } from '../theme/ThemeProvider';
import { useLanguage } from '../i18n/LanguageProvider';

const STORAGE_KEYS = {
  driverAccessState: 'driverAccessState',
  driverRole: 'driverRole',
};

function AccessRevokedScreen({ navigation }) {
  const { colors, spacing, typography } = useAppTheme();
  const { t } = useLanguage();

  const returnToLogin = useCallback(async () => {
    await AsyncStorage.multiRemove([STORAGE_KEYS.driverAccessState, STORAGE_KEYS.driverRole]);

    navigation.reset({
      index: 0,
      routes: [{ name: 'AuthStack', params: { initialScreen: 'Login' } }],
    });
  }, [navigation]);

  return (
    <AppScreen edges={['top', 'bottom']}>
      <AppHeader title={t('security.accessRevokedTitle')} />
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: spacing[2] }}>
        <AppCard>
          <Text style={[typography.body, { color: colors.textPrimary }]}>
            {t('security.accessRevokedMessage')}
          </Text>
          <AppButton
            title={t('security.returnToLogin')}
            onPress={returnToLogin}
            style={{ marginTop: spacing[2] }}
          />
        </AppCard>
      </View>
    </AppScreen>
  );
}

export default AccessRevokedScreen;
