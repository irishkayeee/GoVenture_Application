/**
 * exportCsv.ts
 * Fetches a CSV report from the backend, writes it to the cache directory,
 * then opens the native share sheet so the admin can save/send the file.
 */

import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export async function downloadAndShareCsv(url: string, filename: string): Promise<void> {
  const res = await fetch(url);
  const text = await res.text();

  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(text);

  const available = await Sharing.isAvailableAsync();
  if (available) {
    await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: filename });
  }
}
