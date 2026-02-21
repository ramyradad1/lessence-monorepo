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
import ProfileScreen from './src/screens/ProfileScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import LoginScreen from './src/screens/LoginScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import OrderConfirmationScreen from './src/screens/OrderConfirmationScreen';
import { CartProvider } from './src/context/CartContext';
import { FavoritesProvider } from './src/context/FavoritesContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@lessence/supabase';
import { supabase } from './src/lib/supabase';
import * as Linking from 'expo-linking';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const SearchScreen = () => <View className="flex-1 bg-background-dark" />;

// Customer-facing bottom tabs (Home, Search, Favorites, Profile)
function CustomerTabs() {
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
          tabBarIcon: ({ color, size }) => <MaterialIcons name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ color, size }) => <MaterialIcons name="search" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          tabBarIcon: ({ color, size }) => <MaterialIcons name="favorite" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <MaterialIcons name="person" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

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
        Checkout: 'checkout',
        OrderConfirmation: 'checkout-success/:session_id', // Note: Deep link from WebBrowser might not perfectly hit this inside the app without proper WebBrowser.warmUpAsync() but this sets up standard linking
      },
    },
  };

  return (
    <SafeAreaProvider>
      <AuthProvider supabase={supabase}>
        <FavoritesProvider>
          <CartProvider>
            <StatusBar style="light" />
            <NavigationContainer linking={linking}>
              <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Main" component={CustomerTabs} />
                <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
                <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
                <Stack.Screen name="Checkout" component={CheckoutScreen} />
                <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />
              </Stack.Navigator>
            </NavigationContainer>
          </CartProvider>
        </FavoritesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
