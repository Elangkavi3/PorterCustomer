import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import AppButton from '../components/ui/AppButton';
import AppCard from '../components/ui/AppCard';
import AppHeader from '../components/ui/AppHeader';
import AppScreen from '../components/ui/AppScreen';
import StatusBadge from '../components/StatusBadge';
import StepIndicator from '../components/StepIndicator';
import OTPModal from '../components/OTPModal';
import ExpenseModal from '../components/ExpenseModal';
import { useAppTheme } from '../theme/ThemeProvider';
import { useLanguage } from '../i18n/LanguageProvider';
import { useOperations } from '../runtime/OperationsProvider';
import {
  normalizeTrip,
  normalizeTripState,
  parseJson,
  TRIP_STATES,
} from '../utils/tripStatusManager';

const KEYS = {
  activeTrip: 'activeTrip',
  tripState: 'tripState',
  jobsList: 'jobsList',
  homeState: 'homeState',
  lastCompletedTrip: 'lastCompletedTrip',
};

function todayStamp() {
  const now = new Date();
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, '0');
  const d = `${now.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function ActiveTripScreen({ navigation, route }) {
  const { colors, spacing, typography } = useAppTheme();
  const { t } = useLanguage();
  const { isOffline, queueOperationalAction } = useOperations();

  const [isLoading, setIsLoading] = useState(true);
  const [trip, setTrip] = useState(normalizeTrip(route?.params?.trip || route?.params?.job, todayStamp()));
  const [tripState, setTripState] = useState(TRIP_STATES.ASSIGNED);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const navigateToHome = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.navigate('HomeMain');
      return;
    }

    // ActiveTripEntry is mounted in RootStack, so jump to tabs explicitly.
    navigation.navigate('MainTabs', { homeInitialRoute: 'HomeMain' });
  }, [navigation]);

  const navigateToTripCompleted = useCallback(summary => {
    const currentState = navigation.getState?.();
    const currentRouteNames = currentState?.routeNames || [];

    if (currentRouteNames.includes('TripCompleted')) {
      navigation.replace('TripCompleted', { trip: summary });
      return;
    }

    const parent = navigation.getParent?.();
    const parentState = parent?.getState?.();
    const parentRouteNames = parentState?.routeNames || [];

    if (parent && parentRouteNames.includes('Home')) {
      parent.navigate('Home', {
        screen: 'TripCompleted',
        params: { trip: summary },
      });
      return;
    }

    navigation.navigate('MainTabs', {
      screen: 'Home',
      params: {
        screen: 'TripCompleted',
        params: { trip: summary },
      },
    });
  }, [navigation]);

  const persistTripState = useCallback(async nextState => {
    if (!trip) {
      return;
    }

    const normalizedNext = normalizeTripState(nextState);
    const nextTrip = { ...trip, status: normalizedNext };
    const jobsRaw = await AsyncStorage.getItem(KEYS.jobsList);
    const jobs = parseJson(jobsRaw, []);
    const nextJobs = Array.isArray(jobs)
      ? jobs.map(item => (item?.id === trip.id ? { ...item, status: normalizedNext } : item))
      : [];

    await AsyncStorage.multiSet([
      [KEYS.activeTrip, JSON.stringify(nextTrip)],
      [KEYS.tripState, normalizedNext],
      [KEYS.jobsList, JSON.stringify(nextJobs)],
    ]);

    setTrip(nextTrip);
    setTripState(normalizedNext);
  }, [trip]);

  const loadTrip = useCallback(async () => {
    setIsLoading(true);

    try {
      const rows = await AsyncStorage.multiGet([KEYS.activeTrip, KEYS.tripState]);
      const data = Object.fromEntries(rows);

      const activeTrip = normalizeTrip(parseJson(data[KEYS.activeTrip], null), todayStamp());
      const state = normalizeTripState(data[KEYS.tripState]);

      setTrip(activeTrip || normalizeTrip(route?.params?.trip || route?.params?.job, todayStamp()));
      setTripState(state || TRIP_STATES.ASSIGNED);
    } catch (_error) {
      setTrip(normalizeTrip(route?.params?.trip || route?.params?.job, todayStamp()));
      setTripState(TRIP_STATES.ASSIGNED);
    } finally {
      setIsLoading(false);
    }
  }, [route?.params?.job, route?.params?.trip]);

  useFocusEffect(
    useCallback(() => {
      loadTrip();
    }, [loadTrip]),
  );

  const completeTrip = useCallback(async () => {
    if (!trip) {
      return;
    }

    const jobsRaw = await AsyncStorage.getItem(KEYS.jobsList);
    const jobs = parseJson(jobsRaw, []);
    const nextJobs = Array.isArray(jobs)
      ? jobs.map(item =>
          item?.id === trip.id
            ? { ...item, status: TRIP_STATES.COMPLETED, paymentStatus: 'UNPAID' }
            : item,
        )
      : [];

    const homeStateRaw = await AsyncStorage.getItem(KEYS.homeState);
    const homeState = parseJson(homeStateRaw, {});

    const summary = {
      id: trip.id,
      pickup: trip.pickup,
      drop: trip.drop,
      date: trip.date || todayStamp(),
      distance: trip.distance,
      eta: trip.eta,
      earnings: trip.earnings,
      completedAt: new Date().toISOString(),
    };

    await AsyncStorage.multiSet([
      [KEYS.jobsList, JSON.stringify(nextJobs)],
      [KEYS.activeTrip, ''],
      [KEYS.tripState, TRIP_STATES.COMPLETED],
      [
        KEYS.homeState,
        JSON.stringify({
          ...homeState,
          isOnDuty: true,
          dutyDate: todayStamp(),
        }),
      ],
      [KEYS.lastCompletedTrip, JSON.stringify(summary)],
    ]);

    setTripState(TRIP_STATES.COMPLETED);
    navigateToTripCompleted(summary);
  }, [navigateToTripCompleted, trip]);

  const markDelivered = useCallback(async () => {
    if (!trip) {
      return;
    }

    if (isOffline) {
      await queueOperationalAction('TRIP_STATE_TRANSITION', {
        tripId: trip.id,
        nextState: TRIP_STATES.COMPLETED,
        label: 'Mark Delivered',
      });
      Alert.alert(t('activeSimple.pendingSyncTitle'), t('activeSimple.pendingSyncMessage'));
      return;
    }

    await completeTrip();
  }, [completeTrip, isOffline, queueOperationalAction, t, trip]);

  const renderActionButton = () => {
    switch (tripState) {
      case TRIP_STATES.ASSIGNED:
      case TRIP_STATES.ACCEPTED:
        return (
          <AppButton
            title="Reach Pickup Location"
            onPress={() => persistTripState(TRIP_STATES.EN_ROUTE_PICKUP)}
            style={{ marginTop: spacing[1] }}
          />
        );
      case TRIP_STATES.EN_ROUTE_PICKUP:
        return (
          <AppButton
            title="Reached Pickup"
            onPress={() => persistTripState(TRIP_STATES.ARRIVED_PICKUP)}
            style={{ marginTop: spacing[1] }}
          />
        );
      case TRIP_STATES.ARRIVED_PICKUP:
        return (
          <AppButton
            title="Enter Pickup Code"
            onPress={() => setShowOtpModal(true)}
            style={{ marginTop: spacing[1] }}
          />
        );
      case TRIP_STATES.PICKUP_CONFIRMED:
        return (
          <AppButton
            title="Start Transit"
            onPress={() => persistTripState(TRIP_STATES.IN_TRANSIT)}
            style={{ marginTop: spacing[1] }}
          />
        );
      case TRIP_STATES.IN_TRANSIT:
        return (
          <>
            <AppButton
              title="Reached Destination"
              onPress={() => persistTripState(TRIP_STATES.ARRIVED_DELIVERY)}
              style={{ marginTop: spacing[1] }}
            />
            <AppButton
              title="Chat Support"
              variant="secondary"
              onPress={() => navigation.navigate('SupportCenter')}
              style={{ marginTop: spacing[1] }}
            />
          </>
        );
      case TRIP_STATES.ARRIVED_DELIVERY:
        return (
          <AppButton
            title="Enter Delivery Code"
            onPress={() => setShowOtpModal(true)}
            style={{ marginTop: spacing[1] }}
          />
        );
      case TRIP_STATES.DELIVERY_CONFIRMED:
        return (
          <AppButton
            title="Complete Trip"
            onPress={markDelivered}
            style={{ marginTop: spacing[1] }}
          />
        );
      case TRIP_STATES.COMPLETED:
        return (
          <AppButton
            title={t('activeTrip.backToDashboard')}
            onPress={navigateToHome}
            style={{ marginTop: spacing[1] }}
          />
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <AppScreen edges={['top', 'bottom']}>
        <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </AppScreen>
    );
  }

  if (!trip) {
    return (
      <AppScreen edges={['top', 'bottom']}>
        <AppHeader title={t('activeTrip.title')} subtitle={t('activeTrip.subtitle')} />
        <View style={{ paddingHorizontal: spacing[2] }}>
          <AppCard>
            <Text style={[typography.body, { color: colors.textPrimary }]}>{t('activeSimple.noTrip')}</Text>
            <AppButton
              title={t('activeSimple.returnHome')}
              onPress={navigateToHome}
              style={{ marginTop: spacing[2] }}
            />
          </AppCard>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen edges={['top', 'bottom']}>
      <AppHeader title={t('activeTrip.title')} subtitle={t('activeTrip.subtitle')} />

      <ScrollView contentContainerStyle={{ paddingBottom: spacing[6], paddingHorizontal: spacing[2] }}>
        <AppCard>
          <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>Trip Status</Text>
            <StatusBadge status={normalizeTripState(tripState)} />
          </View>
        </AppCard>

        <AppCard style={{ marginTop: spacing[1] }}>
          <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>{trip.id}</Text>
            <StatusBadge status={normalizeTripState(tripState)} />
          </View>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>
            {t('dashboard.pickup')}
          </Text>
          <Text style={[typography.label, { color: colors.textPrimary }]}>{trip.pickup}</Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>
            {t('dashboard.drop')}
          </Text>
          <Text style={[typography.label, { color: colors.textPrimary }]}>{trip.drop}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing[1] }}>
            <Text style={[typography.label, { color: colors.textPrimary }]}>
              {`Distance ${trip.distance}`}
            </Text>
            <Text style={[typography.label, { color: colors.textPrimary }]}>
              {`ETA: ${trip.eta || '5h 30m'}`}
            </Text>
          </View>
        </AppCard>

        <AppCard style={{ marginTop: spacing[1] }}>
          <Text style={[typography.h2, { color: colors.textPrimary, marginBottom: spacing[1] }]}>{t('activeTrip.tripProgress')}</Text>
          <StepIndicator
            steps={['Assigned', 'Pickup', 'Transit', 'Delivered']}
            currentStep={normalizeTripState(tripState)}
          />
        </AppCard>

        <AppCard style={{ marginTop: spacing[1] }}>
          <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>{t('activeTrip.hosMonitoring')}</Text>
            <StatusBadge status="Completed" tone="success" />
          </View>
          <Text style={[typography.label, { color: colors.textPrimary, marginTop: spacing[1] }]}>0h 00m</Text>
        </AppCard>

        <AppCard style={{ marginTop: spacing[1] }}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>{t('activeTrip.tripExpenses')}</Text>
          <Text style={[typography.label, { color: colors.textPrimary, marginTop: spacing[1] }]}>{t('activeTrip.fuel')}: INR 0</Text>
          <Text style={[typography.label, { color: colors.textPrimary, marginTop: spacing[1] }]}>{t('activeTrip.toll')}: INR 0</Text>
          <Text style={[typography.label, { color: colors.textPrimary, marginTop: spacing[1] }]}>{t('activeTrip.total')}: INR 0</Text>
          <AppButton
            title={t('activeTrip.addExpense')}
            variant="secondary"
            onPress={() => setShowExpenseModal(true)}
            style={{ marginTop: spacing[1] }}
          />
        </AppCard>

        {renderActionButton()}
      </ScrollView>      
      <OTPModal
        visible={showOtpModal}
        title={tripState === TRIP_STATES.ARRIVED_DELIVERY ? 'Enter Delivery Code' : 'Enter Pickup Code'}
        inputPlaceholder={tripState === TRIP_STATES.ARRIVED_DELIVERY ? 'Enter Delivery Code' : 'Enter Pickup Code'}
        onClose={() => setShowOtpModal(false)}
        onConfirm={async otp => {
          if (tripState === TRIP_STATES.ARRIVED_PICKUP) {
            if (String(otp) !== String(trip?.pickupCode || '123456')) {
              Alert.alert('Invalid Code', 'Please enter the correct pickup code.');
              return;
            }
            await persistTripState(TRIP_STATES.PICKUP_CONFIRMED);
            setShowOtpModal(false);
            return;
          }

          if (tripState === TRIP_STATES.ARRIVED_DELIVERY) {
            if (String(otp) !== String(trip?.deliveryCode || '654321')) {
              Alert.alert('Invalid Code', 'Please enter the correct delivery code.');
              return;
            }
            await persistTripState(TRIP_STATES.DELIVERY_CONFIRMED);
            setShowOtpModal(false);
          }
        }}
      />
      <ExpenseModal
        visible={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onSave={() => {
          setShowExpenseModal(false);
        }}
      />
    </AppScreen>
  );
}

export default ActiveTripScreen;
