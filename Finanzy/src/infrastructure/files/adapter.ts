import { AppError } from '../../domain/core';
import { ExportFile, ExportFileAdapter } from '../../features/exports/export-service';
import * as Print from 'expo-print';

const urls = new Set<string>();

export const exportFileAdapter: ExportFileAdapter = {
  async saveCsv(name, content) {
    const uri = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
    urls.add(uri);
    const anchor = document.createElement('a');
    anchor.href = uri;
    anchor.download = name;
    anchor.click();
    return { uri, name, mimeType: 'text/csv' };
  },
  async savePdf(_name, html) {
    await Print.printAsync({ html });
    return null;
  },
  async share(_file: ExportFile) {
    throw new AppError('UNSUPPORTED_PLATFORM', 'Compartilhamento nativo indisponível no navegador.');
  },
  async cleanupAll() {
    for (const uri of urls) URL.revokeObjectURL(uri);
    urls.clear();
  },
};
