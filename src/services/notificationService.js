import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '../i18n/translations';
import { isTripActive, isUpcomingTripState, normalizeTripState } from '../utils/tripStatusManager';

export const NOTIFICATION_STORAGE_KEYS = {
  jobsList: 'jobsList',
  activeTrip: 'activeTrip',
  tripState: 'tripState',
  notificationFeed: 'notificationFeed',
  notificationLastSeenAt: 'notificationLastSeenAt',
  documentExpiryAlert: 'documentExpiryAlert',
  complianceWarning: 'complianceWarning',
};
const APP_LANGUAGE_KEY = 'appLanguage';
const MAX_NOTIFICATION_FEED_SIZE = 50;

function parseJson(value, fallback) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
}

function normalizeLanguageCode(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'ta' || raw === 'tamil' || raw === 'தமிழ்') {
    return 'ta';
  }
  if (raw === 'hi' || raw === 'hindi' || raw === 'हिन्दी') {
    return 'hi';
  }
  return 'en';
}

function getByPath(object, path) {
  if (!object || !path) {
    return undefined;
  }

  return String(path)
    .split('.')
    .reduce((acc, key) => (acc && Object.prototype.hasOwnProperty.call(acc, key) ? acc[key] : undefined), object);
}

function resolveLabel(languageCode, key, fallback) {
  const locale = translations[languageCode] || translations.en;
  return getByPath(locale, key) || getByPath(translations.en, key) || fallback;
}

function toTimestamp(value) {
  if (!value) {
    return new Date().toISOString();
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }
  return date.toISOString();
}

function buildNotificationEntry({ type, title, subtitle, message, level = 'INFO', target = null, at }) {
  return {
    id: `${String(type || 'GENERAL').toUpperCase()}-${Date.now()}`,
    type: String(type || 'GENERAL').toUpperCase(),
    title: String(title || 'Nalvel Driver'),
    subtitle: String(subtitle || ''),
    message: String(message || ''),
    level: String(level || 'INFO').toUpperCase(),
    target,
    at: toTimestamp(at),
  };
}

async function appendNotificationEntry(entry) {
  const raw = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEYS.notificationFeed);
  const current = parseJson(raw, []);
  const list = Array.isArray(current) ? current : [];
  const next = [entry, ...list].slice(0, MAX_NOTIFICATION_FEED_SIZE);
  await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEYS.notificationFeed, JSON.stringify(next));
}

async function persistNotification({
  appName,
  type,
  subtitle,
  message,
  level,
  target,
  at,
}) {
  await appendNotificationEntry(
    buildNotificationEntry({
      type,
      title: appName,
      subtitle,
      message,
      level,
      target,
      at,
    }),
  );

  return {
    target,
    notification: {
      title: appName,
      subtitle: String(subtitle || ''),
    },
  };
}

export async function getStoredNotifications() {
  const rows = await AsyncStorage.multiGet([
    NOTIFICATION_STORAGE_KEYS.notificationFeed,
    NOTIFICATION_STORAGE_KEYS.documentExpiryAlert,
    NOTIFICATION_STORAGE_KEYS.complianceWarning,
  ]);
  const data = Object.fromEntries(rows);

  const feed = parseJson(data[NOTIFICATION_STORAGE_KEYS.notificationFeed], []);
  const list = Array.isArray(feed) ? feed.filter(item => item && typeof item === 'object') : [];
  const next = [...list];

  const hasDocumentExpiry = next.some(item => String(item?.type || '').toUpperCase() === 'DOCUMENT_EXPIRING');
  const hasComplianceWarning = next.some(item => String(item?.type || '').toUpperCase() === 'COMPLIANCE_WARNING');

  const documentAlert = parseJson(data[NOTIFICATION_STORAGE_KEYS.documentExpiryAlert], null);
  if (documentAlert && !hasDocumentExpiry) {
    next.push(
      buildNotificationEntry({
        type: 'DOCUMENT_EXPIRING',
        title: 'Nalvel Driver',
        subtitle: 'Document Expiring',
        message: documentAlert?.message,
        level: documentAlert?.level || 'WARNING',
        at: documentAlert?.at,
      }),
    );
  }

  const complianceAlert = parseJson(data[NOTIFICATION_STORAGE_KEYS.complianceWarning], null);
  if (complianceAlert && !hasComplianceWarning) {
    next.push(
      buildNotificationEntry({
        type: 'COMPLIANCE_WARNING',
        title: 'Nalvel Driver',
        subtitle: 'Compliance Warning',
        message: complianceAlert?.message,
        level: complianceAlert?.level || 'WARNING',
        at: complianceAlert?.at,
      }),
    );
  }

  return next.sort((left, right) => {
    const leftTime = new Date(left?.at || 0).getTime();
    const rightTime = new Date(right?.at || 0).getTime();
    return rightTime - leftTime;
  });
}

export async function markNotificationsSeen() {
  await AsyncStorage.setItem(
    NOTIFICATION_STORAGE_KEYS.notificationLastSeenAt,
    new Date().toISOString(),
  );
}

export async function getUnreadNotificationCount() {
  const rows = await AsyncStorage.multiGet([
    NOTIFICATION_STORAGE_KEYS.notificationLastSeenAt,
    NOTIFICATION_STORAGE_KEYS.notificationFeed,
    NOTIFICATION_STORAGE_KEYS.documentExpiryAlert,
    NOTIFICATION_STORAGE_KEYS.complianceWarning,
  ]);

  const data = Object.fromEntries(rows);
  const lastSeen = new Date(data[NOTIFICATION_STORAGE_KEYS.notificationLastSeenAt] || 0).getTime();
  const notifications = await getStoredNotifications();

  if (!Array.isArray(notifications) || notifications.length === 0) {
    return 0;
  }

  return notifications.filter(item => {
    const at = new Date(item?.at || 0).getTime();
    return at > lastSeen;
  }).length;
}

