import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as SecureStore from 'expo-secure-store';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import NotesListScreen from '../screens/NotesListScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PasswordModalScreen from '../screens/PasswordModalScreen';
import PasswordHistoryScreen from '../screens/PasswordHistoryScreen';
import NoteDetailScreen from '../screens/NoteDetailScreen';
import TwoFASetupScreen from '../screens/TwoFASetupScreen';
import TwoFALoginScreen from '../screens/TwoFALoginScreen';

const RootStack = createStackNavigator();
const MainStack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AuthLoadingScreen = ({ navigation }) => {
  useEffect(() => {
    const checkToken = async () => {
      const token = await SecureStore.getItemAsync('token');
      navigation.replace(token ? 'MainApp' : 'Login');
    };

    checkToken();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator />
    </View>
  );
};

const TabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textSecondary,
                tabBarStyle: { backgroundColor: COLORS.surface },
                tabBarLabelStyle: { ...FONTS.caption, fontSize: 10 },
                headerStyle: { backgroundColor: COLORS.surface },
                headerTitleStyle: { ...FONTS.h2, color: COLORS.textPrimary },
            }}
        >
            <Tab.Screen name="Passwords" component={HomeScreen} />
            <Tab.Screen name="Secure Notes" component={NotesListScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
    );
}

const MainStackNavigator = () => (
  <MainStack.Navigator initialRouteName="AuthLoading">
    <MainStack.Screen name="AuthLoading" component={AuthLoadingScreen} options={{ headerShown: false }} />
    <MainStack.Screen name="Login" component={LoginScreen} />
    <MainStack.Screen name="Register" component={RegisterScreen} />
    <MainStack.Screen name="MainApp" component={TabNavigator} options={{ headerShown: false }} />
    <MainStack.Screen name="TwoFASetup" component={TwoFASetupScreen} />
    <MainStack.Screen name="TwoFALogin" component={TwoFALoginScreen} />
  </MainStack.Navigator>
);


const AppNavigator = () => {
  return (
    <NavigationContainer>
      <RootStack.Navigator mode="modal">
        <RootStack.Screen name="Main" component={MainStackNavigator} options={{ headerShown: false }} />
        <RootStack.Screen name="PasswordModal" component={PasswordModalScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="PasswordHistory" component={PasswordHistoryScreen} />
        <RootStack.Screen name="NoteDetail" component={NoteDetailScreen} options={{ headerShown: false }} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
