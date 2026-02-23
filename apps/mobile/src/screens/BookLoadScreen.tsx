import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { bookingsApi } from '../lib/api';

type Props = {
  navigation: NativeStackNavigationProp<{ ShipperHome: undefined; BookLoad: undefined }, 'BookLoad'>;
};

export default function BookLoadScreen({ navigation }: Props) {
  const [pickup, setPickup] = useState({ line1: '', city: '' });
  const [dropoff, setDropoff] = useState({ line1: '', city: '' });
  const [declaredValue, setDeclaredValue] = useState('5000');
  const [loading, setLoading] = useState(false);

  const handleBook = async () => {
    setLoading(true);
    try {
      await bookingsApi.create({
        pickup: { ...pickup, country: 'ZA' },
        dropoff: { ...dropoff, country: 'ZA' },
        items: [
          {
            type: 'general',
            weightKg: 50,
            lengthCm: 100,
            widthCm: 80,
            heightCm: 60,
            declaredValueZar: Number(declaredValue) || 5000,
          },
        ],
        declaredValueZar: Number(declaredValue) || 5000,
        routeType: 'urban',
      });
      navigation.navigate('ShipperHome');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Pickup</Text>
      <TextInput
        style={styles.input}
        placeholder="Address"
        value={pickup.line1}
        onChangeText={(t) => setPickup((p) => ({ ...p, line1: t }))}
      />
      <TextInput
        style={styles.input}
        placeholder="City"
        value={pickup.city}
        onChangeText={(t) => setPickup((p) => ({ ...p, city: t }))}
      />
      <Text style={styles.label}>Delivery</Text>
      <TextInput
        style={styles.input}
        placeholder="Address"
        value={dropoff.line1}
        onChangeText={(t) => setDropoff((d) => ({ ...d, line1: t }))}
      />
      <TextInput
        style={styles.input}
        placeholder="City"
        value={dropoff.city}
        onChangeText={(t) => setDropoff((d) => ({ ...d, city: t }))}
      />
      <Text style={styles.label}>Declared value (ZAR)</Text>
      <TextInput
        style={styles.input}
        placeholder="5000"
        value={declaredValue}
        onChangeText={setDeclaredValue}
        keyboardType="numeric"
      />
      <TouchableOpacity style={styles.button} onPress={handleBook} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Booking...' : 'Get quote & book'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  label: { fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, marginBottom: 12 },
  button: { backgroundColor: '#0f766e', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontWeight: '600' },
});
