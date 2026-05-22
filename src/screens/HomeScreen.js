import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Image, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import AppButton from '../components/ui/AppButton';
import AppBadge from '../components/ui/AppBadge';
import AppCard from '../components/ui/AppCard';
import AppHeader from '../components/ui/AppHeader';
import AppScreen from '../components/ui/AppScreen';
import EmptyState from '../components/EmptyState';
import { useAppTheme } from '../theme/ThemeProvider';
import { useLanguage } from '../i18n/LanguageProvider';
import { useOperations } from '../runtime/OperationsProvider';
import { mockTrips } from '../api/mockData';
import {
  parseJson,
  resolveCurrentTrip,
  TRIP_STATES,
  normalizeTripState,
  isTripActive,
  isUpcomingTripState,
  normalizeTrip,
} from '../utils/tripStatusManager';
import {
  canToggleAvailability,
  deriveDriverAvailability,
  DRIVER_AVAILABILITY,
} from '../utils/driverAvailabilityManager';
import { summarizeRequiredDocuments } from '../services/documentVerification';
import {
  getVehicleStatusLabel,
  getVehicleStatusTone,
  normalizeVehicleStatus,
  VEHICLE_STATUS,
} from '../services/vehicleStatus';

const KEYS = {
  profile: 'driverProfile',
  homeState: 'homeState',
  activeTrip: 'activeTrip',
  tripState: 'tripState',
  jobsList: 'jobsList',
  driverDocuments: 'driverDocuments',
  vehicleInspectionDate: 'vehicleInspectionDate',
  vehicleSafetyStatus: 'vehicleSafetyStatus',
  vehicleFuelLevel: 'vehicleFuelLevel',
  vehicleLastInspectionTime: 'vehicleLastInspectionTime',
  lastCompletedTrip: 'lastCompletedTrip',
};

const DEFAULT_PROFILE = {
  name: 'Ravi Kumar',
  mobile: '9876543210',
  license: 'TN-22-2020-184739',
  avatarUrl: '',
  vehicleType: '16ft Truck',
  vehicleNumber: 'TN-01-AB-1048',
};
const APP_VERSION = '1.0.0';

