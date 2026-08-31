import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';

// Import Icons
import { Ionicons } from '@expo/vector-icons';

// Import Screens
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/home/HomeScreen';
import ShopMenuScreen from '../screens/shops/ShopMenuScreen';
import CartScreen from '../screens/cart/CartScreen';
import CheckoutScreen from '../screens/checkout/CheckoutScreen';
import OrdersScreen from '../screens/orders/OrdersScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="Feed"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="ShopMenu"
        component={ShopMenuScreen}
        options={({ route }: any) => ({
          title: route.params?.shopName || 'Canteen Menu',
          headerBackTitleVisible: false,
        })}
      />
      <HomeStack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ title: 'Checkout Details', headerBackTitleVisible: false }}
      />
    </HomeStack.Navigator>
  );
}

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'HomeTab') {
            iconName = 'restaurant';
          } else if (route.name === 'CartTab') {
            iconName = 'cart';
          } else if (route.name === 'OrdersTab') {
            iconName = 'receipt';
          } else if (route.name === 'ProfileTab') {
            iconName = 'person';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF5722', // Orange branding
        tabBarInactiveTintColor: '#757575',
        tabBarStyle: {
          paddingBottom: 5,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{ tabBarLabel: 'Browse' }}
      />
      <Tab.Screen
        name="CartTab"
        component={CartScreen}
        options={{ tabBarLabel: 'Cart', headerShown: true, title: 'My Cart' }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersScreen}
        options={{ tabBarLabel: 'Orders', headerShown: true, title: 'Order History' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile', headerShown: true, title: 'My Profile' }}
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
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <Stack.Screen name="App" component={MainTabNavigator} />
      )}
    </Stack.Navigator>
  );
}
