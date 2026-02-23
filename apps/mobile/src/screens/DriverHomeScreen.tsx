import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { bookingsApi } from '../lib/api';

type Booking = {
  id: string;
  reference: string;
  status: string;
  driverEarningsZar: string | number;
  pickupAddress?: { line1: string; city: string };
  dropoffAddress?: { line1: string; city: string };
};

export default function DriverHomeScreen() {
  const { user } = useAuth();
  const [myJobs, setMyJobs] = useState<Booking[]>([]);
  const [available, setAvailable] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([bookingsApi.list(), bookingsApi.listAvailable()])
      .then(([mine, avail]) => {
        setMyJobs((mine as Booking[]).filter((b) => b.reference));
        setAvailable(avail as Booking[]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const acceptJob = async (id: string) => {
    try {
      await bookingsApi.accept(id);
      const [mine, avail] = await Promise.all([bookingsApi.list(), bookingsApi.listAvailable()]);
      setMyJobs((mine as Booking[]).filter((b) => b.reference));
      setAvailable(avail as Booking[]);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not accept');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.trust}>Trust: {user?.trustScore?.toFixed(1) ?? '-'}</Text>
      <Text style={styles.section}>My jobs</Text>
      {loading ? (
        <Text style={styles.muted}>Loading...</Text>
      ) : (
        <>
          {myJobs.map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.ref}>{item.reference}</Text>
              <Text style={styles.route}>{item.pickupAddress?.city} to {item.dropoffAddress?.city}</Text>
              <Text style={styles.amount}>R {Number(item.driverEarningsZar).toFixed(2)}</Text>
            </View>
          ))}
          <Text style={[styles.section, { marginTop: 16 }]}>Available</Text>
          {available.map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.ref}>{item.reference}</Text>
              <Text style={styles.route}>{item.pickupAddress?.city} to {item.dropoffAddress?.city}</Text>
              <Text style={styles.amount}>R {Number(item.driverEarningsZar).toFixed(2)}</Text>
              <TouchableOpacity style={styles.acceptBtn} onPress={() => acceptJob(item.id)}>
                <Text style={styles.acceptBtnText}>Accept</Text>
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  trust: { fontSize: 16, marginBottom: 16, color: '#0f766e' },
  section: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  muted: { color: '#64748b', marginBottom: 12 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  ref: { fontWeight: '600' },
  route: { fontSize: 12, color: '#64748b', marginTop: 4 },
  amount: { fontSize: 14, fontWeight: '600', color: '#0f766e', marginTop: 4 },
  acceptBtn: { backgroundColor: '#0f766e', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  acceptBtnText: { color: '#fff', fontWeight: '600' },
});
