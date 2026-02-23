import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ShipperHomeScreen from './src/screens/ShipperHomeScreen';
import DriverHomeScreen from './src/screens/DriverHomeScreen';
import BookLoadScreen from './src/screens/BookLoadScreen';

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return (
    <Stack.Navigator screenOptions={{ headerTitle: 'FREX', headerTintColor: '#0f766e' }}>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : user.role === 'shipper' ? (
        <>
          <Stack.Screen name="ShipperHome" component={ShipperHomeScreen} />
          <Stack.Screen name="BookLoad" component={BookLoadScreen} />
        </>
      ) : (
        <Stack.Screen name="DriverHome" component={DriverHomeScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
