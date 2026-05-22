import React, { useState } from 'react';
import { Alert, TextInput, View } from 'react-native';
import AppScreen from '../components/ui/AppScreen';
import AppHeader from '../components/ui/AppHeader';
import AppCard from '../components/ui/AppCard';
import AppButton from '../components/ui/AppButton';
import { useAppTheme } from '../theme/ThemeProvider';
import { useLanguage } from '../i18n/LanguageProvider';

function RaiseTicketScreen({ navigation }) {
  const { colors, spacing, typography } = useAppTheme();
  const { t } = useLanguage();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (subject.trim() === '' || description.trim() === '') {
      Alert.alert(t('raiseTicket.errorTitle'), t('raiseTicket.errorMessage'));
      return;
    }
    // Handle the ticket submission logic here
    Alert.alert(t('raiseTicket.successTitle'), t('raiseTicket.successMessage'));
    navigation.goBack();
  };

  return (
    <AppScreen>
      <AppHeader title={t('raiseTicket.title')} />
      <View style={{ padding: spacing[2] }}>
        <AppCard>
          <TextInput
            editable={false}
            value={t('raiseTicket.department')}
            style={[
              typography.caption,
              {
                color: colors.textSecondary,
                marginBottom: spacing[1],
                backgroundColor: colors.surfaceAlt,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                paddingHorizontal: spacing[2],
                minHeight: spacing[6],
              },
            ]}
          />
          <TextInput
            placeholder={t('raiseTicket.subjectPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={subject}
            onChangeText={setSubject}
            style={[
              typography.body,
              {
                color: colors.textPrimary,
                marginBottom: spacing[1],
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                backgroundColor: colors.surfaceAlt,
                paddingHorizontal: spacing[2],
                minHeight: spacing[6],
              },
            ]}
          />
          <TextInput
            placeholder={t('raiseTicket.descriptionPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={[
              typography.body,
              {
                color: colors.textPrimary,
                minHeight: 140,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                backgroundColor: colors.surfaceAlt,
                paddingHorizontal: spacing[2],
                paddingTop: spacing[2],
              },
            ]}
          />
          <AppButton
            title={t('raiseTicket.submitButton')}
            onPress={handleSubmit}
            style={{ marginTop: spacing[2] }}
          />
        </AppCard>
      </View>
    </AppScreen>
  );
}

export default RaiseTicketScreen;
