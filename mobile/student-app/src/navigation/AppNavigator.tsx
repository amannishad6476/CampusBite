import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { View, Text, StyleSheet } from 'react-native';

// Import Screens
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import CampusSelectScreen from '../screens/campus/CampusSelectScreen';
import HomeScreen from '../screens/home/HomeScreen';
import ShopMenuScreen from '../screens/shops/ShopMenuScreen';
import CartScreen from '../screens/cart/CartScreen';
import CheckoutScreen from '../screens/checkout/CheckoutScreen';
import OrderConfirmationScreen from '../screens/orders/OrderConfirmationScreen';
import OrderTrackingScreen from '../screens/orders/OrderTrackingScreen';
import OrdersScreen from '../screens/orders/OrdersScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const RootStack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TabBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
}

function MainTabNavigator() {
  const { cartCount } = useCart();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'restaurant';

          if (route.name === 'HomeTab') {
            iconName = 'restaurant';
          } else if (route.name === 'OrdersTab') {
            iconName = 'receipt';
          } else if (route.name === 'CartTab') {
            iconName = 'cart';
          } else if (route.name === 'ProfileTab') {
            iconName = 'person';
          }

          return (
            <View style={{ width: 28, height: 28, justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name={iconName} size={size} color={color} />
              {route.name === 'CartTab' && <TabBadge count={cartCount} />}
            </View>
          );
        },
        tabBarActiveTintColor: '#FF5722',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          paddingBottom: 6,
          paddingTop: 6,
          height: 62,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ tabBarLabel: 'Canteens' }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersScreen}
        options={{ tabBarLabel: 'My Orders' }}
      />
      <Tab.Screen
        name="CartTab"
        component={CartScreen}
        options={{ tabBarLabel: 'Cart' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, isLoading, hasCompletedOnboarding } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {user === null ? (
        <>
          {!hasCompletedOnboarding && (
            <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
          )}
          <RootStack.Screen name="Login" component={LoginScreen} />
          <RootStack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          <RootStack.Screen name="App" component={MainTabNavigator} />
          <RootStack.Screen name="ShopMenu" component={ShopMenuScreen} />
          <RootStack.Screen name="Checkout" component={CheckoutScreen} />
          <RootStack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />
          <RootStack.Screen name="OrderTracking" component={OrderTrackingScreen} />
          <RootStack.Screen name="CampusSelect" component={CampusSelectScreen} />
          <RootStack.Screen name="Notifications" component={NotificationsScreen} />
        </>
      )}
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -3,
    right: -6,
    backgroundColor: '#FF5722',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
});
