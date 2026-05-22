import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppBadge from '../components/ui/AppBadge';
import AppButton from '../components/ui/AppButton';
import AppCard from '../components/ui/AppCard';
import AppHeader from '../components/ui/AppHeader';
import AppScreen from '../components/ui/AppScreen';
import InspectionChecklist from '../components/InspectionChecklist';
import { useAppTheme } from '../theme/ThemeProvider';
import { useLanguage } from '../i18n/LanguageProvider';
import { VEHICLE_STATUS } from '../services/vehicleStatus';

const KEYS = {
  vehicleInspectionDate: 'vehicleInspectionDate',
  vehicleLastInspectionTime: 'vehicleLastInspectionTime',
  vehicleSafetyStatus: 'vehicleSafetyStatus',
  vehicleUnsafeReason: 'vehicleUnsafeReason',
};

function todayStamp() {
  const now = new Date();
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, '0');
  const d = `${now.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function VehicleInspectionScreen({ navigation }) {
  const { colors, spacing, typography } = useAppTheme();
  const { t } = useLanguage();

  const [odometer, setOdometer] = useState('');
  const [images] = useState({
    front: null,
    rear: null,
    left: null,
    right: null,
  });
  const [checklist, setChecklist] = useState({
    brakes: 'ok',
    lights: 'ok',
    tires: 'ok',
    mirrors: 'ok',
    documents: 'ok',
  });

  const isReady = useMemo(
    () => Object.values(checklist).every(item => item === 'ok'),
    [checklist],
  );

  const onUpdateItem = (item, state) => {
    setChecklist(prev => ({ ...prev, [item]: state }));
  };

  const submitInspection = async () => {
    const nowIso = new Date().toISOString();

    await AsyncStorage.multiSet([
      [KEYS.vehicleInspectionDate, todayStamp()],
      [KEYS.vehicleLastInspectionTime, nowIso],
      [KEYS.vehicleSafetyStatus, isReady ? VEHICLE_STATUS.ROAD_READY : VEHICLE_STATUS.NEEDS_ATTENTION],
      [KEYS.vehicleUnsafeReason, isReady ? '' : 'Checklist incomplete'],
    ]);

    Alert.alert(t('inspectionSimple.savedTitle'), t('inspectionSimple.savedMessage'));
    navigation.goBack();
  };

  return (
    <AppScreen edges={['top', 'bottom']}>
      <AppHeader title={t('vehicleInspection.title')} subtitle={t('vehicleInspection.subtitle')} />

      <ScrollView contentContainerStyle={{ paddingBottom: spacing[6], paddingHorizontal: spacing[2] }}>
        <AppCard>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>{t('vehicleInspection.currentStatus')}</Text>
            <AppBadge label={isReady ? 'Road Ready' : 'Needs Attention'} tone={isReady ? 'success' : 'warning'} />
          </View>
        </AppCard>

        <AppCard style={{ marginTop: spacing[1] }}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>{t('vehicleInspection.vehicleOverview')}</Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>{t('vehicleInspection.vehicleNumber')}</Text>
          <Text style={[typography.label, { color: colors.textPrimary }]}>TN-01-AB-1048</Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing[1] }]}>{t('vehicleInspection.odometerInput')}</Text>
          <TextInput
            placeholder={t('vehicleInspection.enterOdometer')}
            value={odometer}
            onChangeText={setOdometer}
            keyboardType="number-pad"
            placeholderTextColor={colors.textSecondary}
            style={[
              typography.body,
              {
                color: colors.textPrimary,
                marginTop: spacing[1],
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surfaceAlt,
                borderRadius: spacing[2],
                minHeight: spacing[6],
                paddingHorizontal: spacing[2],
              },
            ]}
          />
        </AppCard>

        <AppCard style={{ marginTop: spacing[1] }}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>{t('vehicleInspection.imageCapture')}</Text>
          <TouchableOpacity
            style={{
              marginTop: spacing[1],
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surfaceAlt,
              borderRadius: spacing[2],
              minHeight: spacing[6],
              justifyContent: 'center',
              paddingHorizontal: spacing[2],
            }}
          >
            <Text style={[typography.label, { color: colors.textPrimary }]}>
              {`Front: ${images.front ? 'Captured' : 'Tap to capture'}`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              marginTop: spacing[1],
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surfaceAlt,
              borderRadius: spacing[2],
              minHeight: spacing[6],
              justifyContent: 'center',
              paddingHorizontal: spacing[2],
            }}
          >
            <Text style={[typography.label, { color: colors.textPrimary }]}>
              {`Rear: ${images.rear ? 'Captured' : 'Tap to capture'}`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              marginTop: spacing[1],
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surfaceAlt,
              borderRadius: spacing[2],
              minHeight: spacing[6],
              justifyContent: 'center',
              paddingHorizontal: spacing[2],
            }}
          >
            <Text style={[typography.label, { color: colors.textPrimary }]}>
              {`Left: ${images.left ? 'Captured' : 'Tap to capture'}`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              marginTop: spacing[1],
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surfaceAlt,
              borderRadius: spacing[2],
              minHeight: spacing[6],
              justifyContent: 'center',
              paddingHorizontal: spacing[2],
            }}
          >
            <Text style={[typography.label, { color: colors.textPrimary }]}>
              {`Right: ${images.right ? 'Captured' : 'Tap to capture'}`}
            </Text>
          </TouchableOpacity>
        </AppCard>

        <AppCard style={{ marginTop: spacing[1] }}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>{t('inspectionSimple.checklist')}</Text>
          <InspectionChecklist
            checklistState={checklist}
            onUpdateItem={onUpdateItem}
          />

          {!isReady ? (
            <Text style={[typography.caption, { color: colors.warning, marginTop: spacing[1] }]}>
              {t('inspectionSimple.completeAll')}
            </Text>
          ) : null}

        </AppCard>
        <AppButton
          title={t('inspectionSimple.submit')}
          onPress={submitInspection}
          disabled={!isReady}
          style={{ marginTop: spacing[2] }}
        />
      </ScrollView>
    </AppScreen>
  );
}

export default VehicleInspectionScreen;
