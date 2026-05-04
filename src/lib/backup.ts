import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Reminder } from '../types/reminder';

const BACKUP_FILENAME = 'nomiss_backup.json';

export async function exportBackup(reminders: Reminder[]): Promise<void> {
  const json = JSON.stringify({ version: 1, exportedAt: Date.now(), reminders }, null, 2);
  const file = new File(Paths.cache, BACKUP_FILENAME);
  file.write(json);

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error('이 기기에서는 공유를 지원하지 않아요.');

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'nomiss 백업 내보내기',
  });
}

export async function importBackup(): Promise<Reminder[]> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });

  if (result.canceled) throw new Error('CANCELLED');

  const uri = result.assets[0].uri;
  const file = new File(uri);
  const raw = await file.text();
  const parsed = JSON.parse(raw);

  if (!parsed.reminders || !Array.isArray(parsed.reminders)) {
    throw new Error('올바른 nomiss 백업 파일이 아니에요.');
  }

  return parsed.reminders as Reminder[];
}
