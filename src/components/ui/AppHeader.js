import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import NotificationIcon from '../../assets/icons/NotificationIcon.svg';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useLanguage } from '../../i18n/LanguageProvider';
import { getUnreadNotificationCount, markNotificationsSeen } from '../../services/notificationService';

function AppHeader({
  title,
  subtitle,
  leftSlot,
  rightSlot,
  showNotificationButton = true,
  showSettingsButton = true,
  showSOSButton = true,
  onNotificationPress,
  onSettingsPress,
  onSOSPress,
  titleTextStyle,
  subtitleTextStyle,
}) {
  const { colors, spacing, radius, typography } = useAppTheme();
  const { tx } = useLanguage();
  const navigation = useNavigation();
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
    } catch (_error) {
      setUnreadCount(0);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUnreadCount();
    }, [loadUnreadCount]),
  );
  const resolvedTitle = tx(title);
  const isMultilineTitle = typeof resolvedTitle === 'string' && resolvedTitle.includes('\n');

  const hasRoute = useCallback((nav, routeName) => {
    if (!nav || typeof nav.getState !== 'function') {
      return false;
    }

    const state = nav.getState();
    return Boolean(state?.routeNames?.includes(routeName));
  }, []);

  const navigateToSettings = useCallback(() => {
    let current = navigation;
    while (current) {
      if (hasRoute(current, 'SettingsScreen')) {
        current.navigate('SettingsScreen');
        return true;
      }
      if (hasRoute(current, 'Settings')) {
        current.navigate('Settings');
        return true;
      }
      current = current.getParent?.();
    }

    // Last fallback: jump to Home stack settings through root tabs.
    let root = navigation;
    while (root?.getParent?.()) {
      root = root.getParent();
    }
    if (hasRoute(root, 'MainTabs')) {
      root.navigate('MainTabs', {
        screen: 'Home',
        params: { screen: 'SettingsScreen' },
      });
      return true;
    }

    return false;
  }, [hasRoute, navigation]);

  const handleNotificationPress = () => {
    markNotificationsSeen().catch(() => {});
    setUnreadCount(0);
    if (typeof onNotificationPress === 'function') {
      onNotificationPress();
      return;
    }
    navigation.navigate('NotificationCenter');
  };

  const handleSOSPress = () => {
    if (typeof onSOSPress === 'function') {
      onSOSPress();
      return;
    }
    navigation.navigate('SOSFullScreen');
  };

  const handleSettingsPress = () => {
    if (typeof onSettingsPress === 'function') {
      onSettingsPress();
      return;
    }
    navigateToSettings();
  };

  return (
    <View style={[styles.row, { paddingHorizontal: spacing[2], paddingVertical: spacing[1] }]}>
      <View style={styles.left}>
        {leftSlot ? <View style={styles.leftSlot}>{leftSlot}</View> : null}
        <View style={styles.titleBlock}>
          <Text
            style={[
              typography.h1,
              { color: colors.textPrimary },
              isMultilineTitle ? { fontSize: 24, fontWeight: '700', lineHeight: 28 } : null,
              titleTextStyle,
            ]}
          >
            {resolvedTitle}
          </Text>
          {subtitle ? (
            <Text
              style={[
                typography.caption,
                { color: colors.textSecondary, marginTop: spacing[0] },
                subtitleTextStyle,
              ]}
            >
              {tx(subtitle)}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.right}>
        {showNotificationButton ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleNotificationPress}
            style={[
              styles.iconButton,
              {
                borderRadius: radius.pill,
                borderColor: colors.border,
                backgroundColor: colors.surface,
                minHeight: spacing[6],
                minWidth: spacing[6],
              },
            ]}
          >
            <NotificationIcon width={18} height={18} color={colors.icon} />
            {unreadCount > 0 ? (
              <View style={styles.badgeDot}>
                <Text style={[styles.badgeText, typography.caption]}>
                  {unreadCount > 99 ? '99+' : String(unreadCount)}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ) : null}
        {showSettingsButton ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleSettingsPress}
            style={[
              styles.iconButton,
              {
                borderRadius: radius.pill,
                borderColor: colors.border,
                backgroundColor: colors.surface,
                minHeight: spacing[6],
                minWidth: spacing[6],
              },
            ]}
          >
            <Text style={[typography.label, { color: colors.icon, fontWeight: '800' }]}>⚙</Text>
          </TouchableOpacity>
        ) : null}
        {showSOSButton ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleSOSPress}
            style={[
              styles.iconButton,
              {
                borderRadius: radius.pill,
                borderColor: colors.critical,
                backgroundColor: colors.critical,
                minHeight: spacing[6],
                minWidth: spacing[6],
              },
            ]}
          >
            <Text style={[typography.caption, { color: colors.textOnColor, fontWeight: '800' }]}>
              SOS
            </Text>
          </TouchableOpacity>
        ) : null}
        {rightSlot}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  leftSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    right: -4,
    top: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
});

export default AppHeader;
