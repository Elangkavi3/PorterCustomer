import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import AppButton from '@components/ui/AppButton';
import AppScreen from '@components/ui/AppScreen';
import { disputes, notifications } from '@data/customerMockData';
import { useAppTheme } from '@theme/ThemeProvider';

const helpTopics = ['Booking issue', 'Payment support', 'Driver contact', 'Damage claim'];

function CustomerSupportScreen() {
  const { colors, spacing, radius, typography } = useAppTheme();
  const openDispute = disputes.find(item => item.status !== 'Resolved');

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing[2] }]}>
        <Text style={[typography.title, { color: colors.textPrimary }]}>Support</Text>

        <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radius.card }]}>
          <Text style={[typography.h1, { color: colors.textPrimary }]}>Control tower support</Text>
          <Text style={[typography.label, { color: colors.textSecondary }]}>
            Raise delivery, payment, or damage issues with trip evidence attached.
          </Text>
          <View style={styles.actionRow}>
            <AppButton title="Chat now" style={styles.actionButton} />
            <AppButton title="Raise dispute" variant="secondary" style={styles.actionButton} />
          </View>
        </View>

        {openDispute ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radius.card }]}>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>Active dispute</Text>
            <Text style={[typography.body, { color: colors.textPrimary }]}>{openDispute.id}</Text>
            <Text style={[typography.label, { color: colors.textSecondary }]}>
              {openDispute.type} - {openDispute.status}
            </Text>
            <Text style={[typography.label, { color: colors.textPrimary }]}>{openDispute.reason}</Text>
            <View style={styles.evidenceRow}>
              {openDispute.evidence.map(item => (
                <View
                  key={item}
                  style={[styles.evidencePill, { backgroundColor: colors.surfaceAlt }]}
                >
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <Text style={[typography.h2, { color: colors.textPrimary }]}>Help topics</Text>
        {helpTopics.map(topic => (
          <View
            key={topic}
            style={[styles.topic, { backgroundColor: colors.surface, borderRadius: radius.md }]}
          >
            <Text style={[typography.body, { color: colors.textPrimary }]}>{topic}</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>Open</Text>
          </View>
        ))}

        <Text style={[typography.h2, { color: colors.textPrimary }]}>Notifications</Text>
        {notifications.map(item => (
          <View
            key={item.id}
            style={[styles.notification, { backgroundColor: colors.surface, borderRadius: radius.md }]}
          >
            <View style={styles.notificationText}>
              <Text style={[typography.body, { color: colors.textPrimary }]}>{item.title}</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>{item.detail}</Text>
            </View>
            {item.unread ? <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} /> : null}
          </View>
        ))}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 14,
  },
  card: {
    gap: 12,
    padding: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
  evidenceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  evidencePill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  topic: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  notification: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  notificationText: {
    flex: 1,
    gap: 4,
  },
  unreadDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
});

export default CustomerSupportScreen;
