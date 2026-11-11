import { useCallback, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { getRuntime } from '../../application/runtime';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppScreen } from '../../components/ui/AppScreen';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { MonthInput } from '../../components/ui/MonthInput';
import { errorMessage } from '../../domain/core';
import { useAsyncAction } from '../../hooks/use-async-action';
import { useTheme } from '../../theme/ThemeProvider';

export function ExportScreen() {
  const { theme } = useTheme();
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [feedback, setFeedback] = useState('');
  const csv = useCallback(async () => {
    const runtime = await getRuntime();
    const result = await runtime.exports.exportTransactionsCsv();
    await runtime.exports.files.share(result.file);
    return result;
  }, []);
  const pdf = useCallback(async () => {
    const runtime = await getRuntime();
    const result = await runtime.exports.exportMonthlyPdf(period);
    if (result.file) await runtime.exports.files.share(result.file);
    return result;
  }, [period]);
  const csvAction = useAsyncAction(csv, result => setFeedback(`${result.count} movimentações exportadas em ${result.file.name}.`));
  const pdfAction = useAsyncAction(pdf, result => setFeedback(`${result.name} gerado com sucesso.`));
  const run = <T,>(promise: Promise<T>) => void promise.catch(error => setFeedback(errorMessage(error)));
  return (
    <AppScreen>
      <AppHeader back title="Exportar dados" />
      <Card style={styles.card}>
        <Text style={[styles.icon, { color: theme.colors.primary }]}>CSV</Text>
        <Text style={[styles.title, { color: theme.colors.text }]}>Planilha CSV</Text>
        <Text style={[styles.copy, { color: theme.colors.textSecondary }]}>Ideal para Excel e Google Sheets.</Text>
        <Button label="Exportar CSV" loading={csvAction.loading} onPress={() => run(csvAction.execute())} />
      </Card>
      <Card style={styles.card}>
        <Text style={[styles.icon, { color: theme.colors.primary }]}>PDF</Text>
        <Text style={[styles.title, { color: theme.colors.text }]}>Relatório PDF</Text>
        <Text style={[styles.copy, { color: theme.colors.textSecondary }]}>Saldo, receitas, despesas, categorias e transações.</Text>
        <MonthInput label="Competência" onChange={setPeriod} value={period} />
        <Button label="Gerar PDF" loading={pdfAction.loading} onPress={() => run(pdfAction.execute())} />
      </Card>
      <Text style={[styles.notice, { color: theme.colors.textMuted }]}>Arquivos exportados são temporários e não funcionam como backup restaurável.</Text>
      {feedback || csvAction.error || pdfAction.error ? <Text accessibilityLiveRegion="polite" style={[styles.feedback, { color: csvAction.error || pdfAction.error ? theme.colors.dangerStrong : theme.colors.primaryStrong }]}>{feedback || errorMessage(csvAction.error || pdfAction.error)}</Text> : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 14 },
  icon: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  title: { fontSize: 17, fontWeight: '700' },
  copy: { fontSize: 13, lineHeight: 19, marginBottom: 16, marginTop: 6 },
  notice: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
  feedback: { fontSize: 13, marginTop: 14, textAlign: 'center' },
});