function todayStamp() {
  const now = new Date();
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, '0');
  const d = `${now.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateTime(value, fallbackLabel) {
  if (!value) {
    return fallbackLabel;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallbackLabel;
  }

  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const year = date.getFullYear();
  const hh = `${date.getHours()}`.padStart(2, '0');
  const mm = `${date.getMinutes()}`.padStart(2, '0');
  return `${day}/${month}/${year} ${hh}:${mm}`;
}

function getTripBadgeLabel(state) {
  const normalized = normalizeTripState(state);
  if (normalized === TRIP_STATES.COMPLETED) {
    return 'COMPLETED';
  }
  if (normalized === TRIP_STATES.CANCELLED) {
    return 'CRITICAL';
  }
  if (normalized === TRIP_STATES.IDLE) {
    return 'IDLE';
  }
  return 'ASSIGNED';
}

function HomeScreen({ navigation }) {
  const { colors, spacing, typography } = useAppTheme();
  const { t } = useLanguage();
  const { handleNotification, handleUnauthorized } = useOperations();

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [availability, setAvailability] = useState(DRIVER_AVAILABILITY.OFFLINE);
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [upcomingTrips, setUpcomingTrips] = useState([]);
  const [tripState, setTripState] = useState(TRIP_STATES.IDLE);
  const [isInspectionDone, setIsInspectionDone] = useState(false);
  const [vehicleStatus, setVehicleStatus] = useState(VEHICLE_STATUS.ROAD_READY);
  const [vehicleInfo, setVehicleInfo] = useState({
    vehicleNumber: 'TN-01-AB-1048',
    vehicleType: '16ft Truck',
    fuelLevel: '68%',
    lastInspectionTime: '',
  });
  const [documentSummary, setDocumentSummary] = useState(
    summarizeRequiredDocuments([]),
  );
  const [showProfileActionsModal, setShowProfileActionsModal] = useState(false);
  const [showDeveloperOptions, setShowDeveloperOptions] = useState(false);
  const [, setUnlockTapCount] = useState(0);
  const dutyToggleAnim = useRef(new Animated.Value(0)).current;

  const loadHome = useCallback(async () => {
    setIsLoading(true);

    try {
      const rows = await AsyncStorage.multiGet([
        KEYS.profile,
        KEYS.homeState,
        KEYS.activeTrip,
        KEYS.tripState,
        KEYS.jobsList,
        KEYS.driverDocuments,
        KEYS.vehicleInspectionDate,
        KEYS.vehicleSafetyStatus,
        KEYS.vehicleFuelLevel,
        KEYS.vehicleLastInspectionTime,
      ]);

      const data = Object.fromEntries(rows);
      const profileData = parseJson(data[KEYS.profile], {});
      const homeState = parseJson(data[KEYS.homeState], {});

      const resolved = resolveCurrentTrip({
        activeTripRaw: data[KEYS.activeTrip],
        jobsRaw: data[KEYS.jobsList],
        tripStateRaw: data[KEYS.tripState],
        fallbackDate: todayStamp(),
      });
      const jobsRaw = parseJson(data[KEYS.jobsList], []);
      const jobs = Array.isArray(jobsRaw)
        ? jobsRaw.map(item => normalizeTrip(item, todayStamp())).filter(Boolean)
        : [];
      const currentId = resolved.trip?.id;
      const currentIsActive = Boolean(resolved.trip) && isTripActive(resolved.tripState);
      const nextUpcoming = jobs
        .filter(item => isUpcomingTripState(item.status))
        .filter(item => (currentIsActive ? item.id !== currentId : true))
        .slice(0, 2);

      const docs = parseJson(data[KEYS.driverDocuments], []);
      const summary = summarizeRequiredDocuments(Array.isArray(docs) ? docs : []);
      const normalizedVehicleStatus = normalizeVehicleStatus(
        data[KEYS.vehicleSafetyStatus] || VEHICLE_STATUS.ROAD_READY,
      );
      const inspectionDone = data[KEYS.vehicleInspectionDate] === todayStamp();
      const lastInspectionRaw =
        data[KEYS.vehicleLastInspectionTime] || data[KEYS.vehicleInspectionDate] || '';
      const hasActiveTrip = Boolean(resolved.trip) && isTripActive(resolved.tripState);
      const dutyState = Boolean(homeState?.isOnDuty);
      const mergedProfile = {
        ...DEFAULT_PROFILE,
        ...profileData,
      };

      setProfile(mergedProfile);
      setCurrentTrip(resolved.trip);
      setUpcomingTrips(nextUpcoming);
      setTripState(normalizeTripState(resolved.tripState));
      setIsOnDuty(dutyState);
      setAvailability(
        deriveDriverAvailability({ isOnDuty: dutyState, hasTrip: hasActiveTrip }),
      );
      setDocumentSummary(summary);
      setIsInspectionDone(inspectionDone);
      setVehicleStatus(normalizedVehicleStatus);
      setVehicleInfo({
        vehicleNumber: String(mergedProfile?.vehicleNumber || ''),
        vehicleType: String(mergedProfile?.vehicleType || ''),
        fuelLevel: String(data[KEYS.vehicleFuelLevel] || '68%'),
        lastInspectionTime: formatDateTime(lastInspectionRaw, t('vehicle.notAvailable')),
      });
    } catch (_error) {
      setProfile(DEFAULT_PROFILE);
      setCurrentTrip(null);
      setUpcomingTrips([]);
      setTripState(TRIP_STATES.IDLE);
      setIsOnDuty(false);
      setAvailability(DRIVER_AVAILABILITY.OFFLINE);
      setDocumentSummary(summarizeRequiredDocuments([]));
      setIsInspectionDone(false);
      setVehicleStatus(VEHICLE_STATUS.ROAD_READY);
      setVehicleInfo({
        vehicleNumber: 'TN-01-AB-1048',
        vehicleType: '16ft Truck',
        fuelLevel: '68%',
        lastInspectionTime: t('vehicle.notAvailable'),
      });
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      loadHome();
    }, [loadHome]),
  );

  const updateDutyStatus = useCallback(async nextDuty => {
    if (isOnDuty === nextDuty) {
      return;
    }

    if (!canToggleAvailability(availability)) {
      if (!nextDuty && availability === DRIVER_AVAILABILITY.ON_TRIP) {
        Alert.alert(
          'Action blocked',
          'Complete the trip first or raise a ticket to cancel the trip.',
          [
            { text: 'Close', style: 'cancel' },
            {
              text: 'Raise Ticket',
              onPress: () => navigation.navigate('RaiseTicket'),
            },
          ],
        );
      }
      return;
    }

    setIsOnDuty(nextDuty);
    setAvailability(deriveDriverAvailability({ isOnDuty: nextDuty, hasTrip: false }));

    const homeStateRaw = await AsyncStorage.getItem(KEYS.homeState);
    const homeState = parseJson(homeStateRaw, {});
    await AsyncStorage.setItem(
      KEYS.homeState,
      JSON.stringify({
        ...homeState,
        isOnDuty: nextDuty,
        dutyDate: todayStamp(),
      }),
    );
  }, [availability, isOnDuty, navigation]);

  const openTrip = useCallback(() => {
    if (!currentTrip) {
      return;
    }

    const normalized = normalizeTripState(tripState);
    if (normalized === TRIP_STATES.ASSIGNED || normalized === TRIP_STATES.ACCEPTED || normalized === TRIP_STATES.IDLE) {
      navigation.navigate('JobDetail', { job: currentTrip, jobId: currentTrip.id });
      return;
    }

    if (isTripActive(normalized)) {
      navigation.navigate('ActiveTrip', { trip: currentTrip });
      return;
    }

    navigation.navigate('JobDetail', { job: currentTrip, jobId: currentTrip.id });
  }, [currentTrip, navigation, tripState]);

  const openDocumentUpload = useCallback(() => {
    navigation.navigate('DocumentsScreen');
  }, [navigation]);

  const onDevVersionTap = useCallback(() => {
    if (showDeveloperOptions) {
      return;
    }

    setUnlockTapCount(prev => {
      const next = prev + 1;
      if (next >= 3) {
        setShowDeveloperOptions(true);
        Alert.alert(t('profile.developerOptions'), t('profile.developerUnlocked'));
        return 0;
      }
      return next;
    });
  }, [showDeveloperOptions, t]);

  const triggerComplianceWarning = useCallback(async () => {
    await handleNotification({
      type: 'COMPLIANCE_WARNING',
      payload: {
        subtitle: t('notifications.complianceWarning'),
        message: t('notifications.complianceWarning'),
      },
    });
    Alert.alert(t('profile.developerOptions'), t('profile.devActionCompleted'));
  }, [handleNotification, t]);

  const triggerDocumentExpiring = useCallback(async () => {
    await handleNotification({
      type: 'DOCUMENT_EXPIRING',
      payload: {
        subtitle: t('notifications.documentExpiring'),
        message: t('notifications.documentExpiring'),
      },
    });
    Alert.alert(t('profile.developerOptions'), t('profile.devActionCompleted'));
  }, [handleNotification, t]);

  const triggerAccessRevoked = useCallback(async () => {
    await handleUnauthorized();
  }, [handleUnauthorized]);

  const triggerJobAssign = useCallback(async () => {
    const pendingTrips = mockTrips.filter(trip => trip.status === 'Pending Assignment');
    if (pendingTrips.length === 0) {
      Alert.alert('No Pending Jobs', 'There are no jobs pending assignment in the mock data.');
      return;
    }

    const jobData = pendingTrips[Math.floor(Math.random() * pendingTrips.length)];
    await handleNotification({
      type: 'TRIP_ASSIGNED',
      payload: {
        title: 'New Job Assigned',
        subtitle: `Trip ID: ${jobData.tripId}`,
        message: `You have been assigned a new trip from ${jobData.route}. Please check the details.`,
        data: jobData,
      },
    });
    Alert.alert(t('profile.developerOptions'), t('profile.devActionCompleted'));
  }, [handleNotification, t]);

  const seedMockTripData = useCallback(async () => {
    const today = todayStamp();
    const nowIso = new Date().toISOString();

    const activeTrip = {
      id: 'PD-48271',
      pickup: 'Chennai Warehouse',
      drop: 'Bangalore Depot',
      status: 'EN_ROUTE_PICKUP',
      date: today,
      distance: '340 km',
      eta: '5h 30m',
      earnings: 3200,
      customerName: 'Operations Desk',
      customerPhone: '9876543210',
      vehicleNumber: 'TN-01-AB-1048',
      vehicleType: '16ft Truck',
      paymentStatus: 'UNPAID',
    };

    const jobs = [
      activeTrip,
      {
        id: 'PD-48270',
        pickup: 'Hyderabad Hub',
        drop: 'Pune Distribution Yard',
        status: 'COMPLETED',
        date: '2024-02-13',
        distance: '265 km',
        eta: '4h 45m',
        earnings: 2800,
        vehicleNumber: 'TN-01-AB-1048',
        vehicleType: '16ft Truck',
        paymentStatus: 'PAID',
      },
      {
        id: 'PD-48269',
        pickup: 'Chennai Warehouse',
        drop: 'Bangalore Depot',
        status: 'COMPLETED',
        date: '2024-02-14',
        distance: '340 km',
        eta: '5h 30m',
        earnings: 3200,
        vehicleNumber: 'TN-01-AB-1048',
        vehicleType: '16ft Truck',
        paymentStatus: 'UNPAID',
      },
      {
        id: 'PD-48268',
        pickup: 'Coimbatore Yard',
        drop: 'Mysore Hub',
        status: 'ASSIGNED',
        date: today,
        distance: '230 km',
        eta: '4h 10m',
        earnings: 2500,
        vehicleNumber: 'TN-01-AB-1048',
        vehicleType: '16ft Truck',
        paymentStatus: 'UNPAID',
      },
    ];

    const docs = [
      { key: 'driving_license', uploaded: true, expiryDate: '2027-12-31' },
      { key: 'medical_certificate', uploaded: true, expiryDate: '2027-09-30' },
      { key: 'vehicle_rc', uploaded: true, expiryDate: '2028-01-31' },
    ];

    const summary = {
      id: 'PD-48269',
      pickup: 'Chennai Warehouse',
      drop: 'Bangalore Depot',
      date: '2024-02-14',
      distance: '340 km',
      eta: '5h 30m',
      earnings: 3200,
      completedAt: nowIso,
      paymentStatus: 'UNPAID',
    };

    await AsyncStorage.multiSet([
      [KEYS.profile, JSON.stringify(DEFAULT_PROFILE)],
      [KEYS.homeState, JSON.stringify({ isOnDuty: true, dutyDate: today })],
      [KEYS.jobsList, JSON.stringify(jobs)],
      [KEYS.activeTrip, JSON.stringify(activeTrip)],
      [KEYS.tripState, 'EN_ROUTE_PICKUP'],
      [KEYS.lastCompletedTrip, JSON.stringify(summary)],
      [KEYS.driverDocuments, JSON.stringify(docs)],
      [KEYS.vehicleSafetyStatus, 'ROAD_READY'],
      [KEYS.vehicleInspectionDate, today],
      [KEYS.vehicleLastInspectionTime, nowIso],
    ]);

    await loadHome();
    Alert.alert('Developer Mode', 'Mock trip data loaded.');
  }, [loadHome]);

  const handlePrimaryTripAction = useCallback(() => {
    if (!currentTrip) {
      return;
    }

    if (vehicleStatus === VEHICLE_STATUS.NOT_ROADWORTHY) {
      return;
    }

    if (!isInspectionDone || vehicleStatus !== VEHICLE_STATUS.ROAD_READY) {
      navigation.navigate('VehicleInspection', { vehicleNumber: vehicleInfo.vehicleNumber });
      return;
    }

    if (documentSummary.hasBlocking) {
      openDocumentUpload();
      return;
    }

    openTrip();
  }, [
    currentTrip,
    documentSummary.hasBlocking,
    isInspectionDone,
    navigation,
    openDocumentUpload,
    openTrip,
    vehicleInfo.vehicleNumber,
    vehicleStatus,
  ]);

  const tripButtonDisabled = !currentTrip || vehicleStatus === VEHICLE_STATUS.NOT_ROADWORTHY;
  const tripButtonLabel = !isInspectionDone || vehicleStatus !== VEHICLE_STATUS.ROAD_READY
    ? t('dashboard.inspectionRequiredButton')
    : t('dashboard.startTrip');
  useEffect(() => {
    Animated.spring(dutyToggleAnim, {
      toValue: isOnDuty ? 1 : 0,
      friction: 9,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [dutyToggleAnim, isOnDuty]);

  if (isLoading) {
    return (
      <AppScreen edges={['top', 'bottom']}>
        <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </AppScreen>
    );
  }

  const hasCurrentTrip = Boolean(currentTrip) && isTripActive(tripState);
  const isProfileComplete = Boolean(
    String(profile.name || '').trim()
      && String(profile.mobile || '').trim()
      && String(profile.license || '').trim(),
  );
  const showDocumentsSection = documentSummary.hasMissing || documentSummary.hasExpired || documentSummary.hasExpiring;
  const initials = String(profile.name || 'Driver')
    .split(' ')
    .map(part => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();
  const hasVehicleAssigned = Boolean(vehicleInfo.vehicleNumber);
  const dutyToggleDisabled = !canToggleAvailability(availability);
  const dutyToggleWidth = 170;
  const dutyTogglePadding = 2;
  const dutySegmentWidth = (dutyToggleWidth - (dutyTogglePadding * 2)) / 2;
  const profileName = profile.name || 'Driver';
  const headerAvatarSize = spacing[6];

  return (
    <AppScreen edges={['top', 'bottom']}>
      <AppHeader
        title="Welcome"
        subtitle={profileName}
        titleTextStyle={{ color: colors.textSecondary, fontSize: 14, fontWeight: '600', lineHeight: 18 }}
        subtitleTextStyle={{ color: colors.textPrimary, fontSize: 22, fontWeight: '500', lineHeight: 26 }}
        leftSlot={(
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setShowProfileActionsModal(true)}
          >
            {profile.avatarUrl ? (
              <Image
                source={{ uri: profile.avatarUrl }}
                style={{ width: headerAvatarSize, height: headerAvatarSize, borderRadius: headerAvatarSize / 2 }}
              />
            ) : (
              <View
                style={{
                  width: headerAvatarSize,
                  height: headerAvatarSize,
                  borderRadius: headerAvatarSize / 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceAlt,
                }}
              >
                <Text style={[typography.label, { color: colors.textPrimary }]}>{initials || 'DR'}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: spacing[8], paddingHorizontal: spacing[2] }}>
        <AppCard>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setShowProfileActionsModal(true)}
          >
            <View style={{ flex: 1 }}>
              <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: spacing[1] }}>
                <Text style={[typography.h2, { color: colors.textPrimary, flex: 1 }]}>{profileName}</Text>
                <View
                  style={{
                    flexDirection: 'row',
                    backgroundColor: colors.surfaceAlt,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: dutyTogglePadding,
                    opacity: dutyToggleDisabled ? 0.55 : 1,
                    width: dutyToggleWidth,
                    position: 'relative',
                  }}
                >
                  <Animated.View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      top: dutyTogglePadding,
                      left: dutyTogglePadding,
                      width: dutySegmentWidth,
                      height: 32,
                      borderRadius: 999,
                      backgroundColor: colors.primary,
                      transform: [
                        {
                          translateX: dutyToggleAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [dutySegmentWidth, 0],
                          }),
                        },
                      ],
                    }}
                  />
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => updateDutyStatus(true)}
                    style={{
                      width: dutySegmentWidth,
                      minHeight: 32,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={[
                        typography.caption,
                        {
                          color: isOnDuty ? colors.textOnColor : colors.textSecondary,
                          fontWeight: '700',
                        },
                      ]}
                    >
                      On Duty
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => updateDutyStatus(false)}
                    style={{
                      width: dutySegmentWidth,
                      minHeight: 32,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={[
                        typography.caption,
                        {
                          color: !isOnDuty ? colors.textOnColor : colors.textSecondary,
                          fontWeight: '700',
                        },
                      ]}
                    >
                      Off Duty
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[0] }]}>
                {profile.mobile || 'Mobile not set'}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[0] }]}>
                {`License: ${profile.license || 'Not set'}`}
              </Text>
            </View>
          </TouchableOpacity>

          {!isProfileComplete ? (
            <Text style={[typography.caption, { color: colors.warning, marginTop: spacing[1] }]}>
              Complete your profile
            </Text>
          ) : null}
          {documentSummary.hasExpired ? (
            <Text style={[typography.caption, { color: colors.critical, marginTop: spacing[1] }]}>
              Expired documents found. Update them now.
            </Text>
          ) : null}

          <View style={{ marginTop: spacing[1], flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>Profile Check</Text>
            <AppBadge label={isProfileComplete ? 'VERIFIED' : 'NOT_UPLOADED'} tone={isProfileComplete ? 'success' : 'warning'} />
          </View>

          {!showDocumentsSection ? (
            <View style={{ marginTop: spacing[1], flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>Document Check</Text>
              <AppBadge label="VERIFIED" tone="success" />
            </View>
          ) : null}

        </AppCard>

        {showDocumentsSection ? (
          <AppCard style={{ marginTop: spacing[1] }}>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>Documents</Text>
            {documentSummary.documents.map(item => (
              <TouchableOpacity
                key={item.key}
                activeOpacity={0.9}
                onPress={() =>
                  navigation.navigate('DocumentUploadScreen', {
                    documentName: item.name,
                    documentKey: item.key,
                    expiryDate: item.expiryDate,
                  })
                }
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: spacing[1],
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  paddingTop: spacing[1],
                }}
              >
                <View style={{ flex: 1, paddingRight: spacing[1] }}>
                  <Text style={[typography.label, { color: colors.textPrimary }]}>
                    {item.name}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[0] }]}>
                    {item.status === 'NOT_UPLOADED' ? 'Upload Now' : 'Update Document'}
                  </Text>
                </View>
                <AppBadge label={item.badgeLabel} tone={item.badgeTone} />
              </TouchableOpacity>
            ))}
          </AppCard>
        ) : null}

        <AppCard style={{ marginTop: spacing[1] }}>
          <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>Vehicle Details</Text>
            <AppBadge
              label={getVehicleStatusLabel(vehicleStatus)}
              tone={getVehicleStatusTone(vehicleStatus)}
            />
          </View>
          {hasVehicleAssigned ? (
            <>
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>
                Assigned Vehicle
              </Text>
              <Text style={[typography.label, { color: colors.textPrimary }]}>{vehicleInfo.vehicleNumber}</Text>
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>
                Type
              </Text>
              <Text style={[typography.label, { color: colors.textPrimary }]}>{vehicleInfo.vehicleType || 'Not set'}</Text>
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>
                Pickup Location
              </Text>
              <Text style={[typography.label, { color: colors.textPrimary }]}>
                {currentTrip?.pickup || 'No active trip pickup'}
              </Text>
            </>
          ) : (
            <View style={{ marginTop: spacing[1] }}>
              <EmptyState
                title="Vehicle Details"
                message="No vehicle assigned yet."
              />
            </View>
          )}
        </AppCard>

        {hasCurrentTrip ? (
          <AppCard style={{ marginTop: spacing[1] }}>
            <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[typography.h2, { color: colors.textPrimary }]}>
                Current Trip
              </Text>
              <AppBadge label={getTripBadgeLabel(tripState)} />
            </View>

            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>
              {t('dashboard.tripId')}
            </Text>
            <Text style={[typography.label, { color: colors.textPrimary, marginTop: spacing[0] }]}>
              {currentTrip.id}
            </Text>

            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>
              {t('dashboard.pickup')}
            </Text>
            <Text style={[typography.label, { color: colors.textPrimary, marginTop: spacing[0] }]}>
              {currentTrip.pickup}
            </Text>

            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>
              {t('dashboard.drop')}
            </Text>
            <Text style={[typography.label, { color: colors.textPrimary, marginTop: spacing[0] }]}>
              {currentTrip.drop}
            </Text>

            <AppButton
              title={tripButtonLabel}
              onPress={handlePrimaryTripAction}
              disabled={tripButtonDisabled}
              style={{ marginTop: spacing[2] }}
            />

            {vehicleStatus === VEHICLE_STATUS.NOT_ROADWORTHY ? (
              <Text style={[typography.caption, { color: colors.critical, marginTop: spacing[1] }]}>
                {t('dashboard.vehicleUnsafe')}
              </Text>
            ) : null}
          </AppCard>
        ) : (
          <AppCard style={{ marginTop: spacing[1] }}>
            <EmptyState
              title="Current Trip"
              message="No active trip right now."
            />
          </AppCard>
        )}

        <AppCard style={{ marginTop: spacing[1] }}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>Upcoming Trips</Text>
          {upcomingTrips.length === 0 ? (
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>
              No upcoming trips.
            </Text>
          ) : (
            upcomingTrips.map(item => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('JobDetail', { job: item, jobId: item.id })}
                style={{ borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing[1], paddingTop: spacing[1] }}
              >
                <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={[typography.label, { color: colors.textPrimary }]}>{item.id}</Text>
                  <AppBadge label={getTripBadgeLabel(item.status)} />
                </View>
                <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[0] }]}>
                  {`${item.pickup} → ${item.drop}`}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </AppCard>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onDevVersionTap}
          style={{ marginTop: spacing[1] }}
        >
          <AppCard>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {`App Version ${APP_VERSION}`}
            </Text>
            {!showDeveloperOptions ? (
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[0] }]}>
                Tap 3 times to unlock Developer Mode
              </Text>
            ) : (
              <Text style={[typography.caption, { color: colors.success, marginTop: spacing[0] }]}>
                {t('profile.developerUnlocked')}
              </Text>
            )}
          </AppCard>
        </TouchableOpacity>

        {showDeveloperOptions ? (
          <AppCard style={{ marginTop: spacing[1] }}>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>{t('profile.developerOptions')}</Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>
              {t('profile.developerSubtitle')}
            </Text>

            <AppButton
              title={t('profile.triggerComplianceWarning')}
              variant="secondary"
              onPress={triggerComplianceWarning}
              style={{ marginTop: spacing[1] }}
            />
            <AppButton
              title={t('profile.triggerDocumentExpiring')}
              variant="secondary"
              onPress={triggerDocumentExpiring}
              style={{ marginTop: spacing[1] }}
            />
            <AppButton
              title={t('profile.triggerAccessRevoked')}
              onPress={triggerAccessRevoked}
              style={{ marginTop: spacing[1] }}
            />
            <AppButton
              title="Trigger Job Assign"
              onPress={triggerJobAssign}
              style={{ marginTop: spacing[1] }}
            />
            <AppButton
              title="Load Mock Trip Data"
              onPress={seedMockTripData}
              style={{ marginTop: spacing[1] }}
            />
          </AppCard>
        ) : null}
      </ScrollView>

      <Modal
        transparent
        visible={showProfileActionsModal}
        animationType="fade"
        onRequestClose={() => setShowProfileActionsModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', paddingHorizontal: spacing[2] }}>
          <AppCard>
            <Text style={[typography.h2, { color: colors.textPrimary, textAlign: 'center' }]}>
              {profile.name || 'Driver'}
            </Text>

            <View style={{ alignItems: 'center', marginTop: spacing[1] }}>
              {profile.avatarUrl ? (
                <Image
                  source={{ uri: profile.avatarUrl }}
                  style={{ width: spacing[8], height: spacing[8], borderRadius: spacing[4] }}
                />
              ) : (
                <View
                  style={{
                    width: spacing[8],
                    height: spacing[8],
                    borderRadius: spacing[4],
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceAlt,
                  }}
                >
                  <Text style={[typography.h2, { color: colors.textPrimary }]}>
                    {initials || 'DR'}
                  </Text>
                </View>
              )}
            </View>

            <AppButton
              title="Documents"
              variant="secondary"
              onPress={() => {
                setShowProfileActionsModal(false);
                navigation.navigate('DocumentsScreen');
              }}
              style={{ marginTop: spacing[2] }}
            />
            <AppButton
              title="Bank Details"
              variant="secondary"
              onPress={() => {
                setShowProfileActionsModal(false);
                navigation.navigate('BankDetailsScreen');
              }}
              style={{ marginTop: spacing[1] }}
            />
            <AppButton
              title="Route Preferences"
              variant="secondary"
              onPress={() => {
                setShowProfileActionsModal(false);
                navigation.navigate('RoutePreferencesScreen');
              }}
              style={{ marginTop: spacing[1] }}
            />
            <AppButton
              title={t('common.cancel')}
              onPress={() => setShowProfileActionsModal(false)}
              style={{ marginTop: spacing[1] }}
            />
          </AppCard>
        </View>
      </Modal>
    </AppScreen>
  );
}

export default HomeScreen;
