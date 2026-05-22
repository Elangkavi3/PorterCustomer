import React, { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import AppBadge from '../components/ui/AppBadge';
import AppButton from '../components/ui/AppButton';
import AppCard from '../components/ui/AppCard';
import AppHeader from '../components/ui/AppHeader';
import AppScreen from '../components/ui/AppScreen';
import { useAppTheme } from '../theme/ThemeProvider';
import { useLanguage } from '../i18n/LanguageProvider';
import { summarizeRequiredDocuments } from '../services/documentVerification';
import {
  getVehicleStatusLabel,
  getVehicleStatusTone,
  isNotRoadworthy,
  isRoadReady,
  normalizeVehicleStatus,
} from '../services/vehicleStatus';
import {
  isTripActive,
  normalizeTrip,
  parseJson,
  TRIP_STATES,
  normalizeTripState,
} from '../utils/tripStatusManager';

const KEYS = {
  jobsList: 'jobsList',
  activeTrip: 'activeTrip',
  tripState: 'tripState',
  vehicleInspectionDate: 'vehicleInspectionDate',
  driverDocuments: 'driverDocuments',
  profile: 'driverProfile',
  homeState: 'homeState',
  vehicleSafetyStatus: 'vehicleSafetyStatus',
};

function todayStamp() {
  const now = new Date();
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, '0');
  const d = `${now.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatCurrency(amount) {
  const value = Number.isFinite(amount) ? amount : 0;
  return `INR ${value.toLocaleString('en-IN')}`;
}

function getDetailStatusLabel(state) {
  const normalized = normalizeTripState(state);
  if (normalized === TRIP_STATES.ASSIGNED || normalized === TRIP_STATES.ACCEPTED) {
    return 'IDLE';
  }
  return normalized || TRIP_STATES.IDLE;
}

function JobDetailScreen({ navigation, route }) {
  const { colors, spacing, typography } = useAppTheme();
  const { t } = useLanguage();

  const [isLoading, setIsLoading] = useState(true);
  const [job, setJob] = useState(route?.params?.job ? normalizeTrip(route.params.job, todayStamp()) : null);
  const [tripState, setTripState] = useState(TRIP_STATES.IDLE);
  const [vehicleNumber, setVehicleNumber] = useState('TN-01-AB-1048');
  const [vehicleType, setVehicleType] = useState('16ft Truck');
  const [vehicleStatus, setVehicleStatus] = useState('ROAD_READY');
  const [isInspectionDone, setIsInspectionDone] = useState(false);
  const [showDocumentWarning, setShowDocumentWarning] = useState(false);
  const [hasOtherActiveTrip, setHasOtherActiveTrip] = useState(false);

  const routeJobId = route?.params?.jobId;

  const loadDetails = useCallback(async () => {
    setIsLoading(true);

    try {
      const rows = await AsyncStorage.multiGet([
        KEYS.jobsList,
        KEYS.activeTrip,
        KEYS.tripState,
        KEYS.profile,
        KEYS.vehicleInspectionDate,
        KEYS.vehicleSafetyStatus,
      ]);

      const data = Object.fromEntries(rows);
      const listRaw = parseJson(data[KEYS.jobsList], []);
      const list = Array.isArray(listRaw)
        ? listRaw.map(item => normalizeTrip(item, todayStamp())).filter(Boolean)
        : [];

      const selected = list.find(item => item.id === routeJobId)
        || (route?.params?.job ? normalizeTrip(route.params.job, todayStamp()) : null)
        || list.find(item => normalizeTripState(item.status) !== TRIP_STATES.COMPLETED)
        || null;

      const profile = parseJson(data[KEYS.profile], {});
      const selectedState = normalizeTripState(selected?.status || data[KEYS.tripState]);
      const activeTrip = normalizeTrip(parseJson(data[KEYS.activeTrip], null), todayStamp());
      const stateFromStorage = normalizeTripState(data[KEYS.tripState]);
      const hasActive = Boolean(activeTrip) && isTripActive(stateFromStorage);
      const activeOther = hasActive && activeTrip?.id !== selected?.id;

      setJob(selected);
      setTripState(selectedState);
      setHasOtherActiveTrip(activeOther);
      setVehicleNumber(String(profile?.vehicleNumber || 'TN-01-AB-1048'));
      setVehicleType(String(profile?.vehicleType || '16ft Truck'));
      setVehicleStatus(normalizeVehicleStatus(data[KEYS.vehicleSafetyStatus] || 'ROAD_READY'));
      setIsInspectionDone(data[KEYS.vehicleInspectionDate] === todayStamp());
      setShowDocumentWarning(false);
    } catch (_error) {
      setJob(null);
      setTripState(TRIP_STATES.IDLE);
      setVehicleNumber('TN-01-AB-1048');
      setVehicleType('16ft Truck');
      setVehicleStatus('ROAD_READY');
      setIsInspectionDone(false);
      setShowDocumentWarning(false);
      setHasOtherActiveTrip(false);
    } finally {
      setIsLoading(false);
    }
  }, [route?.params?.job, routeJobId]);

  useFocusEffect(
    useCallback(() => {
      loadDetails();
    }, [loadDetails]),
  );

  const openInspection = useCallback(() => {
    navigation.navigate('VehicleInspection', { vehicleNumber });
  }, [navigation, vehicleNumber]);

  const startTrip = useCallback(async () => {
    if (!job) {
      return;
    }

    if (hasOtherActiveTrip) {
      Alert.alert('Trip In Progress', 'Complete your current trip before starting another one.');
      return;
    }

    if (isNotRoadworthy(vehicleStatus)) {
      return;
    }

    if (!isInspectionDone || !isRoadReady(vehicleStatus)) {
      openInspection();
      return;
    }

    const docsRaw = await AsyncStorage.getItem(KEYS.driverDocuments);
    const docSummary = summarizeRequiredDocuments(parseJson(docsRaw, []));
    if (docSummary.hasBlocking) {
      setShowDocumentWarning(true);
      return;
    }

    const jobsRaw = await AsyncStorage.getItem(KEYS.jobsList);
    const listRaw = parseJson(jobsRaw, []);
    const nextJobs = Array.isArray(listRaw)
      ? listRaw.map(item =>
          item?.id === job.id
            ? { ...item, status: TRIP_STATES.ASSIGNED }
            : item,
        )
      : [];

    const homeStateRaw = await AsyncStorage.getItem(KEYS.homeState);
    const homeState = parseJson(homeStateRaw, {});

    const activeTrip = { ...job, status: TRIP_STATES.ASSIGNED, vehicleNumber, vehicleType };

    await AsyncStorage.multiSet([
      [KEYS.activeTrip, JSON.stringify(activeTrip)],
      [KEYS.tripState, TRIP_STATES.ASSIGNED],
      [KEYS.jobsList, JSON.stringify(nextJobs)],
      [
        KEYS.homeState,
        JSON.stringify({
          ...homeState,
          isOnDuty: true,
          dutyDate: todayStamp(),
        }),
      ],
    ]);

    navigation.navigate('ActiveTrip', { trip: activeTrip });
  }, [hasOtherActiveTrip, isInspectionDone, job, navigation, openInspection, vehicleNumber, vehicleStatus, vehicleType]);

  if (isLoading) {
    return (
      <AppScreen edges={['top', 'bottom']}>
        <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </AppScreen>
    );
  }

  if (!job) {
    return (
      <AppScreen edges={['top', 'bottom']}>
        <AppHeader title={t('trip.detailsTitle')} subtitle={t('trip.detailsSubtitle')} />
        <View style={{ paddingHorizontal: spacing[2] }}>
          <AppCard>
            <Text style={[typography.body, { color: colors.textPrimary }]}>{t('trip.noJobs')}</Text>
            <AppButton
              title={t('homeSimple.viewTrips')}
              variant="secondary"
              onPress={() => navigation.goBack()}
              style={{ marginTop: spacing[2] }}
            />
          </AppCard>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen edges={['top', 'bottom']}>
      <AppHeader title={t('trip.detailsTitle')} subtitle="Operational briefing" />
      <ScrollView contentContainerStyle={{ paddingBottom: spacing[8], paddingHorizontal: spacing[2] }}>
        <AppCard>
          <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>{job.id}</Text>
            <AppBadge label={getDetailStatusLabel(tripState)} />
          </View>

          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>
            {t('trip.assignedVehicle')}
          </Text>
          <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing[0] }}>
            <Text style={[typography.label, { color: colors.textPrimary }]}>{vehicleNumber}</Text>
            <AppBadge label={getVehicleStatusLabel(vehicleStatus)} tone={getVehicleStatusTone(vehicleStatus)} />
          </View>

          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>
            {t('dashboard.pickup')}
          </Text>
          <Text style={[typography.label, { color: colors.textPrimary }]}>{job.pickup}</Text>

          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>
            {t('dashboard.drop')}
          </Text>
          <Text style={[typography.label, { color: colors.textPrimary }]}>{job.drop}</Text>

          <View style={{ flexDirection: 'row', marginTop: spacing[1] }}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>{t('trip.distance')}</Text>
              <Text style={[typography.label, { color: colors.textPrimary }]}>{job.distance}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>{t('trip.eta')}</Text>
              <Text style={[typography.label, { color: colors.textPrimary }]}>{job.eta || '5h 30m'}</Text>
            </View>
          </View>

          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>
            {t('trip.payout')}
          </Text>
          <Text style={[typography.label, { color: colors.textPrimary }]}>
            {formatCurrency(job.earnings)}
          </Text>

          <AppButton
            title="Start Trip"
            onPress={startTrip}
            disabled={isNotRoadworthy(vehicleStatus) || hasOtherActiveTrip}
            style={{ marginTop: spacing[2] }}
          />

          {hasOtherActiveTrip ? (
            <Text style={[typography.caption, { color: colors.warning, marginTop: spacing[1] }]}>
              Finish the current trip before starting another one.
            </Text>
          ) : null}

          {!isInspectionDone || !isRoadReady(vehicleStatus) ? (
            <Text style={[typography.caption, { color: colors.warning, marginTop: spacing[1] }]}>
              {t('trip.completeInspectionWarning')}
            </Text>
          ) : null}
        </AppCard>

        {isNotRoadworthy(vehicleStatus) ? (
          <AppCard style={{ marginTop: spacing[1] }}>
            <Text style={[typography.label, { color: colors.critical }]}> 
              {t('dashboard.vehicleUnsafe')}
            </Text>
          </AppCard>
        ) : null}

        {showDocumentWarning ? (
          <AppCard style={{ marginTop: spacing[1] }}>
            <Text style={[typography.label, { color: colors.warning }]}> 
              {t('trip.requiredDocumentsWarning')}
            </Text>
            <AppButton
              title={t('common.uploadDocuments')}
              onPress={() => navigation.getParent()?.navigate('Home', { screen: 'DocumentsScreen' })}
              style={{ marginTop: spacing[1] }}
            />
          </AppCard>
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}

export default JobDetailScreen;
