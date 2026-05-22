import React, { useCallback, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppBadge from '../components/ui/AppBadge';
import AppCard from '../components/ui/AppCard';
import AppHeader from '../components/ui/AppHeader';
import AppScreen from '../components/ui/AppScreen';
import EmptyState from '../components/EmptyState';
import { useAppTheme } from '../theme/ThemeProvider';
import { useLanguage } from '../i18n/LanguageProvider';
import { parseJson, normalizeTrip, resolveCurrentTrip, TRIP_STATES, normalizeTripState } from '../utils/tripStatusManager';

const KEYS = {
  jobsList: 'jobsList',
  activeTrip: 'activeTrip',
  tripState: 'tripState',
};

const FILTERS = ['ACTIVE', 'COMPLETED', 'PAID', 'UNPAID'];

function todayStamp() {
  const now = new Date();
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, '0');
  const d = `${now.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatCurrency(value) {
  const amount = Number.isFinite(value) ? value : 0;
  return `INR ${amount.toLocaleString('en-IN')}`;
}

function resolveStatusLabel(status) {
  const normalized = normalizeTripState(status);
  if (normalized === TRIP_STATES.COMPLETED) {
    return 'COMPLETED';
  }
  if (normalized === TRIP_STATES.CANCELLED) {
    return 'CRITICAL';
  }
  return 'ACTIVE';
}

function isPaidJob(job) {
  return String(job?.paymentStatus || '').toUpperCase() === 'PAID';
}

function JobsScreen({ navigation }) {
  const { colors, spacing, radius, typography } = useAppTheme();
  const { t } = useLanguage();

  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('ACTIVE');
  const [jobs, setJobs] = useState([]);

  const loadJobs = useCallback(async () => {
    setIsLoading(true);

    try {
      const rows = await AsyncStorage.multiGet([KEYS.jobsList, KEYS.activeTrip, KEYS.tripState]);
      const data = Object.fromEntries(rows);

      const list = Array.isArray(parseJson(data[KEYS.jobsList], []))
        ? parseJson(data[KEYS.jobsList], []).map(item => normalizeTrip(item, todayStamp())).filter(Boolean)
        : [];

      const resolved = resolveCurrentTrip({
        activeTripRaw: data[KEYS.activeTrip],
        jobsRaw: data[KEYS.jobsList],
        tripStateRaw: data[KEYS.tripState],
        fallbackDate: todayStamp(),
      });

      const active = resolved.trip;
      const merged = active && !list.some(item => item.id === active.id)
        ? [active, ...list]
        : list;

      setJobs(merged);
    } catch (_error) {
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadJobs();
    }, [loadJobs]),
  );

  const filtered = useMemo(() => {
    if (filter === 'ACTIVE') {
      return jobs.filter(item => {
        const state = normalizeTripState(item.status);
        return state !== TRIP_STATES.COMPLETED && state !== TRIP_STATES.CANCELLED;
      });
    }

    if (filter === 'COMPLETED') {
      return jobs.filter(item => normalizeTripState(item.status) === TRIP_STATES.COMPLETED);
    }

    if (filter === 'PAID') {
      return jobs.filter(item => isPaidJob(item));
    }

    return jobs.filter(item => !isPaidJob(item));
  }, [filter, jobs]);

  const openTrip = useCallback(
    item => {
      if (normalizeTripState(item.status) === TRIP_STATES.COMPLETED) {
        navigation.navigate('TripCompleted', { trip: item });
        return;
      }
      navigation.navigate('JobDetailScreen', { job: item, jobId: item.id });
    },
    [navigation],
  );

  return (
    <AppScreen edges={['top', 'bottom']}>
      <AppHeader title={t('tabs.jobs')} subtitle="Dispatch queue and lifecycle" />

      <View style={{ paddingBottom: spacing[1], paddingHorizontal: spacing[2] }}>
        <View style={[styles.filterWrap, { gap: spacing[1] }]}>
          {FILTERS.map(item => {
            const selected = item === filter;
            return (
              <TouchableOpacity
                key={item}
                activeOpacity={0.9}
                onPress={() => setFilter(item)}
                style={{
                  backgroundColor: selected ? colors.primary : colors.surfaceAlt,
                  borderColor: selected ? colors.primary : colors.border,
                  borderRadius: radius.pill,
                  borderWidth: 1,
                  minHeight: spacing[6],
                  paddingHorizontal: spacing[2],
                  ...styles.filterChip,
                }}
              >
                <Text style={[typography.caption, { color: selected ? colors.textOnColor : colors.textPrimary }]}>
                  {t(`status.${item.toLowerCase()}`)}
                </Text>
              </TouchableOpacity>
            );
          })}

        </View>
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ paddingHorizontal: spacing[2] }}>
          <AppCard>
            <EmptyState
              title={t('homeSimple.noTripTitle')}
              message={t('tripSimple.noTripsFound')}
            />
          </AppCard>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: spacing[6], paddingHorizontal: spacing[2] }}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.9} onPress={() => openTrip(item)} style={{ marginBottom: spacing[1] }}>
              <AppCard>
                <View style={styles.rowBetween}>
                  <Text style={[typography.h2, { color: colors.textPrimary }]}>
                    {item.id}
                  </Text>
                  <AppBadge label={resolveStatusLabel(item.status)} />
                </View>

                <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>
                  {t('dashboard.pickup')}
                </Text>
                <Text style={[typography.label, { color: colors.textPrimary }]}>
                  {item.pickup}
                </Text>

                <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>
                  {t('dashboard.drop')}
                </Text>
                <Text style={[typography.label, { color: colors.textPrimary }]}>
                  {item.drop}
                </Text>

                <View style={[styles.rowBetween, { marginTop: spacing[1], paddingTop: spacing[1], borderTopWidth: 1, borderTopColor: colors.border }]}>
                  <View>
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>
                      {t('jobs.dateLabel')}
                    </Text>
                    <Text style={[typography.label, { color: colors.textPrimary }]}>
                      {item.date}
                    </Text>
                  </View>
                  <View style={styles.alignEnd}>
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>
                      {t('jobs.earningsLabel')}
                    </Text>
                    <Text style={[typography.label, { color: colors.textPrimary }]}>
                      {formatCurrency(item.earnings)}
                    </Text>
                  </View>
                </View>
              </AppCard>
            </TouchableOpacity>
          )}
        />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  filterWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  rowBetween: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  alignEnd: {
    alignItems: 'flex-end',
  },
});

export default JobsScreen;
