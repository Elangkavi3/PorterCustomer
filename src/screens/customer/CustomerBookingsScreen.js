import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import AppButton from '@components/ui/AppButton';
import AppScreen from '@components/ui/AppScreen';
import { bookingHistory, disputes } from '@data/customerMockData';
import { useAppTheme } from '@theme/ThemeProvider';

function CustomerBookingsScreen() {
  const { colors, spacing, radius, typography } = useAppTheme();

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing[2] }]}>
        <Text style={[typography.title, { color: colors.textPrimary }]}>Bookings</Text>

        {bookingHistory.map(booking => (
          <View
            key={booking.id}
            style={[styles.card, { backgroundColor: colors.surface, borderRadius: radius.card }]}
          >
            <View style={styles.row}>
              <Text style={[typography.h2, { color: colors.textPrimary }]}>{booking.id}</Text>
              <StatusPill status={booking.status} />
            </View>
            <Text style={[typography.body, { color: colors.textPrimary }]}>{booking.route}</Text>
            <View style={styles.row}>
              <Text style={[typography.label, { color: colors.textSecondary }]}>{booking.date}</Text>
              <Text style={[typography.label, { color: colors.textPrimary }]}>{booking.amount}</Text>
            </View>
            <View style={styles.actionRow}>
              <AppButton title="View trip" variant="secondary" style={styles.actionButton} />
              <AppButton title="Invoice" variant="secondary" style={styles.actionButton} />
            </View>
          </View>
        ))}

        <Text style={[typography.h2, { color: colors.textPrimary }]}>Disputes</Text>
        {disputes.map(dispute => (
          <View
            key={dispute.id}
            style={[styles.card, { backgroundColor: colors.surface, borderRadius: radius.card }]}
          >
            <View style={styles.row}>
              <Text style={[typography.h2, { color: colors.textPrimary }]}>{dispute.id}</Text>
              <StatusPill status={dispute.status} />
            </View>
            <Text style={[typography.label, { color: colors.textSecondary }]}>
              {dispute.type} on {dispute.tripId}
            </Text>
            <Text style={[typography.body, { color: colors.textPrimary }]}>{dispute.reason}</Text>
            <Text style={[typography.label, { color: colors.textPrimary }]}>Impact: {dispute.amount}</Text>
          </View>
        ))}
      </ScrollView>
    </AppScreen>
  );
}

function StatusPill({ status }) {
  const { colors, typography } = useAppTheme();
  const statusColor =
    status === 'Delivered' || status === 'Resolved'
      ? colors.success
      : status === 'Cancelled'
        ? colors.critical
        : colors.primary;

  return (
    <View style={[styles.statusPill, { backgroundColor: colors.surfaceAlt }]}>
      <Text style={[typography.caption, { color: statusColor }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
  },
  card: {
    gap: 12,
    padding: 16,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});

export default CustomerBookingsScreen;
