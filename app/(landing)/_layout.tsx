/**
 * app/(landing)/_layout.tsx
 * Entry flow: splash screen -> onboarding carousel -> login/sign up.
 */

import { Stack } from 'expo-router';

export default function LandingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
    </Stack>
  );
}
