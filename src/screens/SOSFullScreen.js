import React, { useCallback } from 'react';
import { Alert, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppButton from '../components/ui/AppButton';
import AppCard from '../components/ui/AppCard';
import AppHeader from '../components/ui/AppHeader';
import AppScreen from '../components/ui/AppScreen';
import { useAppTheme } from '../theme/ThemeProvider';
import { useLanguage } from '../i18n/LanguageProvider';

const INCIDENTS_KEY = 'sosIncidents';

function SOSFullScreen({ navigation }) {
  const { colors, spacing, typography } = useAppTheme();
  const { t } = useLanguage();

  const confirmEmergency = useCallback(async () => {
    const incident = {
      id: `SOS-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'RAISED',
    };

    try {
      const raw = await AsyncStorage.getItem(INCIDENTS_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const next = Array.isArray(list) ? [incident, ...list] : [incident];
      await AsyncStorage.setItem(INCIDENTS_KEY, JSON.stringify(next));
    } catch (_error) {
      // Keep SOS flow resilient.
    }

    Alert.alert(t('sosSimple.helpTitle'), t('sosSimple.helpMessage'), [
      { text: t('common.ok'), onPress: () => navigation.goBack() },
    ]);
  }, [navigation, t]);

  return (
    <AppScreen edges={['top', 'bottom']}>
      <AppHeader title={t('sosSimple.title')} subtitle={t('sosSimple.subtitle')} />
      <View style={{ paddingHorizontal: spacing[2] }}>
        <AppCard>
          <Text style={[typography.body, { color: colors.textPrimary }]}> 
            {t('sosSimple.confirmMessage')}
          </Text>
          <AppButton
            title={t('sosSimple.confirm')}
            onPress={confirmEmergency}
            style={{ backgroundColor: colors.critical, marginTop: spacing[2] }}
          />
          <AppButton
            title={t('common.cancel')}
            variant="secondary"
            onPress={() => navigation.goBack()}
            style={{ marginTop: spacing[1] }}
          />
        </AppCard>
      </View>
    </AppScreen>
  );
}

export default SOSFullScreen;
