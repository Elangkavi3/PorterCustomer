import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppScreen from '../../components/ui/AppScreen';
import AppCard from '../../components/ui/AppCard';
import AppButton from '../../components/ui/AppButton';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useLanguage } from '../../i18n/LanguageProvider';

const PROFILE_KEY = 'driverProfile';

function BasicDetailsScreen({ navigation }) {
  const { colors, spacing, typography, radius } = useAppTheme();
  const { t } = useLanguage();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');

  const isValid = useMemo(
    () => fullName.trim().length > 2 && city.trim().length > 2,
    [fullName, city],
  );

  const saveAndContinue = async () => {
    if (!isValid) {
      Alert.alert('Incomplete Details', 'Please fill in your full name and city.');
      return;
    }

    try {
      const rawProfile = await AsyncStorage.getItem(PROFILE_KEY);
      const profile = rawProfile ? JSON.parse(rawProfile) : {};
      const nextProfile = {
        ...profile,
        name: fullName.trim(),
        email: email.trim(),
        city: city.trim(),
      };
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile));

      navigation.navigate('OnboardingBankDetails');//change
    } catch (error) {
      Alert.alert('Error', 'Failed to save details. Please try again.');
    }
  };

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing[2], paddingBottom: spacing[6], flexGrow: 1, justifyContent: 'center' }}>
        <AppCard>
          <Text style={[typography.h1, { color: colors.textPrimary }]}>{t('auth.basicDetailsTitle')}</Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>
            {t('auth.basicDetailsSubtitle')}
          </Text>

          <View style={{ marginTop: spacing[2], gap: spacing[1] }}>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder={t('auth.fullNamePlaceholder')}
              placeholderTextColor={colors.textSecondary}
              style={{
                minHeight: spacing[6],
                borderRadius: radius.card,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surfaceAlt,
                color: colors.textPrimary,
                paddingHorizontal: spacing[2],
              }}
            />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.emailPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              style={{
                minHeight: spacing[6],
                borderRadius: radius.card,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surfaceAlt,
                color: colors.textPrimary,
                paddingHorizontal: spacing[2],
              }}
            />
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder={t('auth.cityPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              style={{
                minHeight: spacing[6],
                borderRadius: radius.card,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surfaceAlt,
                color: colors.textPrimary,
                paddingHorizontal: spacing[2],
              }}
            />
          </View>

          <AppButton
            title={t('common.continue')}
            onPress={saveAndContinue}
            disabled={!isValid}
            style={{ marginTop: spacing[2] }}
          />
        </AppCard>
      </ScrollView>
    </AppScreen>
  );
}

export default BasicDetailsScreen;
