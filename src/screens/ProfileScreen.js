import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import AppBadge from '../components/ui/AppBadge';
import AppButton from '../components/ui/AppButton';
import AppCard from '../components/ui/AppCard';
import AppHeader from '../components/ui/AppHeader';
import AppScreen from '../components/ui/AppScreen';
import { useAppTheme } from '../theme/ThemeProvider';
import { useLanguage } from '../i18n/LanguageProvider';
import { useOperations } from '../runtime/OperationsProvider';
import { deriveDriverAvailability, DRIVER_AVAILABILITY } from '../utils/driverAvailabilityManager';
import { isTripActive, normalizeTripState, parseJson } from '../utils/tripStatusManager';
import { formatDocumentDate, summarizeRequiredDocuments } from '../services/documentVerification';
import {
  buildRoutePreferencesSummary,
  getRoutePreferencesStorageKey,
} from '../services/routePreferences';
import {
  getVehicleStatusLabel,
  getVehicleStatusTone,
  normalizeVehicleStatus,
} from '../services/vehicleStatus';
import { mockTrips } from '../api/mockData';

const STORAGE_KEYS = {
  profile: 'driverProfile',
  homeState: 'homeState',
  jobsList: 'jobsList',
  tripState: 'tripState',
  activeTrip: 'activeTrip',
  lastCompletedTrip: 'lastCompletedTrip',
  driverDocuments: 'driverDocuments',
  bankDetails: 'driverBankDetails',
  vehicleInspectionDate: 'vehicleInspectionDate',
  vehicleLastInspectionTime: 'vehicleLastInspectionTime',
  vehicleSafetyStatus: 'vehicleSafetyStatus',
};

const DEFAULT_PROFILE = {
  name: 'Ravi Kumar',
  mobile: '9876543210',
  license: 'TN-22-2020-184739',
  driverId: 'PD-10482',
  owner: 'Porter Logistics',
  vehicleType: '16ft Truck',
  vehicleNumber: 'TN-01-AB-1048',
};

const APP_VERSION = '1.0.0';

function resolveInitials(name) {
  const parts = String(name || '')
    .split(' ')
    .map(part => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return 'DR';
  }

  return parts
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();
}

function maskAccountNumber(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return 'XXXXXX6721';
  }

  if (/[xX]{4,}/.test(raw)) {
    return raw.toUpperCase();
  }

  const digits = raw.replace(/\D/g, '');
  if (!digits) {
    return 'XXXXXX6721';
  }

  const tail = digits.slice(-4);
  return `XXXXXX${tail}`;
}

