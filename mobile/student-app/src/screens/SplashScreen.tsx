import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.title}>CampusBite</Text>
        <Text style={styles.subtitle}>Delicious Meals Delivered to your Class or Room</Text>
      </View>
      <ActivityIndicator size="large" color="#ffffff" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF5722', // CampusBite Orange
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffe0b2',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
  loader: {
    marginTop: 40,
  },
});
