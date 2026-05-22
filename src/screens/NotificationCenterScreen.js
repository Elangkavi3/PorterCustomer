import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AppBadge from '../components/ui/AppBadge';
import AppCard from '../components/ui/AppCard';
import AppHeader from '../components/ui/AppHeader';
import AppScreen from '../components/ui/AppScreen';
import EmptyState from '../components/EmptyState';
import { useLanguage } from '../i18n/LanguageProvider';
import { getStoredNotifications, markNotificationsSeen } from '../services/notificationService';
import { useAppTheme } from '../theme/ThemeProvider';

function resolveTone(level) {
  const normalized = String(level || '').toUpperCase();
  if (normalized === 'CRITICAL') {
    return 'critical';
  }
  if (normalized === 'WARNING') {
    return 'warning';
  }
  if (normalized === 'SUCCESS') {
    return 'success';
  }
  return 'active';
}

function resolveNotificationLabel(type, t) {
  const normalized = String(type || '').toUpperCase();
  if (normalized === 'NEW_TRIP_ASSIGNED') {
    return t('notifications.newTripAssigned');
  }
  if (normalized === 'DOCUMENT_EXPIRING') {
    return t('notifications.documentExpiring');
  }
  if (normalized === 'PAYMENT_MARKED') {
    return t('notifications.paymentMarked');
  }
  if (normalized === 'COMPLIANCE_WARNING') {
    return t('notifications.complianceWarning');
  }
  return t('notifications.update');
}

function NotificationCenterScreen() {
  const { colors, spacing, typography } = useAppTheme();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState([]);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const notifications = await getStoredNotifications();
      setItems(Array.isArray(notifications) ? notifications : []);
    } catch (_error) {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      markNotificationsSeen().catch(() => {});
      loadNotifications();
    }, [loadNotifications]),
  );

  return (
    <AppScreen edges={['top', 'bottom']}>
      <AppHeader
        title={t('notifications.centerTitle')}
        subtitle={t('notifications.centerSubtitle')}
        showNotificationButton={false}
      />

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <View style={{ paddingHorizontal: spacing[2] }}>
          <AppCard>
            <EmptyState
              title={t('notifications.emptyTitle')}
              message={t('notifications.emptyMessage')}
            />
          </AppCard>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, index) => String(item?.id || `${item?.type || 'notice'}-${item?.at || index}`)}
          contentContainerStyle={{ paddingBottom: spacing[6], paddingHorizontal: spacing[2] }}
          renderItem={({ item }) => {
            const label = resolveNotificationLabel(item?.type, t);
            const timeLabel = item?.at ? new Date(item.at).toLocaleString() : '-';
            return (
              <AppCard style={{ marginBottom: spacing[1] }}>
                <View style={styles.itemHeaderRow}>
                  <Text style={[typography.h2, styles.itemTitle, { color: colors.textPrimary, paddingRight: spacing[1] }]}>
                    {String(item?.subtitle || label)}
                  </Text>
                  <AppBadge label={label} tone={resolveTone(item?.level)} />
                </View>
                {item?.message ? (
                  <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing[1] }]}>
                    {String(item.message)}
                  </Text>
                ) : null}
                <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>
                  {t('notifications.updatedAt', { time: timeLabel })}
                </Text>
              </AppCard>
            );
          }}
        />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  itemHeaderRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemTitle: {
    flex: 1,
  },
});

export default NotificationCenterScreen;
