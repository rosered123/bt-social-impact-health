import { Redirect } from 'expo-router';

import { useAuth } from '@/providers/auth-provider';

export default function HomeScreen() {
    const { session, role, loading } = useAuth();
    if (loading) return null;
    if (!session) return <Redirect href="/auth" />;
    return <Redirect href={role === 'business' ? '/dashboard' : '/explore'} />;
}
