import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import AppButton from '@components/ui/AppButton';
import AppScreen from '@components/ui/AppScreen';
import { activeBooking } from '@data/customerMockData';
import { useAppTheme } from '@theme/ThemeProvider';

function CustomerActivityScreen() {
  const { colors, spacing, radius, typography } = useAppTheme();

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing[2] }]}>
        <View style={styles.row}>
          <View style={styles.titleBlock}>
            <Text style={[typography.title, { color: colors.textPrimary }]}>Live activity</Text>
            <Text style={[typography.label, { color: colors.textSecondary }]}>
              {activeBooking.id} - {activeBooking.status}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.surface }]}>
            <Text style={[typography.caption, { color: colors.success }]}>{activeBooking.eta}</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radius.card }]}>
          <Text style={[typography.h1, { color: colors.textPrimary }]}>
            {activeBooking.route.from} to {activeBooking.route.to}
          </Text>
          <Text style={[typography.label, { color: colors.textSecondary }]}>
            {activeBooking.route.distanceKm} km - Pickup {activeBooking.pickupDate}
          </Text>
          <View style={styles.actionRow}>
            <AppButton title="Call driver" style={styles.actionButton} />
            <AppButton title="Share trip" variant="secondary" style={styles.actionButton} />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radius.card }]}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>Readiness checks</Text>
          <View style={styles.checkGrid}>
            {activeBooking.readiness.map(check => {
              const checkBackground = check.ok ? colors.surfaceAlt : '#FEF2F2';
              const checkTone = check.ok ? colors.success : colors.critical;

              return (
                <View key={check.label} style={[styles.check, { backgroundColor: checkBackground }]}>
                  <Text style={[typography.caption, { color: checkTone }]}>
                    {check.ok ? 'Ready' : 'Pending'}
                  </Text>
                  <Text style={[typography.label, { color: colors.textPrimary }]}>{check.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radius.card }]}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>Trip timeline</Text>
          {activeBooking.timeline.map((step, index) => {
            const active = step.state === 'active';
            const done = step.state === 'done';
            return (
              <View key={step.label} style={styles.timelineRow}>
                <View style={styles.timelineMarker}>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: active ? colors.primary : done ? colors.success : colors.border },
                    ]}
                  />
                  {index < activeBooking.timeline.length - 1 ? (
                    <View style={[styles.line, { backgroundColor: colors.border }]} />
                  ) : null}
                </View>
                <View style={styles.timelineText}>
                  <Text style={[typography.body, { color: colors.textPrimary }]}>{step.label}</Text>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>{step.time}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radius.card }]}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>Assignment details</Text>
          <InfoLine label="Vehicle" value={`${activeBooking.vehicle.type} - ${activeBooking.vehicle.number}`} />
          <InfoLine label="Driver" value={`${activeBooking.driver.name} - ${activeBooking.driver.rating} rating`} />
          <InfoLine label="Load" value={`${activeBooking.load.type}, ${activeBooking.load.weight}`} />
          <InfoLine label="Payment" value={`${activeBooking.payment.amount} - ${activeBooking.payment.status}`} />
        </View>
      </ScrollView>
    </AppScreen>
  );
}

function InfoLine({ label, value }) {
  const { colors, typography } = useAppTheme();

  return (
    <View style={styles.infoLine}>
      <Text style={[typography.caption, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[typography.label, styles.infoValue, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  titleBlock: {
    flex: 1,
  },
  badge: {
    borderRadius: 12,
    padding: 12,
  },
  card: {
    gap: 14,
    padding: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
  checkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  check: {
    borderRadius: 10,
    gap: 4,
    padding: 12,
    width: '47%',
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineMarker: {
    alignItems: 'center',
    width: 18,
  },
  dot: {
    borderRadius: 6,
    height: 12,
    width: 12,
  },
  line: {
    flex: 1,
    marginTop: 4,
    width: 2,
  },
  timelineText: {
    flex: 1,
    paddingBottom: 14,
  },
  infoLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  infoValue: {
    flex: 1,
    textAlign: 'right',
  },
});

export default CustomerActivityScreen;
