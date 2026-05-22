import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AppButton from '@components/ui/AppButton';
import AppScreen from '@components/ui/AppScreen';
import {
  customerRegions,
  goodsTypeOptions,
  handlingOptions,
  urgencyOptions,
  vehicleOptions,
} from '@data/customerMockData';
import { useAppTheme } from '@theme/ThemeProvider';

const allLocations = customerRegions.flatMap(region =>
  region.cities.map(city => ({
    city,
    state: region.state,
    label: `${city}, ${region.state}`,
  })),
);

const bookingSteps = [
  { key: 'route', title: 'Route' },
  { key: 'goods', title: 'Goods' },
  { key: 'vehicle', title: 'Truck' },
  { key: 'review', title: 'Confirm' },
];

function createInitialBooking() {
  return {
    pickupAddress: 'Bengaluru',
    dropAddress: 'Chennai',
    pickupDate: '22/05/2026',
    pickupTime: '10:00 AM - 12:00 PM',
    goodsType: 'Retail cartons',
    weight: '420 kg',
    urgency: 'Same day',
    selectedVehicleType: '20 ft Container Truck',
    customerName: '',
    customerMobile: '',
    notes: '',
    handling: ['Fragile'],
  };
}

function findLocation(value) {
  const normalized = String(value || '').toLowerCase();

  return allLocations.find(
    item =>
      normalized.includes(item.city.toLowerCase()) ||
      normalized.includes(item.state.toLowerCase()),
  );
}

function CustomerHomeScreen() {
  const { colors, spacing, radius, typography } = useAppTheme();
  const [booking, setBooking] = useState(createInitialBooking);
  const [activeStep, setActiveStep] = useState(0);

  const selectedVehicle = vehicleOptions.find(option => option.type === booking.selectedVehicleType) || vehicleOptions[0];
  const pickupLocation = findLocation(booking.pickupAddress);
  const dropLocation = findLocation(booking.dropAddress);
  const routeLabel = `${booking.pickupAddress || 'Pickup'} to ${booking.dropAddress || 'Drop'}`;
  const isLastStep = activeStep === bookingSteps.length - 1;

  const operationsPayload = useMemo(
    () => ({
      id: 'Draft booking',
      customerName: booking.customerName || 'Customer name pending',
      customerMobile: booking.customerMobile || 'Mobile pending',
      from: booking.pickupAddress,
      to: booking.dropAddress,
      state: pickupLocation?.state || '',
      deliveryState: dropLocation?.state || '',
      pickupDateDisplay: booking.pickupDate,
      pickupWindow: booking.pickupTime,
      requiredVehicleType: selectedVehicle.bodyType === 'Closed Body' ? 'Container' : 'Open Body',
      vehicleType: selectedVehicle.type,
      vehicleBodyType: selectedVehicle.bodyType,
      weight: booking.weight,
      goodsType: booking.goodsType,
      urgency: booking.urgency,
      handling: booking.handling,
      notes: booking.notes,
      status: 'Pending Assignment',
    }),
    [booking, dropLocation?.state, pickupLocation?.state, selectedVehicle],
  );

  function updateBooking(field, value) {
    setBooking(current => ({
      ...current,
      [field]: value,
    }));
  }

  function toggleHandling(value) {
    setBooking(current => {
      const exists = current.handling.includes(value);
      return {
        ...current,
        handling: exists
          ? current.handling.filter(item => item !== value)
          : [...current.handling, value],
      };
    });
  }

  function goNext() {
    if (!isLastStep) {
      setActiveStep(current => current + 1);
      return;
    }

    Alert.alert(
      'Booking request ready',
      `${routeLabel}\n${selectedVehicle.type}\n${booking.goodsType}, ${booking.weight}\nStatus: ${operationsPayload.status}`,
    );
  }

  function goBack() {
    setActiveStep(current => Math.max(0, current - 1));
  }

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing[2] }]}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>Customer app</Text>
            <Text style={[typography.title, { color: colors.textPrimary }]}>Book a truck</Text>
          </View>
        </View>

        <View style={[styles.panel, { backgroundColor: colors.surface, borderRadius: radius.card }]}>
          <View style={styles.row}>
            <View style={styles.headerText}>
              <Text style={[typography.h2, { color: colors.textPrimary }]}>Quick booking</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                Step {activeStep + 1} of {bookingSteps.length}
              </Text>
            </View>
            <Text style={[typography.caption, styles.routeHint, { color: colors.primary }]} numberOfLines={2}>
              {routeLabel}
            </Text>
          </View>

          <StepTabs steps={bookingSteps} activeStep={activeStep} onSelect={setActiveStep} />

          {activeStep === 0 ? (
            <RouteStep booking={booking} updateBooking={updateBooking} />
          ) : null}
          {activeStep === 1 ? (
            <GoodsStep booking={booking} updateBooking={updateBooking} toggleHandling={toggleHandling} />
          ) : null}
          {activeStep === 2 ? (
            <VehicleStep
              selectedVehicleType={booking.selectedVehicleType}
              onSelectVehicle={type => updateBooking('selectedVehicleType', type)}
            />
          ) : null}
          {activeStep === 3 ? (
            <ReviewStep
              booking={booking}
              routeLabel={routeLabel}
              selectedVehicle={selectedVehicle}
              updateBooking={updateBooking}
            />
          ) : null}

          <View style={styles.actionsRow}>
            {activeStep > 0 ? (
              <AppButton title="Back" variant="secondary" onPress={goBack} style={styles.actionButton} />
            ) : null}
            <AppButton
              title={isLastStep ? 'Request price' : 'Continue'}
              onPress={goNext}
              style={styles.actionButton}
            />
          </View>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

