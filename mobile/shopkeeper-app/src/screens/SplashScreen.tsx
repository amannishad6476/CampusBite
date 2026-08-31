import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>CampusBite</Text>
      <Text style={styles.subtitle}>Canteen Partner Portal</Text>
      <ActivityIndicator size="large" color="#ffffff" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF5722', // Brand Orange
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
    color: '#ffe0b2',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  loader: {
    marginTop: 40,
  },
});
