import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../theme/ThemeProvider';
import { useLanguage } from '../i18n/LanguageProvider';

const ITEMS = ['brakes', 'lights', 'tires', 'mirrors', 'documents'];

function InspectionChecklist({ checklistState, onUpdateItem }) {
  const { colors, spacing, radius, typography } = useAppTheme();
  const { t } = useLanguage();

  return (
    <View>
      {ITEMS.map(item => {
        const state = checklistState[item];
        return (
          <View key={item} style={{ marginTop: spacing[1] }}>
            <Text style={[typography.label, { color: colors.textPrimary, marginBottom: spacing[0] }]}>
              {t(`vehicleInspection.${item}`)}
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing[1] }}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => onUpdateItem(item, 'ok')}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  backgroundColor: state === 'ok' ? colors.success : colors.surfaceAlt,
                  borderColor: state === 'ok' ? colors.success : colors.border,
                  borderRadius: radius.card,
                  borderWidth: 1,
                  justifyContent: 'center',
                  minHeight: 48,
                  paddingHorizontal: spacing[2],
                }}
              >
                <Text style={[typography.label, { color: state === 'ok' ? colors.textOnColor : colors.textPrimary }]}>
                  {t('common.ok')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => onUpdateItem(item, 'issue')}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  backgroundColor: state === 'issue' ? colors.warning : colors.surfaceAlt,
                  borderColor: state === 'issue' ? colors.warning : colors.border,
                  borderRadius: radius.card,
                  borderWidth: 1,
                  justifyContent: 'center',
                  minHeight: 48,
                  paddingHorizontal: spacing[2],
                }}
              >
                <Text style={[typography.label, { color: state === 'issue' ? colors.textOnColor : colors.textPrimary }]}>
                  {t('common.issue')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default InspectionChecklist;