function StepTabs({ steps, activeStep, onSelect }) {
  const { colors, radius, typography } = useAppTheme();

  return (
    <View style={styles.stepTabs}>
      {steps.map((step, index) => {
        const active = index === activeStep;

        return (
          <TouchableOpacity
            key={step.key}
            activeOpacity={0.85}
            onPress={() => onSelect(index)}
            style={[
              styles.stepTab,
              {
                backgroundColor: active ? colors.primary : colors.surfaceAlt,
                borderRadius: radius.pill,
              },
            ]}
          >
            <Text style={[typography.caption, { color: active ? colors.textOnColor : colors.textSecondary }]}>
              {index + 1}. {step.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function RouteStep({ booking, updateBooking }) {
  return (
    <View style={styles.stepContent}>
      <SearchField
        label="From"
        value={booking.pickupAddress}
        placeholder="Type pickup address, area, city"
        suggestions={allLocations}
        getSuggestionLabel={item => item.label}
        onChangeText={value => updateBooking('pickupAddress', value)}
        onSelect={item => updateBooking('pickupAddress', item.label)}
      />
      <SearchField
        label="To"
        value={booking.dropAddress}
        placeholder="Type drop address, area, city"
        suggestions={allLocations}
        getSuggestionLabel={item => item.label}
        onChangeText={value => updateBooking('dropAddress', value)}
        onSelect={item => updateBooking('dropAddress', item.label)}
      />
      <View style={styles.formGrid}>
        <BookingField
          label="Pickup date"
          value={booking.pickupDate}
          onChangeText={value => updateBooking('pickupDate', value)}
          placeholder="DD/MM/YYYY"
        />
        <BookingField
          label="Time slot"
          value={booking.pickupTime}
          onChangeText={value => updateBooking('pickupTime', value)}
          placeholder="Pickup window"
        />
      </View>
    </View>
  );
}

function GoodsStep({ booking, updateBooking, toggleHandling }) {
  return (
    <View style={styles.stepContent}>
      <SearchField
        label="Goods type"
        value={booking.goodsType}
        placeholder="Type goods type"
        suggestions={goodsTypeOptions}
        getSuggestionLabel={item => item}
        onChangeText={value => updateBooking('goodsType', value)}
        onSelect={item => updateBooking('goodsType', item)}
      />
      <BookingField
        label="Approx weight"
        value={booking.weight}
        onChangeText={value => updateBooking('weight', value)}
        placeholder="Kg or tons"
      />
      <ChipGroup
        label="Need any extra care?"
        options={handlingOptions.slice(0, 6)}
        selectedValue={booking.handling}
        onSelect={toggleHandling}
        multiSelect
      />
      <ChipGroup
        label="When do you need it?"
        options={urgencyOptions}
        selectedValue={booking.urgency}
        onSelect={value => updateBooking('urgency', value)}
      />
    </View>
  );
}

function VehicleStep({ selectedVehicleType, onSelectVehicle }) {
  const closedBodyTrucks = vehicleOptions.filter(option => option.bodyType === 'Closed Body');
  const openBodyTrucks = vehicleOptions.filter(option => option.bodyType === 'Open Body');

  return (
    <View style={styles.stepContent}>
      <TruckCarousel
        title="Closed Body Trucks"
        shortLabel="CB"
        trucks={closedBodyTrucks}
        selectedVehicleType={selectedVehicleType}
        onSelectVehicle={onSelectVehicle}
      />
      <TruckCarousel
        title="Open Body Trucks"
        shortLabel="OB"
        trucks={openBodyTrucks}
        selectedVehicleType={selectedVehicleType}
        onSelectVehicle={onSelectVehicle}
      />
    </View>
  );
}

function ReviewStep({ booking, routeLabel, selectedVehicle, updateBooking }) {
  const { colors, radius, typography } = useAppTheme();

  return (
    <View style={styles.stepContent}>
      <View style={[styles.reviewBox, { backgroundColor: colors.surfaceAlt, borderRadius: radius.md }]}>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>Your request</Text>
        <Text style={[typography.h2, { color: colors.textPrimary }]}>{routeLabel}</Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {booking.pickupDate} | {booking.pickupTime}
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {selectedVehicle.type} | {booking.goodsType} | {booking.weight}
        </Text>
      </View>
      <View style={styles.formGrid}>
        <BookingField
          label="Your name"
          value={booking.customerName}
          onChangeText={value => updateBooking('customerName', value)}
          placeholder="Name or company"
        />
        <BookingField
          label="Mobile"
          value={booking.customerMobile}
          onChangeText={value => updateBooking('customerMobile', value)}
          placeholder="+91 mobile"
          keyboardType="phone-pad"
        />
      </View>
      <BookingField
        label="Optional note"
        value={booking.notes}
        onChangeText={value => updateBooking('notes', value)}
        placeholder="Full pickup/drop address, landmark, invoice or handling notes"
        multiline
      />
    </View>
  );
}

function SearchField({ label, value, placeholder, suggestions, getSuggestionLabel, onChangeText, onSelect }) {
  const { colors, radius, typography } = useAppTheme();
  const query = value.trim().toLowerCase();
  const filteredSuggestions = suggestions
    .filter(item => {
      const suggestionLabel = getSuggestionLabel(item).toLowerCase();
      return !query || suggestionLabel.includes(query);
    })
    .slice(0, 6);

  return (
    <View style={styles.searchBlock}>
      <BookingField label={label} value={value} onChangeText={onChangeText} placeholder={placeholder} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {filteredSuggestions.map(item => {
          const suggestionLabel = getSuggestionLabel(item);
          const active = suggestionLabel.toLowerCase() === value.toLowerCase();

          return (
            <TouchableOpacity
              key={suggestionLabel}
              activeOpacity={0.85}
              onPress={() => onSelect(item)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.primary : colors.surfaceAlt,
                  borderColor: active ? colors.primary : colors.border,
                  borderRadius: radius.pill,
                },
              ]}
            >
              <Text style={[typography.caption, { color: active ? colors.textOnColor : colors.textSecondary }]}>
                {suggestionLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function TruckCarousel({ title, shortLabel, trucks, selectedVehicleType, onSelectVehicle }) {
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
        {trucks.map(option => {
          const selected = option.type === selectedVehicleType;

          return (
            <TouchableOpacity
              key={option.type}
              activeOpacity={0.9}
              onPress={() => onSelectVehicle(option.type)}
              style={[
                styles.vehicleCard,
                {
                  backgroundColor: colors.surfaceAlt,
                  borderColor: selected ? colors.primary : colors.border,
                  borderRadius: radius.md,
                },
              ]}
            >
              <View style={styles.vehicleTopRow}>
                <View style={[styles.vehicleIcon, { backgroundColor: colors.surface }]}>
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
                    { backgroundColor: colors.surface, color: colors.textSecondary },
                  ]}
                >
                  {option.load}
                </Text>
                <Text
                  style={[
                    typography.caption,
                    styles.metaPill,
                    { backgroundColor: colors.surface, color: colors.textSecondary },
                  ]}
                >
                  {option.dimensions}
                </Text>
              </View>
              <Text
                style={[typography.caption, { color: selected ? colors.primary : colors.textSecondary }]}
                numberOfLines={2}
              >
                {selected ? 'Selected for booking' : `Best for ${option.bestFor}`}
              </Text>
            </TouchableOpacity>
          );
        })}
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

function BookingField({ label, style, ...inputProps }) {
  const { colors, radius, typography } = useAppTheme();

  return (
    <View style={[styles.field, style]}>
      <Text style={[typography.caption, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        {...inputProps}
        placeholderTextColor={colors.textSecondary}
        style={[
          typography.label,
          styles.input,
          inputProps.multiline ? styles.inputMultiline : styles.inputSingleLine,
          {
            backgroundColor: colors.surfaceAlt,
            borderColor: colors.border,
            borderRadius: radius.sm,
            color: colors.textPrimary,
          },
        ]}
      />
    </View>
  );
}

function ChipGroup({ label, options, selectedValue, onSelect, multiSelect = false }) {
  const { colors, radius, typography } = useAppTheme();

  return (
    <View style={styles.chipGroup}>
      <Text style={[typography.caption, { color: colors.textSecondary }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {options.map(option => {
          const active = multiSelect ? selectedValue.includes(option) : selectedValue === option;

          return (
            <TouchableOpacity
              key={option}
              activeOpacity={0.85}
              onPress={() => onSelect(option)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.primary : colors.surfaceAlt,
                  borderColor: active ? colors.primary : colors.border,
                  borderRadius: radius.pill,
                },
              ]}
            >
              <Text style={[typography.caption, { color: active ? colors.textOnColor : colors.textSecondary }]}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
    gap: 16,
    padding: 16,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  routeHint: {
    flexShrink: 1,
    maxWidth: 150,
    textAlign: 'right',
  },
  stepTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stepTab: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  stepContent: {
    gap: 14,
  },
  searchBlock: {
    gap: 8,
  },
  formGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  field: {
    flex: 1,
    gap: 6,
    minWidth: 150,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputMultiline: {
    minHeight: 76,
    textAlignVertical: 'top',
  },
  inputSingleLine: {
    minHeight: 44,
    textAlignVertical: 'center',
  },
  chipGroup: {
    gap: 8,
  },
  chipRow: {
    gap: 8,
    paddingRight: 4,
  },
  chip: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  truckSection: {
    gap: 12,
  },
  sectionHeader: {
    gap: 2,
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
  priceBlock: {
    alignItems: 'flex-end',
    flex: 1,
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
  reviewBox: {
    gap: 4,
    padding: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
});

export default CustomerHomeScreen;
