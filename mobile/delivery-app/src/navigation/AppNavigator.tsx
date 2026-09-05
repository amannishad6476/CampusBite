import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';

// Import Icons
import { Ionicons } from '@expo/vector-icons';

// Import Screens
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import ActiveDeliveryScreen from '../screens/active/ActiveDeliveryScreen';
import HistoryScreen from '../screens/history/HistoryScreen';
import EarningsScreen from '../screens/earnings/EarningsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Dashboard') {
            iconName = 'speedometer';
          } else if (route.name === 'Active') {
            iconName = 'bicycle';
          } else if (route.name === 'History') {
            iconName = 'time';
          } else if (route.name === 'Earnings') {
            iconName = 'wallet';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4CAF50', // Branding Green for drivers/delivery
        tabBarInactiveTintColor: '#757575',
        tabBarStyle: {
          paddingBottom: 5,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={({ navigation }) => ({
          tabBarLabel: 'Dashboard',
          headerShown: true,
          title: 'Rider Dashboard',
          headerRight: () => (
            <Ionicons
              name="notifications-outline"
              size={24}
              color="#4CAF50"
              style={{ marginRight: 16 }}
              onPress={() => navigation.navigate('Notifications')}
            />
          ),
        })}
      />
      <Tab.Screen
        name="Active"
        component={ActiveDeliveryScreen}
        options={{ tabBarLabel: 'Active Delivery', headerShown: true, title: 'Current Route' }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ tabBarLabel: 'History', headerShown: true, title: 'Delivery History' }}
      />
      <Tab.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{ tabBarLabel: 'Earnings', headerShown: true, title: 'My Payouts' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile', headerShown: true, title: 'Rider Profile' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user === null ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{
              headerShown: true,
              title: 'Notifications',
              headerTintColor: '#4CAF50',
              headerTitleStyle: { color: '#212121' },
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

