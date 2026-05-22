import React from 'react';
import { View, FlatList, Text } from 'react-native';
import AppScreen from '../components/ui/AppScreen';
import AppHeader from '../components/ui/AppHeader';
import AppCard from '../components/ui/AppCard';
import { useAppTheme } from '../theme/ThemeProvider';
import { useLanguage } from '../i18n/LanguageProvider';

const mockDocuments = [
  { id: '1', name: 'Driving License', status: 'Verified' },
  { id: '2', name: 'Vehicle Registration', status: 'Pending' },
  { id: '3', name: 'Insurance', status: 'Expired' },
  { id: '4', name: 'Pollution Certificate', status: 'Verified' },
];

function DocumentVaultScreen() {
  const { colors, spacing, typography } = useAppTheme();
  const { t } = useLanguage();

  const renderItem = ({ item }) => (
    <AppCard style={{ marginBottom: spacing[1] }}>
      <Text style={[typography.h3, { color: colors.textPrimary }]}>{item.name}</Text>
      <Text style={[typography.body, { color: colors.textSecondary }]}>{t('documentVault.status')}: {item.status}</Text>
    </AppCard>
  );

  return (
    <AppScreen>
      <AppHeader title={t('documentVault.title')} />
      <View style={{ padding: spacing[2] }}>
        <FlatList
          data={mockDocuments}
          renderItem={renderItem}
          keyExtractor={item => item.id}
        />
      </View>
    </AppScreen>
  );
}

export default DocumentVaultScreen;
