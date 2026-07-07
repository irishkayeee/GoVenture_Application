/**
 * app/(admin)/_layout.tsx
 * Admin-facing screens (dashboard, bookings, tours, etc).
 */

import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="admin-dashboard" />
    </Stack>
  );
}
