import { Redirect } from 'expo-router';
import { useSession } from '../features/session/use-session';
import { SplashScreen } from '../screens/SplashScreen';

export default function Index() {
  const session = useSession();
  const destination = session.data?.profile && session.data.isSessionActive ? 'home' : session.data ? 'onboarding' : null;

  if (!destination) {
    return <SplashScreen />;
  }

  return <Redirect href={destination === 'home' ? '/home' : '/onboarding'} />;
}
