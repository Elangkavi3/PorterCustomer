import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import AppButton from '../components/ui/AppButton';
import AppCard from '../components/ui/AppCard';
import AppScreen from '../components/ui/AppScreen';
import { useAppTheme } from '../theme/ThemeProvider';
import { useLanguage } from '../i18n/LanguageProvider';

const BANK_DETAILS_KEY = 'driverBankDetails';

function parseJSON(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (_error) {
    return fallback;
  }
}

function maskAccountNumber(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) {
    return null;
  }

  const tail = digits.slice(-4);
  return `XXXX${tail}`;
}

function BankDetailsScreen({ navigation }) {
  const { colors, spacing, radius, typography } = useAppTheme();
  const { t } = useLanguage();

  const [isEditing, setIsEditing] = useState(false);
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [currentAccountMasked, setCurrentAccountMasked] = useState('');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [confirmNewAccountNumber, setConfirmNewAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  useFocusEffect(
    useCallback(() => {
      async function loadDetails() {
        const raw = await AsyncStorage.getItem(BANK_DETAILS_KEY);
        const stored = parseJSON(raw, null);

        if (stored) {
          setAccountHolderName(stored.accountHolderName || '');
          setBankName(stored.bankName || '');
          setCurrentAccountMasked(maskAccountNumber(stored.accountNumber) || '');
          setIfscCode(stored.ifscCode || '');
          setIsEditing(false);
        } else {
          setCurrentAccountMasked('');
          setIsEditing(true);
        }

        setNewAccountNumber('');
        setConfirmNewAccountNumber('');
      }

      loadDetails();
    }, []),
  );

  const trimmedAccountHolderName = accountHolderName.trim();
  const trimmedBankName = bankName.trim();
  const trimmedNewAccountNumber = newAccountNumber.trim();
  const trimmedConfirmAccountNumber = confirmNewAccountNumber.trim();
  const trimmedIfscCode = ifscCode.trim().toUpperCase();

  const accountNumbersMatch =
    trimmedNewAccountNumber.length > 0
    && trimmedConfirmAccountNumber.length > 0
    && trimmedNewAccountNumber === trimmedConfirmAccountNumber;

  const isSaveEnabled = useMemo(
    () => (
      trimmedAccountHolderName.length > 0
      && trimmedBankName.length > 0
      && trimmedIfscCode.length > 0
      && accountNumbersMatch
    ),
    [
      accountNumbersMatch,
      trimmedAccountHolderName.length,
      trimmedBankName.length,
      trimmedIfscCode.length,
    ],
  );

  const onSave = async () => {
    if (!trimmedAccountHolderName || !trimmedBankName || !trimmedNewAccountNumber || !trimmedConfirmAccountNumber || !trimmedIfscCode) {
      Alert.alert(t('bankDetails.incompleteTitle'), t('bankDetails.incompleteMessage'));
      return;
    }

    if (trimmedNewAccountNumber !== trimmedConfirmAccountNumber) {
      Alert.alert(t('bankDetails.mismatchTitle'), t('bankDetails.mismatchMessage'));
      return;
    }

    const payload = {
      accountHolderName: trimmedAccountHolderName,
      bankName: trimmedBankName,
      accountNumber: trimmedNewAccountNumber,
      ifscCode: trimmedIfscCode,
      updatedAt: new Date().toISOString(),
    };

    try {
      await AsyncStorage.setItem(BANK_DETAILS_KEY, JSON.stringify(payload));

      if (Platform.OS === 'android') {
        ToastAndroid.show(t('bankDetails.saveSuccess'), ToastAndroid.SHORT);
      } else {
        Alert.alert(t('bankDetails.saveSuccess'));
      }

      setCurrentAccountMasked(maskAccountNumber(trimmedNewAccountNumber) || '');
      setIsEditing(false);
      navigation.goBack();
    } catch (_error) {
      Alert.alert(t('bankDetails.saveFailedTitle'), t('bankDetails.saveFailedMessage'));
    }
  };

  return (
    <AppScreen edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.headerRow, { paddingHorizontal: spacing[2], paddingBottom: spacing[1], paddingTop: spacing[1] }]}>
          <TouchableOpacity
            style={[
              styles.backButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.md,
                minHeight: spacing[6],
                minWidth: spacing[6],
              },
            ]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.9}
          >
            <Text style={[styles.backButtonText, { color: colors.textPrimary }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[typography.h1, { color: colors.textPrimary }]}>{t('bankDetails.title')}</Text>
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing[2],
            paddingBottom: spacing[6],
          }}
          showsVerticalScrollIndicator={false}
        >
          <AppCard>
            <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing[1] }]}>
              {t('bankDetails.accountHolderName')}
            </Text>
            <TextInput
              value={accountHolderName}
              onChangeText={setAccountHolderName}
              editable={isEditing}
              style={[
                styles.input,
                {
                  color: colors.textPrimary,
                  borderColor: colors.border,
                  backgroundColor: isEditing ? colors.surfaceAlt : colors.surface,
                  borderRadius: radius.card,
                  minHeight: spacing[6],
                  paddingHorizontal: spacing[2],
                },
              ]}
              placeholder={t('bankDetails.placeholderAccountHolder')}
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="words"
            />

            <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing[1], marginTop: spacing[1] }]}>
              {t('bankDetails.bankName')}
            </Text>
            <TextInput
              value={bankName}
              onChangeText={setBankName}
              editable={isEditing}
              style={[
                styles.input,
                {
                  color: colors.textPrimary,
                  borderColor: colors.border,
                  backgroundColor: isEditing ? colors.surfaceAlt : colors.surface,
                  borderRadius: radius.card,
                  minHeight: spacing[6],
                  paddingHorizontal: spacing[2],
                },
              ]}
              placeholder={t('bankDetails.placeholderBankName')}
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="words"
            />

            <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing[1], marginTop: spacing[1] }]}>
              {t('bankDetails.currentAccountReadOnly')}
            </Text>
            <View
              style={[
                styles.readOnly,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceAlt,
                  borderRadius: radius.card,
                  minHeight: spacing[6],
                  paddingHorizontal: spacing[2],
                },
              ]}
            >
              <Text style={[typography.label, { color: colors.textPrimary }]}>
                {currentAccountMasked || t('bankDetails.currentAccountNotAvailable')}
              </Text>
            </View>

            <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing[1], marginTop: spacing[1] }]}>
              {t('bankDetails.newAccountNumber')}
            </Text>
            <TextInput
              value={newAccountNumber}
              onChangeText={value => setNewAccountNumber(value.replace(/\D/g, ''))}
              editable={isEditing}
              style={[
                styles.input,
                {
                  color: colors.textPrimary,
                  borderColor: colors.border,
                  backgroundColor: isEditing ? colors.surfaceAlt : colors.surface,
                  borderRadius: radius.card,
                  minHeight: spacing[6],
                  paddingHorizontal: spacing[2],
                },
              ]}
              placeholder={t('bankDetails.placeholderNewAccount')}
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
            />

            <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing[1], marginTop: spacing[1] }]}>
              {t('bankDetails.confirmAccountNumber')}
            </Text>
            <TextInput
              value={confirmNewAccountNumber}
              onChangeText={value => setConfirmNewAccountNumber(value.replace(/\D/g, ''))}
              editable={isEditing}
              style={[
                styles.input,
                {
                  color: colors.textPrimary,
                  borderColor: colors.border,
                  backgroundColor: isEditing ? colors.surfaceAlt : colors.surface,
                  borderRadius: radius.card,
                  minHeight: spacing[6],
                  paddingHorizontal: spacing[2],
                },
              ]}
              placeholder={t('bankDetails.placeholderConfirmAccount')}
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
            />

            <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing[1], marginTop: spacing[1] }]}>
              {t('bankDetails.ifscCode')}
            </Text>
            <TextInput
              value={ifscCode}
              onChangeText={value => setIfscCode(value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
              editable={isEditing}
              style={[
                styles.input,
                {
                  color: colors.textPrimary,
                  borderColor: colors.border,
                  backgroundColor: isEditing ? colors.surfaceAlt : colors.surface,
                  borderRadius: radius.card,
                  minHeight: spacing[6],
                  paddingHorizontal: spacing[2],
                },
              ]}
              placeholder={t('bankDetails.placeholderIfsc')}
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="characters"
            />

            {!accountNumbersMatch && trimmedConfirmAccountNumber.length > 0 ? (
              <Text style={[typography.caption, { color: colors.warning, marginTop: spacing[1] }]}>
                {t('bankDetails.validationMismatch')}
              </Text>
            ) : null}

            {isEditing ? (
              <AppButton
                title={t('bankDetails.update')}
                onPress={onSave}
                disabled={!isSaveEnabled}
                style={{ marginTop: spacing[2] }}
              />
            ) : (
              <AppButton
                title={t('bankDetails.edit')}
                onPress={() => setIsEditing(true)}
                style={{ marginTop: spacing[2] }}
              />
            )}
          </AppCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 30,
  },
  input: {
    borderWidth: 1,
  },
  readOnly: {
    borderWidth: 1,
    justifyContent: 'center',
  },
});

export default BankDetailsScreen;
