import 'react-native-gesture-handler'; // Required for @react-navigation/stack
import React from 'react';
import { View } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';

import { AppProvider } from './src/context/AppContext';
import ScannerScreen from './src/screens/ScannerScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ManageStudentsScreen from './src/screens/ManageStudentsScreen';
import EnrollStudentScreen from './src/screens/EnrollStudentScreen';
import StudentProfileScreen from './src/screens/StudentProfileScreen';

const Stack = createStackNavigator();

// Customize theme to match the app's dark visual palette (#0F172A)
const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0F172A',
    card: '#1E293B',
    text: '#FFF',
    border: '#334155',
  },
};

export default function App() {
  return (
    <AppProvider>
      <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
        <NavigationContainer theme={CustomDarkTheme}>
          <Stack.Navigator 
            initialRouteName="Scanner"
            screenOptions={{
              headerShown: false,
              // cardStyleInterpolator explicitly provides the iOS overlapping slide on both platforms!
              cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
              cardStyle: { backgroundColor: '#0F172A' }
            }}
          >
            <Stack.Screen name="Scanner" component={ScannerScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
            <Stack.Screen name="ManageStudents" component={ManageStudentsScreen} />
            <Stack.Screen name="EnrollStudent" component={EnrollStudentScreen} />
            <Stack.Screen name="StudentProfile" component={StudentProfileScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    </AppProvider>
  );
}