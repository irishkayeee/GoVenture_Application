/**
 * Copyright.tsx
 * Shared footer copyright line, reused across the landing page and every
 * app screen so the notice stays consistent in one place.
 */

import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';

type CopyrightProps = {
  color?: string;
  style?: TextStyle;
};

export default function Copyright({ color = 'rgba(59,26,12,0.45)', style }: CopyrightProps) {
  return (
    <Text style={[s.text, { color }, style]}>
      © 2026 GoVenture Travel & Tours. All Rights Reserved.
    </Text>
  );
}

const s = StyleSheet.create({
  text: { fontSize: 9, textAlign: 'center', marginTop: 18, marginBottom: 4 },
});
