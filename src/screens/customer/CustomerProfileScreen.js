import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import AppScreen from '@components/ui/AppScreen';
import { recentTransactions, transactionSummary } from '@data/customerMockData';
import { useAppTheme } from '@theme/ThemeProvider';

const accountItems = ['Saved addresses', 'GST and invoices', 'Security', 'Language'];

function CustomerProfileScreen() {
  const { colors, spacing, radius, typography, isDark, toggleMode } = useAppTheme();

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing[2] }]}>
        <Text style={[typography.title, { color: colors.textPrimary }]}>Profile</Text>

        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderRadius: radius.card }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[typography.h1, { color: colors.textOnColor }]}>PC</Text>
          </View>
          <View style={styles.profileText}>
            <Text style={[typography.h1, { color: colors.textPrimary }]}>Porter Customer</Text>
            <Text style={[typography.label, { color: colors.textSecondary }]}>+91 98765 43210</Text>
            <Text style={[typography.caption, { color: colors.success }]}>KYC verified</Text>
          </View>
        </View>

        <View style={styles.financeGrid}>
          {transactionSummary.map(item => (
            <View
              key={item.label}
              style={[styles.financeCard, { backgroundColor: colors.surface, borderRadius: radius.md }]}
            >
              <Text style={[typography.caption, { color: colors.textSecondary }]}>{item.label}</Text>
              <Text style={[typography.h2, { color: colors.textPrimary }]}>{item.value}</Text>
            </View>
          ))}
        </View>

        <Text style={[typography.h2, { color: colors.textPrimary }]}>Recent transactions</Text>
        {recentTransactions.map(transaction => (
          <View
            key={transaction.id}
            style={[styles.transactionCard, { backgroundColor: colors.surface, borderRadius: radius.md }]}
          >
            <View style={styles.transactionText}>
              <Text style={[typography.body, { color: colors.textPrimary }]}>{transaction.title}</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                {transaction.id} - {transaction.tripId} - {transaction.date}
              </Text>
            </View>
            <View style={styles.transactionAmount}>
              <Text style={[typography.label, { color: colors.textPrimary }]}>{transaction.amount}</Text>
              <Text
                style={[
                  typography.caption,
                  { color: transaction.status === 'Paid' ? colors.success : colors.warning },
                ]}
              >
                {transaction.status}
              </Text>
            </View>
          </View>
        ))}

        <View style={[styles.setting, { backgroundColor: colors.surface, borderRadius: radius.md }]}>
          <View style={styles.settingText}>
            <Text style={[typography.body, { color: colors.textPrimary }]}>Dark mode</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>Match customer app theme</Text>
          </View>
          <Switch value={isDark} onValueChange={toggleMode} />
        </View>

        {accountItems.map(item => (
          <View
            key={item}
            style={[styles.accountItem, { backgroundColor: colors.surface, borderRadius: radius.md }]}
          >
            <Text style={[typography.body, { color: colors.textPrimary }]}>{item}</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>Manage</Text>
          </View>
        ))}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
  },
  profileCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    padding: 16,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  profileText: {
    flex: 1,
    gap: 2,
  },
  financeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  financeCard: {
    gap: 4,
    padding: 12,
    width: '31%',
  },
  transactionCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    padding: 16,
  },
  transactionText: {
    flex: 1,
    gap: 4,
  },
  transactionAmount: {
    alignItems: 'flex-end',
    gap: 2,
  },
  setting: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingText: {
    flex: 1,
  },
  accountItem: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
});

export default CustomerProfileScreen;
