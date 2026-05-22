import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppButton from '@components/ui/AppButton';
import AppScreen from '@components/ui/AppScreen';
import { transactionSummary, vehicleOptions } from '@data/customerMockData';
import { useAppTheme } from '@theme/ThemeProvider';

function CustomerHomeScreen() {
  const { colors, spacing, radius, typography } = useAppTheme();
  const closedBodyTrucks = vehicleOptions.filter(option => option.bodyType === 'Closed Body');
  const openBodyTrucks = vehicleOptions.filter(option => option.bodyType === 'Open Body');

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing[2] }]}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>Customer app</Text>
            <Text style={[typography.title, { color: colors.textPrimary }]}>Book trucks instantly</Text>
          </View>
        </View>

        <View style={[styles.panel, { backgroundColor: colors.surface, borderRadius: radius.card }]}>
          <View style={styles.row}>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>Quick booking</Text>
            <Text style={[typography.caption, { color: colors.primary }]}>Open or closed body</Text>
          </View>
          <View style={[styles.locationBox, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>From</Text>
            <Text style={[typography.label, styles.placeholderText, { color: colors.textSecondary }]}>
              Loading city or warehouse
            </Text>
          </View>
          <View style={[styles.locationBox, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>To</Text>
            <Text style={[typography.label, styles.placeholderText, { color: colors.textSecondary }]}>
              Unloading city and material details
            </Text>
          </View>
          <AppButton title="Check prices" />
        </View>

        <View style={styles.summaryGrid}>
          {transactionSummary.map(item => (
            <View
              key={item.label}
              style={[styles.summaryCard, { backgroundColor: colors.surface, borderRadius: radius.md }]}
            >
              <Text style={[typography.caption, { color: colors.textSecondary }]}>{item.label}</Text>
              <Text style={[typography.h2, { color: colors.textPrimary }]}>{item.value}</Text>
            </View>
          ))}
        </View>

        <TruckTypeRow title="Closed Body Trucks" shortLabel="CB" trucks={closedBodyTrucks} />
        <TruckTypeRow title="Open Body Trucks" shortLabel="OB" trucks={openBodyTrucks} />
      </ScrollView>
    </AppScreen>
  );
}

function TruckTypeRow({ title, shortLabel, trucks }) {
  const { colors, radius, spacing, typography } = useAppTheme();
  const [activeIndex, setActiveIndex] = useState(0);

  function handleScroll(event) {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / 264);
    const nextIndex = Math.max(0, Math.min(index, trucks.length - 1));
    setActiveIndex(nextIndex);
  }

  return (
    <View style={styles.truckSection}>
      <View style={styles.sectionHeader}>
        <Text style={[typography.h2, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>Swipe to compare</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.truckRow, { paddingRight: spacing[2] }]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToInterval={264}
        decelerationRate="fast"
      >
        {trucks.map(option => (
          <TouchableOpacity
            key={option.type}
            activeOpacity={0.9}
            style={[
              styles.vehicleCard,
              { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md },
            ]}
          >
            <View style={styles.vehicleTopRow}>
              <View style={[styles.vehicleIcon, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={[typography.caption, { color: colors.primary }]}>{shortLabel}</Text>
              </View>
              <View style={styles.priceBlock}>
                <Text style={[typography.label, { color: colors.textPrimary }]}>{option.price}</Text>
                <Text style={[typography.caption, { color: colors.success }]}>{option.eta}</Text>
              </View>
            </View>
            <Text style={[typography.body, { color: colors.textPrimary }]} numberOfLines={2}>
              {option.type}
            </Text>
            <View style={styles.vehicleMetaRow}>
              <Text
                style={[
                  typography.caption,
                  styles.metaPill,
                  { backgroundColor: colors.surfaceAlt, color: colors.textSecondary },
                ]}
              >
                {option.load}
              </Text>
              <Text
                style={[
                  typography.caption,
                  styles.metaPill,
                  { backgroundColor: colors.surfaceAlt, color: colors.textSecondary },
                ]}
              >
                {option.dimensions}
              </Text>
            </View>
            <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={2}>
              Best for {option.bestFor}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.pagination}>
        {trucks.map((option, index) => {
          const isActive = index === activeIndex;

          return (
            <View
              key={option.type}
              style={[
                styles.paginationDot,
                isActive ? styles.paginationDotActive : styles.paginationDotIdle,
                { backgroundColor: isActive ? colors.primary : colors.border },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 20,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
  },
  panel: {
    gap: 14,
    padding: 16,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  locationBox: {
    borderRadius: 10,
    gap: 4,
    padding: 14,
  },
  placeholderText: {
    opacity: 0.72,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryCard: {
    gap: 4,
    padding: 12,
    width: '31%',
  },
  sectionHeader: {
    gap: 2,
  },
  truckSection: {
    gap: 12,
  },
  truckRow: {
    gap: 12,
  },
  vehicleCard: {
    borderWidth: 1,
    gap: 12,
    minHeight: 172,
    padding: 14,
    width: 252,
  },
  vehicleIcon: {
    alignItems: 'center',
    borderRadius: 10,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  vehicleTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  vehicleTitleBlock: {
    flex: 1,
    gap: 2,
  },
  priceBlock: {
    alignItems: 'flex-end',
    gap: 2,
  },
  vehicleMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaPill: {
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pagination: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  paginationDot: {
    borderRadius: 999,
    height: 7,
  },
  paginationDotActive: {
    width: 18,
  },
  paginationDotIdle: {
    width: 7,
  },
});

export default CustomerHomeScreen;
