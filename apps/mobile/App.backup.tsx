import "./global.css";
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';
import { Newsreader_400Regular, Newsreader_400Regular_Italic } from '@expo-google-fonts/newsreader';

import HomeScreen from './src/screens/HomeScreen';
import ProductDetailsScreen from './src/screens/ProductDetailsScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import AdminReviewsScreen from './src/screens/AdminReviewsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import LoginScreen from './src/screens/LoginScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import OrderConfirmationScreen from './src/screens/OrderConfirmationScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import NotificationPreferencesScreen from './src/screens/NotificationPreferencesScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import OrderDetailScreen from './src/screens/OrderDetailScreen';
import NewReturnScreen from './src/screens/NewReturnScreen';
import AdminOrderDetailScreen from './src/screens/AdminOrderDetailScreen';
import { CartProvider } from './src/context/CartContext';
import { FavoritesProvider } from './src/context/FavoritesContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PushNotificationManager } from './src/components/PushNotificationManager';
import { I18nextProvider } from 'react-i18next';
import i18n from './src/i18n';

import { supabase } from './src/lib/supabase';
import * as Linking from 'expo-linking';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const SearchScreen = () => <View className="flex-1 bg-background-dark" />;

import { useTranslation } from 'react-i18next';

// Customer-facing bottom tabs (Home, Search, Favorites, Profile)
function CustomerTabs() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#181611',
          borderTopColor: 'rgba(255,255,255,0.05)',
          paddingTop: 4,
          height: 60,
        },
        tabBarActiveTintColor: '#f4c025',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: t('home'),
          tabBarIcon: ({ color, size }) => <MaterialIcons name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarLabel: t('search'),
          tabBarIcon: ({ color, size }) => <MaterialIcons name="search" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          tabBarLabel: t('favorites'),
          tabBarIcon: ({ color, size }) => <MaterialIcons name="favorite" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: t('profile'),
          tabBarIcon: ({ color, size }) => <MaterialIcons name="person" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

import { AuthProvider, QueryProvider } from '@lessence/supabase';

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    Newsreader_400Regular,
    Newsreader_400Regular_Italic,
  });

  if (!fontsLoaded) {
    return (
      <View className="flex-1 bg-background-dark items-center justify-center">
        <ActivityIndicator color="#f4c025" size="large" />
      </View>
    );
  }

  const prefix = Linking.createURL('/');
  
  const linking = {
    prefixes: [prefix],
    config: {
      screens: {
        Main: {
          path: '',
          screens: {
            Home: 'home',
            Search: 'search',
            Favorites: 'favorites',
            Profile: 'profile',
          },
        },
        ProductDetails: 'product/:id',
        AdminDashboard: 'admin',
        AdminReviews: 'admin/reviews',
        Checkout: 'checkout',
        OrderConfirmation: 'checkout-success/:session_id',
        NotificationPreferences: 'profile/notifications',
      },
    },
  };

  return (
    <I18nextProvider i18n={i18n}>
      <SafeAreaProvider>
        <QueryProvider>
          <AuthProvider supabase={supabase}>
            <PushNotificationManager />
            <FavoritesProvider>
              <CartProvider>
                <StatusBar style="light" />
                <NavigationContainer linking={linking}>
                  <Stack.Navigator screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="Main" component={CustomerTabs} />
                    <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
                    <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
                    <Stack.Screen name="AdminReviews" component={AdminReviewsScreen} />
                    <Stack.Screen name="Checkout" component={CheckoutScreen} />
                    <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />
                    <Stack.Screen name="Notifications" component={NotificationsScreen} />
                    <Stack.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} />
                    <Stack.Screen name="Orders" component={OrdersScreen} />
                    <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
                    <Stack.Screen name="NewReturn" component={NewReturnScreen} />
                    <Stack.Screen name="AdminOrderDetail" component={AdminOrderDetailScreen} />
                  </Stack.Navigator>
                </NavigationContainer>
              </CartProvider>
            </FavoritesProvider>
          </AuthProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </I18nextProvider>
  );
}
