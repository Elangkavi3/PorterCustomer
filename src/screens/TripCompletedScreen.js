import React, { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { ScrollView, Text, View } from 'react-native';
import AppButton from '../components/ui/AppButton';
import AppCard from '../components/ui/AppCard';
import AppHeader from '../components/ui/AppHeader';
import AppScreen from '../components/ui/AppScreen';
import StatusBadge from '../components/StatusBadge';
import { useAppTheme } from '../theme/ThemeProvider';
import { useLanguage } from '../i18n/LanguageProvider';
import { parseJson } from '../utils/tripStatusManager';

const KEY = 'lastCompletedTrip';

function formatAmount(value) {
  const amount = Number.isFinite(value) ? value : 0;
  return `INR ${amount.toLocaleString('en-IN')}`;
}

function formatDate(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function TripCompletedScreen({ navigation, route }) {
  const { colors, spacing, typography } = useAppTheme();
  const { t } = useLanguage();
  const [summary, setSummary] = useState(route?.params?.trip || null);

  useFocusEffect(
    useCallback(() => {
      async function loadSummary() {
        if (route?.params?.trip) {
          setSummary(route.params.trip);
          return;
        }

        const raw = await AsyncStorage.getItem(KEY);
        setSummary(parseJson(raw, null));
      }

      loadSummary();
    }, [route?.params?.trip]),
  );

  return (
    <AppScreen edges={['top', 'bottom']}>
      <AppHeader title={t('tripSummary.title')} subtitle="View-only lifecycle" />

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing[2], paddingBottom: spacing[6] }}>
        <AppCard>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>{summary?.id || '---'}</Text>
            <StatusBadge status="UNPAID" />
          </View>

          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>
            {t('dashboard.pickup')}
          </Text>
          <Text style={[typography.label, { color: colors.textPrimary }]}>{summary?.pickup || '-'}</Text>

          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>
            {t('dashboard.drop')}
          </Text>
          <Text style={[typography.label, { color: colors.textPrimary }]}>{summary?.drop || '-'}</Text>

          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>
            {t('jobs.dateLabel')}
          </Text>
          <Text style={[typography.label, { color: colors.textPrimary }]}>
            {summary?.date || formatDate(summary?.completedAt)}
          </Text>

          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>
            {t('jobs.earningsLabel')}
          </Text>
          <Text style={[typography.label, { color: colors.textPrimary }]}>
            {formatAmount(summary?.earnings)}
          </Text>
        </AppCard>

        <AppCard style={{ marginTop: spacing[1] }}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>{t('tripSummary.statusTimeline')}</Text>
          <Text style={[typography.body, { color: colors.textPrimary, marginTop: spacing[1] }]}>• Trip assigned</Text>
          <Text style={[typography.body, { color: colors.textPrimary, marginTop: spacing[1] }]}>• Pickup confirmed</Text>
          <Text style={[typography.body, { color: colors.textPrimary, marginTop: spacing[1] }]}>• In transit</Text>
          <Text style={[typography.body, { color: colors.textPrimary, marginTop: spacing[1] }]}>• Delivery confirmed</Text>
          <Text style={[typography.body, { color: colors.textPrimary, marginTop: spacing[1] }]}>• Trip completed</Text>
          <Text style={[typography.body, { color: colors.textPrimary, marginTop: spacing[1] }]}>• Payment pending admin settlement</Text>
        </AppCard>

        <AppButton
          title="Return to Jobs"
          onPress={() => navigation.navigate('Jobs')}
          style={{ marginTop: spacing[2] }}
        />
      </ScrollView>
    </AppScreen>
  );
}

export default TripCompletedScreen;
