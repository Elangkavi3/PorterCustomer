import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import AppCard from './ui/AppCard';
import AppButton from './ui/AppButton';
import StatusBadge from './StatusBadge';
import { useAppTheme } from '../theme/ThemeProvider';
import { useLanguage } from '../i18n/LanguageProvider';

function formatCurrency(amount) {
  const value = Number.isFinite(amount) ? amount : 0;
  return `₹ ${value.toLocaleString('en-IN')}`;
}

function TripCard({ trip, status, onPress, actions = [], onSupportPress }) {
  const { colors, spacing, typography } = useAppTheme();
  const { t } = useLanguage();

  if (!trip) {
    return null;
  }

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <AppCard>
        <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>{trip.id}</Text>
          <StatusBadge status={status || trip.status || 'ACTIVE'} />
        </View>

        <Text style={[typography.label, { color: colors.textPrimary, marginTop: spacing[1] }]}> 
          {trip.pickup} to {trip.drop}
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}> 
          {t('tripSimple.distance')}: {trip.distance}
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]}> 
          {t('tripSimple.pickup')}: {trip.pickup}
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]}> 
          {t('tripSimple.drop')}: {trip.drop}
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}> 
          {t('tripSimple.payment')}: {formatCurrency(trip.earnings)}
        </Text>

        {onSupportPress ? (
          <AppButton
            title={t('tripSimple.contactSupport')}
            variant="secondary"
            onPress={onSupportPress}
            style={{ marginTop: spacing[1] }}
          />
        ) : null}

        {actions.map(action => (
          <AppButton
            key={action.title}
            title={action.title}
            onPress={action.onPress}
            variant={action.variant || 'primary'}
            disabled={Boolean(action.disabled)}
            style={{ marginTop: spacing[1] }}
          />
        ))}
      </AppCard>
    </TouchableOpacity>
  );
}

export default TripCard;
