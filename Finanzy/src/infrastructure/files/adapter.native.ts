import { Directory, File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { AppError } from '../../domain/core';
import { ExportFile, ExportFileAdapter } from '../../features/exports/export-service';

const directory = () => new Directory(Paths.cache, 'finanzy-exports');

async function ensureDirectory() {
  const target = directory();
  if (!target.exists) target.create({ intermediates: true, idempotent: true });
  return target;
}

export const exportFileAdapter: ExportFileAdapter = {
  async saveCsv(name, content) {
    const file = new File(await ensureDirectory(), name);
    file.create({ overwrite: true, intermediates: true });
    await file.write(content);
    return { uri: file.uri, name, mimeType: 'text/csv' };
  },
  async savePdf(name, html) {
    const result = await Print.printToFileAsync({ html });
    const source = new File(result.uri);
    const target = new File(await ensureDirectory(), name);
    if (target.exists) target.delete();
    source.move(target);
    return { uri: target.uri, name, mimeType: 'application/pdf' };
  },
  async share(file: ExportFile) {
    if (!await Sharing.isAvailableAsync()) throw new AppError('UNSUPPORTED_PLATFORM', 'Compartilhamento não disponível neste aparelho.');
    await Sharing.shareAsync(file.uri, { mimeType: file.mimeType, dialogTitle: file.name });
  },
  async cleanupAll() {
    const target = directory();
    if (target.exists) target.delete();
  },
};
