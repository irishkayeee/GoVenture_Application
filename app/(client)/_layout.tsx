/**
 * app/(client)/_layout.tsx
 * Logged-in customer screens.
 */

import { Stack } from 'expo-router';

export default function ClientLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="client-dashboard" />
    </Stack>
  );
}
