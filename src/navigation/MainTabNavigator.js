import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CustomerHomeScreen from '@screens/customer/CustomerHomeScreen';
import CustomerBookingsScreen from '@screens/customer/CustomerBookingsScreen';
import CustomerActivityScreen from '@screens/customer/CustomerActivityScreen';
import CustomerSupportScreen from '@screens/customer/CustomerSupportScreen';
import CustomerProfileScreen from '@screens/customer/CustomerProfileScreen';
import DashboardIcon from '@components/icons/DashboardIcon';
import TripsIcon from '@components/icons/TripsIcon';
import FleetIcon from '@components/icons/FleetIcon';
import ProfileIcon from '@components/icons/ProfileIcon';
import { useAppTheme } from '@theme/ThemeProvider';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: DashboardIcon,
  Bookings: TripsIcon,
  Activity: FleetIcon,
  Support: FleetIcon,
  Profile: ProfileIcon,
};

function TabBarIcon({ routeName, color, size }) {
  const Icon = TAB_ICONS[routeName];
  return Icon ? <Icon size={size || 22} color={color} /> : null;
}

function HomeTabIcon(props) {
  return <TabBarIcon routeName="Home" {...props} />;
}

function BookingsTabIcon(props) {
  return <TabBarIcon routeName="Bookings" {...props} />;
}

function ActivityTabIcon(props) {
  return <TabBarIcon routeName="Activity" {...props} />;
}

function SupportTabIcon(props) {
  return <TabBarIcon routeName="Support" {...props} />;
}

function ProfileTabIcon(props) {
  return <TabBarIcon routeName="Profile" {...props} />;
}

function MainTabNavigator() {
  const { colors, spacing, typography } = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            height: spacing[6] + spacing[3],
            paddingVertical: spacing[1],
          },
        ],
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: [styles.tabLabel, typography.caption],
      }}
    >
      <Tab.Screen
        name="Home"
        component={CustomerHomeScreen}
        options={{ tabBarIcon: HomeTabIcon }}
      />
      <Tab.Screen
        name="Bookings"
        component={CustomerBookingsScreen}
        options={{ tabBarIcon: BookingsTabIcon }}
      />
      <Tab.Screen
        name="Activity"
        component={CustomerActivityScreen}
        options={{ tabBarIcon: ActivityTabIcon }}
      />
      <Tab.Screen
        name="Support"
        component={CustomerSupportScreen}
        options={{ tabBarIcon: SupportTabIcon }}
      />
      <Tab.Screen
        name="Profile"
        component={CustomerProfileScreen}
        options={{ tabBarIcon: ProfileTabIcon }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
  },
  tabLabel: {
    fontWeight: '700',
  },
});

export default MainTabNavigator;
