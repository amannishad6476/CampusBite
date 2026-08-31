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
import ShopSetupScreen from '../screens/shop/ShopSetupScreen';
import MenuManagementScreen from '../screens/menu/MenuManagementScreen';
import OrdersListScreen from '../screens/orders/OrdersListScreen';
import OrderDetailScreen from '../screens/orders/OrderDetailScreen';
import EarningsScreen from '../screens/earnings/EarningsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const OrdersStack = createStackNavigator();

function OrdersStackNavigator() {
  return (
    <OrdersStack.Navigator>
      <OrdersStack.Screen
        name="OrdersList"
        component={OrdersListScreen}
        options={{ headerShown: false }}
      />
      <OrdersStack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: 'Order Details', headerBackTitleVisible: false }}
      />
    </OrdersStack.Navigator>
  );
}

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'DashboardTab') {
            iconName = 'grid';
          } else if (route.name === 'OrdersTab') {
            iconName = 'receipt';
          } else if (route.name === 'MenuTab') {
            iconName = 'restaurant';
          } else if (route.name === 'EarningsTab') {
            iconName = 'cash';
          } else if (route.name === 'ShopTab') {
            iconName = 'settings';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF5722', // Branding Orange
        tabBarInactiveTintColor: '#757575',
        tabBarStyle: {
          paddingBottom: 5,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersStackNavigator}
        options={{ tabBarLabel: 'Orders' }}
      />
      <Tab.Screen
        name="MenuTab"
        component={MenuManagementScreen}
        options={{ tabBarLabel: 'Menu Management', headerShown: true, title: 'Menu Catalog' }}
      />
      <Tab.Screen
        name="EarningsTab"
        component={EarningsScreen}
        options={{ tabBarLabel: 'Earnings', headerShown: true, title: 'Earnings & Commissions' }}
      />
      <Tab.Screen
        name="ShopTab"
        component={ShopSetupScreen}
        options={{ tabBarLabel: 'Shop Profile', headerShown: true, title: 'Canteen Configuration' }}
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
        <Stack.Screen name="Main" component={MainTabNavigator} />
      )}
    </Stack.Navigator>
  );
}
