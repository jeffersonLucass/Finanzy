import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { getProfileName } from '../database';

export default function Index() {
  const [destination, setDestination] = useState<'onboarding' | 'home' | null>(null);

  useEffect(() => {
    getProfileName().then((name) => setDestination(name ? 'home' : 'onboarding'));
  }, []);

  if (!destination) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#10B981" />
      </View>
    );
  }

  return <Redirect href={destination === 'home' ? '/home' : '/onboarding'} />;
}
