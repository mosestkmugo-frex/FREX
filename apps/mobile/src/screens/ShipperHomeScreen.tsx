import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { bookingsApi } from '../lib/api';

type Booking = {
  id: string;
  reference: string;
  status: string;
  totalAmountZar: string | number;
  pickupAddress?: { line1: string; city: string };
  dropoffAddress?: { line1: string; city: string };
};

type Props = {
  navigation: NativeStackNavigationProp<{ ShipperHome: undefined; BookLoad: undefined }, 'ShipperHome'>;
};

export default function ShipperHomeScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingsApi
      .list()
      .then((data) => setBookings((data as Booking[]).filter((b) => b.reference)))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.trust}>Trust score: {user?.trustScore?.toFixed(1) ?? '—'}</Text>
      <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('BookLoad')}>
        <Text style={styles.primaryButtonText}>Book load</Text>
      </TouchableOpacity>
      <Text style={styles.section}>Your deliveries</Text>
      {loading ? (
        <Text style={styles.muted}>Loading...</Text>
      ) : bookings.length === 0 ? (
        <Text style={styles.muted}>No bookings yet.</Text>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.ref}>{item.reference}</Text>
              <Text style={styles.route}>
                {item.pickupAddress?.line1}, {item.pickupAddress?.city} → {item.dropoffAddress?.line1},{' '}
                {item.dropoffAddress?.city}
              </Text>
              <Text style={styles.status}>{item.status}</Text>
              <Text style={styles.amount}>
                R {typeof item.totalAmountZar === 'string' ? item.totalAmountZar : Number(item.totalAmountZar).toFixed(2)}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  trust: { fontSize: 16, marginBottom: 16, color: '#0f766e' },
  primaryButton: { backgroundColor: '#0f766e', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 24 },
  primaryButtonText: { color: '#fff', fontWeight: '600' },
  section: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  muted: { color: '#64748b', marginBottom: 12 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  ref: { fontWeight: '600' },
  route: { fontSize: 12, color: '#64748b', marginTop: 4 },
  status: { fontSize: 12, marginTop: 4 },
  amount: { fontSize: 14, fontWeight: '600', color: '#0f766e', marginTop: 4 },
});
