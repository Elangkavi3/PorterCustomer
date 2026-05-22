import React, { useCallback, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppScreen from '../../components/ui/AppScreen';
import AppHeader from '../../components/ui/AppHeader';
import AppCard from '../../components/ui/AppCard';
import AppButton from '../../components/ui/AppButton';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useLanguage } from '../../i18n/LanguageProvider';

const KEYS = {
  isKYCCompleted: 'isKYCCompleted',
  onboardingCompleted: 'onboardingCompleted',
  dailyHealthCheckDate: 'dailyHealthCheckDate',
};

function todayStamp() {
  const now = new Date();
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, '0');
  const d = `${now.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function DailyHealthDeclarationScreen({ navigation }) {
  const { colors, spacing, radius, typography } = useAppTheme();
  const { t } = useLanguage();
  const [checked1, setChecked1] = useState(false);
  const [checked2, setChecked2] = useState(false);

  const handleFinalConfirmation = useCallback(async () => {
    if (!checked1 || !checked2) {
      Alert.alert('Please confirm both statements');
      return;
    }
    try {
      await AsyncStorage.multiSet([
        [KEYS.isKYCCompleted, 'true'],
        [KEYS.onboardingCompleted, 'true'],
        [KEYS.dailyHealthCheckDate, todayStamp()],
      ]);

      const rootNavigation = navigation.getParent();
      if (rootNavigation) {
        rootNavigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
        return;
      }

      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (_error) {
      Alert.alert('Unable to finish onboarding', 'Please try again.');
    }
  }, [navigation, checked1, checked2]);

  return (
    <AppScreen>
      <AppHeader title={t('healthDeclaration.title')} subtitle={t('healthDeclaration.subtitle')} />
      <View style={{ padding: spacing[2] }}>
        <AppCard>
          <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing[2] }]}>
            {t('healthDeclaration.confirmEach')}
          </Text>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderColor: checked1 ? colors.success : colors.border,
              borderWidth: 1,
              borderRadius: radius.card,
              padding: spacing[2],
              marginBottom: spacing[1],
            }}
            onPress={() => setChecked1(!checked1)}
          >
            <Text style={[typography.label, { color: colors.textPrimary }]}>{t('healthDeclaration.statement1')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderColor: checked2 ? colors.success : colors.border,
              borderWidth: 1,
              borderRadius: radius.card,
              padding: spacing[2],
            }}
            onPress={() => setChecked2(!checked2)}
          >
            <Text style={[typography.label, { color: colors.textPrimary }]}>{t('healthDeclaration.statement2')}</Text>
          </TouchableOpacity>
          <AppButton
            title={t('healthDeclaration.submit')}
            onPress={handleFinalConfirmation}
            style={{ marginTop: spacing[2] }}
          />
        </AppCard>
      </View>
    </AppScreen>
  );
}

export default DailyHealthDeclarationScreen;
