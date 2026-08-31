import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>CampusBite</Text>
      <Text style={styles.subtitle}>Delivery Partner Portal</Text>
      <ActivityIndicator size="large" color="#ffffff" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4CAF50', // Driver portal green
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#e8f5e9',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  loader: {
    marginTop: 40,
  },
});
