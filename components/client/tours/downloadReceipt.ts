/**
 * downloadReceipt.ts
 * Renders a receipt HTML template to a real PDF (via expo-print) and saves
 * it as an actual file instead of just opening a text-share dialog.
 *
 * - Android: uses the Storage Access Framework to write straight into a
 *   folder the user picks once (defaults to Downloads) — the directory URI
 *   is persisted, so every receipt after the first is saved completely
 *   silently, no dialog at all.
 * - iOS: the generated PDF is copied into the app's Documents directory
 *   (Paths.document), which — combined with UIFileSharingEnabled/
 *   LSSupportsOpeningDocumentsInPlace in app.json — makes it show up
 *   automatically in the Files app under "On My iPhone". That Info.plist
 *   config only takes effect in a real build (dev client / EAS build), not
 *   in Expo Go, so this also opens the share sheet there as a fallback so
 *   the file is still reachable today.
 */

import { Platform } from 'react-native';
import * as Print from 'expo-print';
import { File, Paths } from 'expo-file-system';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ANDROID_DOWNLOAD_DIR_KEY = 'goventure_receipt_download_dir_uri';

export type DownloadReceiptResult =
  | { ok: true; silent: boolean }
  | { ok: false; message: string };

/** `filename` should be the display name without an extension, e.g. "GoVenture-Receipt-GV-2026-01234". */
export async function downloadReceiptPdf(filename: string, html: string): Promise<DownloadReceiptResult> {
  const baseName = filename.replace(/\.[^.]+$/, '');
  const { uri, base64 } = await Print.printToFileAsync({ html, base64: Platform.OS === 'android' });

  if (Platform.OS === 'android') {
    return downloadOnAndroid(baseName, base64 ?? '', uri, 'application/pdf', 'pdf');
  }
  return downloadOnIos(baseName, uri, 'application/pdf', 'pdf');
}

/**
 * Downloads an already-hosted image (e.g. a passport/valid-ID scan saved via
 * client_travel_documents_update) and saves it using the same SAF/Sharing
 * pipeline as receipts, so passport/ID downloads behave identically to every
 * other "Download" button in the app. `filename` should be the display name
 * without an extension.
 */
export async function downloadImageFromUrl(filename: string, imageUrl: string): Promise<DownloadReceiptResult> {
  const baseName = filename.replace(/\.[^.]+$/, '');
  const extMatch = imageUrl.match(/\.(jpe?g|png|webp)(\?|$)/i);
  const extension = (extMatch ? extMatch[1].toLowerCase() : 'jpg').replace('jpeg', 'jpg');
  const mimeType = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';

  const localUri = `${FileSystemLegacy.cacheDirectory}${baseName}-${Date.now()}.${extension}`;
  const download = await FileSystemLegacy.downloadAsync(imageUrl, localUri);

  if (Platform.OS === 'android') {
    const base64 = await FileSystemLegacy.readAsStringAsync(download.uri, { encoding: 'base64' });
    return downloadOnAndroid(baseName, base64, download.uri, mimeType, extension);
  }
  return downloadOnIos(baseName, download.uri, mimeType, extension);
}

async function downloadOnAndroid(baseName: string, base64: string, sourceUri: string, mimeType: string, extension: string): Promise<DownloadReceiptResult> {
  const { StorageAccessFramework } = FileSystemLegacy;

  try {
    let dirUri = await AsyncStorage.getItem(ANDROID_DOWNLOAD_DIR_KEY);

    if (!dirUri) {
      const permission = await StorageAccessFramework.requestDirectoryPermissionsAsync(
        StorageAccessFramework.getUriForDirectoryInRoot('Download')
      );
      if (!permission.granted) {
        return shareFallback(sourceUri, baseName, mimeType, extension);
      }
      dirUri = permission.directoryUri;
      await AsyncStorage.setItem(ANDROID_DOWNLOAD_DIR_KEY, dirUri);
    }

    const fileUri = await StorageAccessFramework.createFileAsync(dirUri, baseName, mimeType);
    await StorageAccessFramework.writeAsStringAsync(fileUri, base64, { encoding: 'base64' });
    return { ok: true, silent: true };
  } catch {
    // The saved folder permission may have been revoked — forget it and retry once via the picker.
    await AsyncStorage.removeItem(ANDROID_DOWNLOAD_DIR_KEY);
    return shareFallback(sourceUri, baseName, mimeType, extension);
  }
}

async function downloadOnIos(baseName: string, sourceUri: string, mimeType: string, extension: string): Promise<DownloadReceiptResult> {
  const dest = new File(Paths.document, `${baseName}.${extension}`);
  if (dest.exists) dest.delete();
  new File(sourceUri).copy(dest);

  // In Expo Go, app.json's Info.plist flags don't apply, so the file isn't
  // reachable from the Files app without going through the share sheet.
  const available = await Sharing.isAvailableAsync();
  if (available) {
    await Sharing.shareAsync(dest.uri, { mimeType, dialogTitle: `${baseName}.${extension}` });
    return { ok: true, silent: false };
  }
  return { ok: true, silent: true };
}

async function shareFallback(sourceUri: string, baseName: string, mimeType: string, extension: string): Promise<DownloadReceiptResult> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    return { ok: false, message: 'No folder was selected, and sharing is unavailable on this device.' };
  }
  await Sharing.shareAsync(sourceUri, { mimeType, dialogTitle: `${baseName}.${extension}` });
  return { ok: true, silent: false };
}