function todayStamp() {
  const now = new Date();
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, '0');
  const d = `${now.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function ProfileScreen({ navigation }) {
  const { colors, spacing, typography, mode, setDarkMode } = useAppTheme();
  const { t, tx, language, supportedLanguages, setLanguage, currentLanguage } = useLanguage();
  const { handleUnauthorized, handleNotification } = useOperations();

  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [status, setStatus] = useState(DRIVER_AVAILABILITY.OFFLINE);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showDeveloperOptions, setShowDeveloperOptions] = useState(false);
  const [, setUnlockTapCount] = useState(0);
  const [documentSummary, setDocumentSummary] = useState(summarizeRequiredDocuments([]));
  const [routeSummary, setRouteSummary] = useState({
    regions: t('routePreferences.none'),
    routeType: t('routePreferences.routeTypeOptions.noPreference'),
  });
  const [bankView, setBankView] = useState({
    bankName: 'HDFC Bank',
    accountMasked: 'XXXXXX6721',
    ifscCode: 'HDFC0000217',
  });
  const [vehicleStatus, setVehicleStatus] = useState('ROAD_READY');

  const hydrate = useCallback(async () => {
    const rows = await AsyncStorage.multiGet([
      STORAGE_KEYS.profile,
      STORAGE_KEYS.homeState,
      STORAGE_KEYS.tripState,
      STORAGE_KEYS.activeTrip,
      STORAGE_KEYS.driverDocuments,
      STORAGE_KEYS.bankDetails,
      STORAGE_KEYS.vehicleSafetyStatus,
      getRoutePreferencesStorageKey(),
    ]);

    const data = Object.fromEntries(rows);
    const profileData = parseJson(data[STORAGE_KEYS.profile], {});
    const homeState = parseJson(data[STORAGE_KEYS.homeState], {});
    const tripState = normalizeTripState(data[STORAGE_KEYS.tripState]);
    const activeTrip = parseJson(data[STORAGE_KEYS.activeTrip], null);
    const hasTrip = Boolean(activeTrip) && isTripActive(tripState);

    const availability = deriveDriverAvailability({
      isOnDuty: Boolean(homeState?.isOnDuty),
      hasTrip,
    });

    const mergedProfile = {
      ...DEFAULT_PROFILE,
      ...profileData,
    };

    const docsRaw = parseJson(data[STORAGE_KEYS.driverDocuments], []);
    const docs = summarizeRequiredDocuments(Array.isArray(docsRaw) ? docsRaw : []);
    const routePrefs = parseJson(data[getRoutePreferencesStorageKey()], null);
    const routePrefsSummary = buildRoutePreferencesSummary(routePrefs, t);
    const bankRaw = parseJson(data[STORAGE_KEYS.bankDetails], {});

    setProfile(mergedProfile);
    setStatus(availability);
    setDocumentSummary(docs);
    setRouteSummary(routePrefsSummary);
    setVehicleStatus(
      normalizeVehicleStatus(data[STORAGE_KEYS.vehicleSafetyStatus] || 'ROAD_READY'),
    );
    setBankView({
      bankName: String(bankRaw.bankName || profileData.bankName || 'HDFC Bank'),
      accountMasked: maskAccountNumber(bankRaw.accountNumber || profileData.accountMasked),
      ifscCode: String(bankRaw.ifscCode || profileData.ifsc || 'HDFC0000217').toUpperCase(),
    });
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      hydrate().catch(() => {
        setProfile(DEFAULT_PROFILE);
        setStatus(DRIVER_AVAILABILITY.OFFLINE);
        setDocumentSummary(summarizeRequiredDocuments([]));
        setRouteSummary({
          regions: t('routePreferences.none'),
          routeType: t('routePreferences.routeTypeOptions.noPreference'),
        });
        setBankView({
          bankName: 'HDFC Bank',
          accountMasked: 'XXXXXX6721',
          ifscCode: 'HDFC0000217',
        });
        setVehicleStatus('ROAD_READY');
      });
    }, [hydrate, t]),
  );

  const statusLabel = useMemo(() => {
    if (status === DRIVER_AVAILABILITY.ON_TRIP || status === DRIVER_AVAILABILITY.ONLINE) {
      return 'ACTIVE';
    }
    return 'UNPAID';
  }, [status]);

  const initials = useMemo(() => resolveInitials(profile.name), [profile.name]);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove([
      'isLoggedIn',
      'authToken',
      'authTokenExpiry',
      'activeTrip',
      'tripState',
    ]);

    const parent = navigation.getParent()?.getParent();
    if (parent) {
      parent.reset({ index: 0, routes: [{ name: 'AuthStack', params: { initialScreen: 'Login' } }] });
      return;
    }

    navigation.navigate('AuthStack');
  }, [navigation]);

  const onBrandTap = useCallback(() => {
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
      [STORAGE_KEYS.profile, JSON.stringify(DEFAULT_PROFILE)],
      [STORAGE_KEYS.homeState, JSON.stringify({ isOnDuty: true, dutyDate: today })],
      [STORAGE_KEYS.jobsList, JSON.stringify(jobs)],
      [STORAGE_KEYS.activeTrip, JSON.stringify(activeTrip)],
      [STORAGE_KEYS.tripState, 'EN_ROUTE_PICKUP'],
      [STORAGE_KEYS.lastCompletedTrip, JSON.stringify(summary)],
      [STORAGE_KEYS.driverDocuments, JSON.stringify(docs)],
      [STORAGE_KEYS.vehicleSafetyStatus, 'ROAD_READY'],
      [STORAGE_KEYS.vehicleInspectionDate, today],
      [STORAGE_KEYS.vehicleLastInspectionTime, nowIso],
    ]);

    await hydrate();
    navigation.getParent()?.navigate('Home', { screen: 'HomeMain' });
    Alert.alert('Developer Mode', 'Mock trip data loaded.');
  }, [hydrate, navigation]);

  return (
    <AppScreen edges={['top', 'bottom']}>
      <AppHeader title={t('profile.title')} />

      <ScrollView contentContainerStyle={{ paddingBottom: spacing[6], paddingHorizontal: spacing[2] }}>
        <AppCard>
          <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
            <View
              style={{
                alignItems: 'center',
                backgroundColor: colors.surfaceAlt,
                borderColor: colors.border,
                borderRadius: 999,
                borderWidth: 1,
                height: spacing[6],
                justifyContent: 'center',
                width: spacing[6],
              }}
            >
              <Text style={[typography.label, { color: colors.textPrimary }]}>{initials}</Text>
            </View>
            <AppBadge label={statusLabel} />
          </View>

          <Text style={[typography.h2, { color: colors.textPrimary, marginTop: spacing[1] }]}>
            {profile.name}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[0] }]}>
            {`${t('profile.driverId')}: ${profile.driverId}`}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[0] }]}>
            {`${t('profile.owner')}: ${profile.owner}`}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[0] }]}>
            {`${t('profile.vehicle')}: ${profile.vehicleType}`}
          </Text>

          <View style={{ marginTop: spacing[1] }}>
            <AppBadge
              label={getVehicleStatusLabel(vehicleStatus)}
              tone={getVehicleStatusTone(vehicleStatus)}
            />
          </View>
        </AppCard>

        <AppCard style={{ marginTop: spacing[1] }}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>
            {t('profile.documentVerification')}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>
            {t('profile.documentStatus')}
          </Text>

          {documentSummary.documents.map(item => (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.9}
              onPress={() =>
                navigation.navigate('DocumentUploadScreen', {
                  documentName: tx(item.name),
                  documentKey: item.key,
                  expiryDate: item.expiryDate,
                })
              }
              style={{
                alignItems: 'center',
                borderTopColor: colors.border,
                borderTopWidth: 1,
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: spacing[1],
                paddingTop: spacing[1],
              }}
            >
              <View style={{ flex: 1, paddingRight: spacing[1] }}>
                <Text style={[typography.label, { color: colors.textPrimary }]}>
                  {tx(item.name)}
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[0] }]}>
                  {`${t('profile.expiry')}: ${formatDocumentDate(item.expiryDate)}`}
                </Text>
              </View>
              <AppBadge label={item.badgeLabel} tone={item.badgeTone} />
            </TouchableOpacity>
          ))}
        </AppCard>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('RoutePreferencesScreen')}
          style={{ marginTop: spacing[1] }}
        >
          <AppCard>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>
              {t('routePreferences.summaryTitle')}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>
              {t('routePreferences.summaryRegions', { regions: routeSummary.regions })}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[0] }]}>
              {t('routePreferences.summaryRouteType', { routeType: routeSummary.routeType })}
            </Text>
          </AppCard>
        </TouchableOpacity>

        <AppCard style={{ marginTop: spacing[1] }}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>
            {t('profile.preferences')}
          </Text>
          <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing[1], minHeight: spacing[6] }}>
            <Text style={[typography.label, { color: colors.textSecondary }]}>{t('profile.darkMode')}</Text>
            <Switch
              value={mode === 'dark'}
              onValueChange={setDarkMode}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.textOnColor}
            />
          </View>

          <Text style={[typography.label, { color: colors.textSecondary, marginTop: spacing[1] }]}>
            {t('profile.language')}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[0] }]}>
            {`${t('language.currentLanguage')}: ${currentLanguage.nativeLabel}`}
          </Text>
          <AppButton
            title={t('language.changeLanguage')}
            variant="secondary"
            onPress={() => setShowLanguageModal(true)}
            style={{ marginTop: spacing[1] }}
          />
        </AppCard>

        <AppCard style={{ marginTop: spacing[1] }}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>
            {t('profile.bankDetails')}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>
            {t('profile.bank')}
          </Text>
          <Text style={[typography.label, { color: colors.textPrimary, marginTop: spacing[0] }]}>
            {bankView.bankName}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>
            {t('profile.account')}
          </Text>
          <Text style={[typography.label, { color: colors.textPrimary, marginTop: spacing[0] }]}>
            {bankView.accountMasked}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>
            {t('profile.ifsc')}
          </Text>
          <Text style={[typography.label, { color: colors.textPrimary, marginTop: spacing[0] }]}>
            {bankView.ifscCode}
          </Text>
        </AppCard>

        <AppButton
          title={t('profile.logout')}
          onPress={() =>
            Alert.alert(t('profile.logout'), t('profileSimple.logoutConfirm'), [
              { text: t('common.cancel'), style: 'cancel' },
              { text: t('profile.logout'), onPress: logout },
            ])
          }
          style={{ marginTop: spacing[1] }}
        />

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onBrandTap}
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
            ) : null}
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
        visible={showLanguageModal}
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={{ backgroundColor: 'rgba(0,0,0,0.45)', flex: 1, justifyContent: 'center', paddingHorizontal: spacing[2] }}>
          <AppCard>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>{t('language.chooseModalTitle')}</Text>
            <View style={{ marginTop: spacing[1] }}>
              {supportedLanguages.map(item => {
                const selected = item.code === language;
                return (
                  <TouchableOpacity
                    key={item.code}
                    activeOpacity={0.9}
                    onPress={async () => {
                      await setLanguage(item.code);
                      setShowLanguageModal(false);
                      await hydrate();
                    }}
                    style={{
                      backgroundColor: selected ? colors.primary : colors.surfaceAlt,
                      borderColor: selected ? colors.primary : colors.border,
                      borderRadius: 16,
                      borderWidth: 1,
                      justifyContent: 'center',
                      marginBottom: spacing[1],
                      minHeight: 48,
                      paddingHorizontal: spacing[2],
                    }}
                  >
                    <Text style={[typography.label, { color: selected ? colors.textOnColor : colors.textPrimary }]}> 
                      {item.nativeLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <AppButton title={t('common.cancel')} variant="secondary" onPress={() => setShowLanguageModal(false)} />
          </AppCard>
        </View>
      </Modal>
    </AppScreen>
  );
}

export default ProfileScreen;
