import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { authApi, setAuthToken } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ navigation }: { navigation: { navigate: (n: string) => void } }) {
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'shipper' | 'driver'>('shipper');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!password || password.length < 8) {
      Alert.alert('Error', 'Password at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await authApi.register({
        email: email || undefined,
        password,
        role,
        fullName: role === 'driver' ? fullName : undefined,
      });
      setAuthToken(token);
      setUser(user);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign up</Text>
      <View style={styles.roleRow}>
        <TouchableOpacity style={[styles.roleBtn, role === 'shipper' && styles.roleBtnActive]} onPress={() => setRole('shipper')}>
          <Text style={role === 'shipper' ? styles.roleTextActive : undefined}>Shipper</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.roleBtn, role === 'driver' && styles.roleBtnActive]} onPress={() => setRole('driver')}>
          <Text style={role === 'driver' ? styles.roleTextActive : undefined}>Driver</Text>
        </TouchableOpacity>
      </View>
      {role === 'driver' && (
        <TextInput style={styles.input} placeholder="Full name" value={fullName} onChangeText={setFullName} />
      )}
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password (min 8)" value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Sign up'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Log in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, color: '#0f766e' },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  roleBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center' },
  roleBtnActive: { borderColor: '#0f766e', backgroundColor: '#ccfbf1' },
  roleTextActive: { color: '#0f766e', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, marginBottom: 12 },
  button: { backgroundColor: '#0f766e', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
  link: { color: '#0f766e', marginTop: 16, textAlign: 'center' },
});
