export const TRIP_STATES = {
  IDLE: 'IDLE',
  ASSIGNED: 'ASSIGNED',
  ACCEPTED: 'ACCEPTED',
  IN_PROGRESS: 'IN_PROGRESS',
  EN_ROUTE_PICKUP: 'EN_ROUTE_PICKUP',
  ARRIVED_PICKUP: 'ARRIVED_PICKUP',
  PICKUP_CONFIRMED: 'PICKUP_CONFIRMED',
  IN_TRANSIT: 'IN_TRANSIT',
  ARRIVED_DELIVERY: 'ARRIVED_DELIVERY',
  DELIVERY_CONFIRMED: 'DELIVERY_CONFIRMED',
  DELIVERED: 'DELIVERED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

const ACTIVE_STATES = new Set([
  'ASSIGNED',
  'ACCEPTED',
  'ACTIVE',
  'EN_ROUTE_PICKUP',
  'ARRIVED_PICKUP',
  'PICKUP_CONFIRMED',
  'IN_TRANSIT',
  'ARRIVED_DROP',
  'DELIVERY_CONFIRMED',
  'POD_UPLOADED',
  'IN_PROGRESS',
]);

export function parseJson(value, fallback) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
}

export function normalizeTripState(rawState) {
  const parsed = parseJson(rawState, rawState);

  if (typeof parsed === 'object' && parsed?.status) {
    return String(parsed.status).toUpperCase();
  }

  return String(parsed || TRIP_STATES.IDLE).toUpperCase();
}

export function isTripActive(state) {
  return ACTIVE_STATES.has(normalizeTripState(state));
}

export function normalizeTrip(job, fallbackDate) {
  if (!job || typeof job !== 'object' || !job.id || !job.pickup || !job.drop) {
    return null;
  }

  return {
    id: String(job.id),
    pickup: String(job.pickup),
    drop: String(job.drop),
    status: String(job.status || TRIP_STATES.ASSIGNED).toUpperCase(),
    date: String(job.date || fallbackDate || ''),
    distance: String(job.distance || '0 km'),
    eta: String(job.eta || '5h 30m'),
    earnings: typeof job.earnings === 'number' ? job.earnings : 0,
    customerName: String(job.customerName || 'Operations Desk'),
    customerPhone: String(job.customerPhone || '9876543210'),
    vehicleNumber: String(job.vehicleNumber || ''),
    pickupCode: String(job.pickupCode || '123456'),
    deliveryCode: String(job.deliveryCode || '654321'),
  };
}

export function resolveCurrentTrip({ activeTripRaw, jobsRaw, tripStateRaw, fallbackDate }) {
  const tripState = normalizeTripState(tripStateRaw);
  const activeTrip = normalizeTrip(parseJson(activeTripRaw, null), fallbackDate);
  const jobsSource = parseJson(jobsRaw, []);
  const jobs = Array.isArray(jobsSource)
    ? jobsSource.map(job => normalizeTrip(job, fallbackDate)).filter(Boolean)
    : [];

  if (activeTrip && isTripActive(tripState)) {
    return { trip: { ...activeTrip, status: tripState }, tripState, jobs };
  }

  const assignedTrip = jobs.find(item => item.status === TRIP_STATES.ASSIGNED);
  if (assignedTrip) {
    return { trip: assignedTrip, tripState: TRIP_STATES.ASSIGNED, jobs };
  }

  const activeJob = jobs.find(item => isTripActive(item.status));
  if (activeJob) {
    return { trip: activeJob, tripState: normalizeTripState(activeJob.status), jobs };
  }

  return { trip: null, tripState: TRIP_STATES.IDLE, jobs };
}

export function toDisplayStatus(state) {
  const normalized = normalizeTripState(state);

  if (normalized === TRIP_STATES.COMPLETED) {
    return 'COMPLETED';
  }
  if (normalized === TRIP_STATES.CANCELLED) {
    return 'CRITICAL';
  }
  if (normalized === TRIP_STATES.ASSIGNED) {
    return 'ACTIVE';
  }
  return 'ACTIVE';
}

export function isUpcomingTripState(state) {
  const normalized = normalizeTripState(state);
  return normalized === TRIP_STATES.ASSIGNED || normalized === TRIP_STATES.ACCEPTED;
}

export function isPastTripState(state) {
  const normalized = normalizeTripState(state);
  return normalized === TRIP_STATES.COMPLETED || normalized === TRIP_STATES.CANCELLED;
}

export function getLifecycleStep(state) {
  const normalized = normalizeTripState(state);
  if (normalized === TRIP_STATES.ASSIGNED) {
    return 1;
  }
  if (normalized === TRIP_STATES.ACCEPTED || normalized === TRIP_STATES.EN_ROUTE_PICKUP) {
    return 2;
  }
  if (normalized === TRIP_STATES.ARRIVED_PICKUP) {
    return 3;
  }
  if (normalized === TRIP_STATES.PICKUP_CONFIRMED || normalized === TRIP_STATES.IN_TRANSIT) {
    return 4;
  }
  if (normalized === TRIP_STATES.ARRIVED_DELIVERY) {
    return 5;
  }
  if (
    normalized === TRIP_STATES.DELIVERY_CONFIRMED
    || normalized === TRIP_STATES.DELIVERED
    || normalized === TRIP_STATES.COMPLETED
  ) {
    return 6;
  }
  return 1;
}
