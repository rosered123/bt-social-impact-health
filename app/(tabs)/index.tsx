import { Redirect } from 'expo-router';

import { useAuth } from '@/providers/auth-provider';

export default function Index() {
  const { role } = useAuth();
  return <Redirect href={role === 'business' ? '/dashboard' : '/explore'} />;
}