export async function handleFleetNotification(notification) {
  const type = String(notification?.type || '').toUpperCase();
  const payload = notification?.payload || {};
  const languageCode = normalizeLanguageCode(await AsyncStorage.getItem(APP_LANGUAGE_KEY));
  const appName = resolveLabel(languageCode, 'brand.appName', 'Nalvel Driver');

  if (type === 'NEW_TRIP_ASSIGNED') {
    const rows = await AsyncStorage.multiGet([
      NOTIFICATION_STORAGE_KEYS.jobsList,
      NOTIFICATION_STORAGE_KEYS.activeTrip,
      NOTIFICATION_STORAGE_KEYS.tripState,
    ]);
    const data = Object.fromEntries(rows);
    const jobs = parseJson(data[NOTIFICATION_STORAGE_KEYS.jobsList], []);
    const list = Array.isArray(jobs) ? jobs : [];
    const tripState = normalizeTripState(data[NOTIFICATION_STORAGE_KEYS.tripState]);
    const hasActiveTrip = Boolean(parseJson(data[NOTIFICATION_STORAGE_KEYS.activeTrip], null))
      && isTripActive(tripState);
    const upcomingCount = list.filter(item => isUpcomingTripState(item?.status)).length;

    if (upcomingCount >= 2) {
      const subtitle = 'Assignment restricted';
      const message = hasActiveTrip
        ? 'Complete current trip or keep fewer than 2 upcoming trips.'
        : 'Keep fewer than 2 upcoming trips before taking a new assignment.';
      return persistNotification({
        appName,
        type: 'ASSIGNMENT_RESTRICTED',
        subtitle,
        message,
        level: 'WARNING',
        target: { tab: 'Home' },
        at: new Date().toISOString(),
      });
    }

    const now = new Date().toISOString();
    const trip = {
      id: String(payload.id || `PD-${Date.now()}`),
      pickup: String(payload.pickup || 'Pickup'),
      drop: String(payload.drop || 'Drop'),
      status: 'ASSIGNED',
      date: String(payload.date || now.slice(0, 10)),
      earnings: typeof payload.earnings === 'number' ? payload.earnings : 0,
      distance: String(payload.distance || '0 km'),
      eta: String(payload.eta || '0h 00m'),
      pickupCode: String(payload.pickupCode || '123456'),
      deliveryCode: String(payload.deliveryCode || '654321'),
      paymentStatus: 'UNPAID',
    };

    const nextJobs = [trip, ...list.filter(job => job?.id !== trip.id)];
    await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEYS.jobsList, JSON.stringify(nextJobs));

    const subtitle = String(
      payload.subtitle || resolveLabel(languageCode, 'notifications.newTripAssigned', 'New Trip Assigned'),
    );
    return persistNotification({
      appName,
      type,
      subtitle,
      message: subtitle,
      level: 'INFO',
      target: { tab: 'Home' },
      at: now,
    });
  }

  if (type === 'DOCUMENT_EXPIRING') {
    const at = new Date().toISOString();
    const message = String(
      payload.message
        || resolveLabel(languageCode, 'notifications.documentExpiring', 'Document expiry approaching'),
    );
    await AsyncStorage.setItem(
      NOTIFICATION_STORAGE_KEYS.documentExpiryAlert,
      JSON.stringify({
        level: 'WARNING',
        message,
        at,
      }),
    );

    const subtitle = String(
      payload.subtitle || resolveLabel(languageCode, 'notifications.documentExpiring', 'Document Expiring'),
    );
    return persistNotification({
      appName,
      type,
      subtitle,
      message,
      level: 'WARNING',
      target: { tab: 'Home' },
      at,
    });
  }

  if (type === 'PAYMENT_MARKED') {
    const raw = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEYS.jobsList);
    const jobs = parseJson(raw, []);

    if (Array.isArray(jobs)) {
      const nextJobs = jobs.map(job =>
        job?.id === payload.tripId
          ? { ...job, status: 'COMPLETED', paymentStatus: 'PAID' }
          : job,
      );
      await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEYS.jobsList, JSON.stringify(nextJobs));
    }

    const subtitle = String(
      payload.subtitle || resolveLabel(languageCode, 'notifications.paymentMarked', 'Payment Marked'),
    );
    return persistNotification({
      appName,
      type,
      subtitle,
      message: subtitle,
      level: 'INFO',
      target: { tab: 'Jobs', filter: 'PAID' },
      at: new Date().toISOString(),
    });
  }

  if (type === 'COMPLIANCE_WARNING') {
    const at = new Date().toISOString();
    const message = String(
      payload.message
        || resolveLabel(languageCode, 'notifications.complianceWarning', 'Compliance action required'),
    );
    await AsyncStorage.setItem(
      NOTIFICATION_STORAGE_KEYS.complianceWarning,
      JSON.stringify({
        level: 'WARNING',
        message,
        at,
      }),
    );

    const subtitle = String(
      payload.subtitle || resolveLabel(languageCode, 'notifications.complianceWarning', 'Compliance Warning'),
    );
    return persistNotification({
      appName,
      type,
      subtitle,
      message,
      level: 'WARNING',
      target: { tab: 'Home' },
      at,
    });
  }

  const subtitle = String(payload.subtitle || '');
  return persistNotification({
    appName,
    type: type || 'GENERAL',
    subtitle,
    message: String(payload.message || subtitle),
    level: String(payload.level || 'INFO'),
    target: null,
    at: new Date().toISOString(),
  });
}
