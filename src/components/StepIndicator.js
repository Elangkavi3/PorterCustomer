import React from 'react';
import { Text, View } from 'react-native';
import { useAppTheme } from '../theme/ThemeProvider';

const STEP_STATE_INDEX = {
  ASSIGNED: 0,
  ACCEPTED: 0,
  EN_ROUTE_PICKUP: 1,
  ARRIVED_PICKUP: 1,
  PICKUP_CONFIRMED: 1,
  IN_TRANSIT: 2,
  EN_ROUTE_DELIVERY: 2,
  ARRIVED_DELIVERY: 2,
  DELIVERY_CONFIRMED: 3,
  POD_UPLOADED: 3,
  COMPLETED: 3,
};

function StepIndicator({ steps, currentStep }) {
  const { colors, spacing, typography } = useAppTheme();
  const currentIndex = Number.isInteger(currentStep)
    ? currentStep
    : STEP_STATE_INDEX[String(currentStep || '').toUpperCase()] ?? 0;

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {steps.map((step, index) => {
          const active = index <= currentIndex;
          const completed = index < currentIndex;
          return (
            <View
              key={step}
              style={{ alignItems: 'center', flex: 1, position: 'relative' }}
            >
              {index < steps.length - 1 ? (
                <View
                  style={{
                    backgroundColor: completed ? colors.success : colors.border,
                    height: 2,
                    left: '50%',
                    position: 'absolute',
                    right: '-50%',
                    top: spacing[0] + 4,
                    zIndex: 0,
                  }}
                />
              ) : null}
              <View
                style={{
                  backgroundColor: active ? colors.success : colors.border,
                  borderColor: active ? colors.success : colors.border,
                  borderWidth: 2,
                  borderRadius: spacing[1],
                  height: spacing[1],
                  marginBottom: spacing[1],
                  width: spacing[1],
                  zIndex: 1,
                }}
              />
              <Text
                numberOfLines={1}
                style={[
                  typography.caption,
                  { color: active ? colors.success : colors.textSecondary },
                ]}
              >
                {step}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default StepIndicator;
