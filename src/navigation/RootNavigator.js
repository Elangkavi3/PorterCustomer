import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabNavigator from '@navigation/MainTabNavigator';
import NotificationCenterScreen from '@screens/NotificationCenterScreen';

const RootStack = createNativeStackNavigator();

function RootNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
      <RootStack.Screen name="NotificationCenter" component={NotificationCenterScreen} />
    </RootStack.Navigator>
  );
}

export default RootNavigator;
