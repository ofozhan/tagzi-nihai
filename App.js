import React, { useEffect, useCallback } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { Platform, View, Text, StyleSheet, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import TodayScreen from './screens/TodayScreen';
import HistoryScreen from './screens/HistoryScreen';
import DayDetailScreen from './screens/DayDetailScreen';
import { lightColors, darkColors } from './theme';

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function LogoTitle() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Ionicons name="car-sport" size={28} color={colors.green} />
      <Text style={[styles.logoText, { color: colors.text }]}>tagzi</Text>
    </View>
  );
}

function HistoryStack() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.header, shadowOpacity: 0, elevation: 0 },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: 'Poppins-Bold' },
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen name="HistoryList" component={HistoryScreen} options={{ headerShown: false }} />
      <Stack.Screen name="DayDetail" component={DayDetailScreen} options={{ title: 'Gün Detayı' }} />
    </Stack.Navigator>
  );
}

export default function App() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;

  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Regular': require('./assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
  });

  useEffect(() => {
    // ... bildirim kodu ...
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  const navTheme = {
    ...(colorScheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(colorScheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.separator,
    },
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} onLayout={onLayoutRootView}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <NavigationContainer theme={navTheme}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarShowLabel: false,
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              if (route.name === 'Bugün') { iconName = focused ? 'today' : 'today-outline'; } 
              else if (route.name === 'Geçmiş') { iconName = focused ? 'calendar' : 'calendar-outline'; }
              return (
                <View style={styles.tabIconContainer}>
                  <Ionicons name={iconName} size={24} color={color} />
                  <Text style={[{ color: color }, styles.tabIconText]}>{route.name}</Text>
                </View>
              );
            },
            tabBarActiveTintColor: colors.green,
            tabBarInactiveTintColor: 'gray',
            tabBarStyle: { backgroundColor: colors.tabBar, borderTopColor: colors.separator },
            headerStyle: { backgroundColor: colors.header, height: 110, shadowOpacity: 0, elevation: 0 },
            headerTitleAlign: 'center',
          })}
        >
          <Tab.Screen name="Bugün" component={TodayScreen} options={{ headerTitle: () => <LogoTitle /> }} />
          <Tab.Screen name="Geçmiş" component={HistoryStack} options={{ headerTitle: 'Geçmiş Kayıtlar', headerTitleStyle: { fontFamily: 'Poppins-Bold', color: colors.text } }} />
        </Tab.Navigator>
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, },
  logoText: { fontSize: 32, fontFamily: 'Poppins-Bold' },
  tabIconContainer: { alignItems: 'center', justifyContent: 'center', gap: 2, },
  tabIconText: { fontSize: 10, fontFamily: 'Poppins-Regular' },
});