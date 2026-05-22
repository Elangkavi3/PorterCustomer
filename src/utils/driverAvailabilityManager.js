export const DRIVER_AVAILABILITY = {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
  ON_TRIP: 'ON_TRIP',
};

export function deriveDriverAvailability({ isOnDuty, hasTrip }) {
  if (hasTrip) {
    return DRIVER_AVAILABILITY.ON_TRIP;
  }
  return isOnDuty ? DRIVER_AVAILABILITY.ONLINE : DRIVER_AVAILABILITY.OFFLINE;
}

export function canToggleAvailability(status) {
  return status !== DRIVER_AVAILABILITY.ON_TRIP;
}

export function toggleDutyValue(currentIsOnDuty) {
  return !currentIsOnDuty;
}

export function getAvailabilityLabel(status) {
  if (status === DRIVER_AVAILABILITY.ONLINE) {
    return 'status.active';
  }
  if (status === DRIVER_AVAILABILITY.ON_TRIP) {
    return 'homeSimple.onTrip';
  }
  return 'homeSimple.offline';
}
