import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as SecureStore from 'expo-secure-store';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import PasswordModalScreen from '../screens/PasswordModalScreen';
import PasswordHistoryScreen from '../screens/PasswordHistoryScreen';

const RootStack = createStackNavigator();
const MainStack = createStackNavigator();

const AuthLoadingScreen = ({ navigation }) => {
  useEffect(() => {
    const checkToken = async () => {
      const token = await SecureStore.getItemAsync('token');
      navigation.replace(token ? 'Main' : 'Login');
    };

    checkToken();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator />
    </View>
  );
};

const MainStackNavigator = () => (
  <MainStack.Navigator initialRouteName="AuthLoading">
    <MainStack.Screen name="AuthLoading" component={AuthLoadingScreen} options={{ headerShown: false }} />
    <MainStack.Screen name="Login" component={LoginScreen} />
    <MainStack.Screen name="Register" component={RegisterScreen} />
    <MainStack.Screen name="Home" component={HomeScreen} />
  </MainStack.Navigator>
);


const AppNavigator = () => {
  return (
    <NavigationContainer>
      <RootStack.Navigator mode="modal">
        <RootStack.Screen name="Main" component={MainStackNavigator} options={{ headerShown: false }} />
        <RootStack.Screen name="PasswordModal" component={PasswordModalScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="PasswordHistory" component={PasswordHistoryScreen} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
