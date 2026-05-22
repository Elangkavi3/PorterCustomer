import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from '@navigation/RootNavigator';
import { AppThemeProvider, useAppTheme } from '@theme/ThemeProvider';
import { getNavigationTheme } from '@theme/theme';
import { OperationsProvider } from '@runtime/OperationsProvider';
import { LanguageProvider } from '@i18n/LanguageProvider';

function NavigationShell() {
  const { isDark, mode, colors } = useAppTheme();

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
        translucent={false}
      />
      <NavigationContainer theme={getNavigationTheme(mode)}>
        <RootNavigator />
      </NavigationContainer>
    </>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AppThemeProvider>
          <OperationsProvider>
            <NavigationShell />
          </OperationsProvider>
        </AppThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

export default App;
