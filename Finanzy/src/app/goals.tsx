import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from '../components/BottomNav';
import { addToGoal, deleteGoal, getGoals, Goal, saveGoal } from '../database';
import {
  formatBrazilianDateInput,
  isValidBrazilianDate,
  toBrazilianDate,
  toDatabaseDate,
} from '../date';

const currency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function GoalsScreen() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [depositing, setDepositing] = useState(false);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [savedAmount, setSavedAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [depositAmount, setDepositAmount] = useState('');
  const [error, setError] = useState('');
  const [loadingError, setLoadingError] = useState('');

  const loadGoals = useCallback(async () => {
    try {
      setGoals(await getGoals());
      setLoadingError('');
    } catch {
      setLoadingError('Não foi possível carregar suas metas. Tente novamente.');
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadGoals();
  }, [loadGoals]));

  const selectedGoal = goals.find((goal) => goal.id === selectedGoalId) ?? null;

  function startNewGoal() {
    setSelectedGoalId(null);
    setIsEditing(true);
    setName('');
    setTargetAmount('');
    setSavedAmount('0');
    setDeadline('');
    setIcon('🎯');
    setError('');
  }

  function startEditingGoal(goal: Goal) {
    setIsEditing(true);
    setName(goal.name);
    setTargetAmount(String(goal.targetAmount));
    setSavedAmount(String(goal.savedAmount));
    setDeadline(goal.deadline ? toBrazilianDate(goal.deadline) : '');
    setIcon(goal.icon ?? '🎯');
    setError('');
  }

  function cancelEditing() {
    setIsEditing(false);
    setError('');
  }

  async function submitGoal() {
    const target = Number(targetAmount.replace(',', '.'));
    const saved = Number(savedAmount.replace(',', '.'));
    if (!name.trim()) {
      setError('Informe um nome para sua meta.');
      return;
    }
    if (!Number.isFinite(target) || target <= 0) {
      setError('Informe um valor de meta maior que zero.');
      return;
    }
    if (!Number.isFinite(saved) || saved < 0) {
      setError('Informe um valor guardado válido.');
      return;
    }
    if (deadline && !isValidBrazilianDate(deadline)) {
      setError('Informe uma data válida no formato DD/MM/AAAA.');
      return;
    }
    try {
      await saveGoal(
        {
          name: name.trim(),
          targetAmount: target,
          savedAmount: saved,
          deadline: deadline.trim() ? toDatabaseDate(deadline) : null,
          icon: icon.trim() || null,
        },
        selectedGoalId
      );
      setIsEditing(false);
      setError('');
      await loadGoals();
    } catch {
      setError('Não foi possível salvar a meta. Tente novamente.');
    }
  }

  async function submitDeposit() {
    const amount = Number(depositAmount.replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Informe um valor para guardar maior que zero.');
      return;
    }
    if (!selectedGoal) return;
    try {
      await addToGoal(selectedGoal.id, amount);
      setDepositAmount('');
      setDepositing(false);
      setError('');
      await loadGoals();
    } catch {
      setError('Não foi possível atualizar o valor guardado. Tente novamente.');
    }
  }

  async function removeGoal(goal: Goal) {
    try {
      await deleteGoal(goal.id);
      setSelectedGoalId(null);
      setError('');
      await loadGoals();
    } catch {
      setError('Não foi possível excluir a meta. Tente novamente.');
    }
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Pressable
            accessibilityLabel="Voltar para o menu Mais"
            accessibilityRole="button"
            onPress={() => router.replace('/more')}
            style={styles.backToMore}
          >
            <Text style={styles.backToMoreText}>‹</Text>
          </Pressable>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                {isEditing ? (selectedGoalId ? 'Editar meta' : 'Criar meta') : selectedGoal?.name ?? 'Minhas metas'}
              </Text>
              {!isEditing && !selectedGoal ? (
                <Text style={styles.subtitle}>Seus objetivos, um passo de cada vez</Text>
              ) : null}
            </View>
            {!isEditing && !selectedGoal ? (
              <Pressable accessibilityRole="button" onPress={startNewGoal} style={styles.actionButton}>
                <Text style={styles.actionText}>+ Nova</Text>
              </Pressable>
            ) : (
              <Pressable
                accessibilityLabel="Voltar para minhas metas"
                accessibilityRole="button"
                onPress={() => {
                  setIsEditing(false);
                  setSelectedGoalId(null);
                  setDepositing(false);
                  setError('');
                }}
                style={styles.backButton}
              >
                <Text style={styles.backText}>‹ Metas</Text>
              </Pressable>
            )}
          </View>

          {loadingError ? <Text style={styles.error}>{loadingError}</Text> : null}

          {isEditing ? (
            <View style={styles.formCard}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Nome</Text>
                <TextInput
                  onChangeText={(value) => { setName(value); setError(''); }}
                  placeholder="Ex: Viagem"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                  value={name}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Valor da meta</Text>
                <TextInput
                  keyboardType="decimal-pad"
                  onChangeText={(value) => { setTargetAmount(value); setError(''); }}
                  placeholder="R$ 0,00"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                  value={targetAmount}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Valor já guardado</Text>
                <TextInput
                  keyboardType="decimal-pad"
                  onChangeText={(value) => { setSavedAmount(value); setError(''); }}
                  placeholder="R$ 0,00"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                  value={savedAmount}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Prazo (opcional)</Text>
                <TextInput
                  autoCapitalize="none"
                  keyboardType="number-pad"
                  maxLength={10}
                  onChangeText={(value) => { setDeadline(formatBrazilianDateInput(value)); setError(''); }}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                  value={deadline}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Ícone (opcional)</Text>
                <TextInput
                  onChangeText={setIcon}
                  placeholder="🎯"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                  value={icon}
                />
              </View>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <View style={styles.formActions}>
                <Pressable accessibilityRole="button" onPress={cancelEditing} style={styles.secondaryButton}>
                  <Text style={styles.secondaryText}>Cancelar</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={submitGoal} style={styles.saveButton}>
                  <Text style={styles.saveText}>Salvar meta</Text>
                </Pressable>
              </View>
            </View>
          ) : selectedGoal ? (
            <View>
              <View style={styles.detailCard}>
                <Text style={styles.goalIcon}>{selectedGoal.icon ?? '🎯'}</Text>
                <Text style={styles.progressLabel}>
                  {Math.round((selectedGoal.savedAmount / selectedGoal.targetAmount) * 100)}% concluído
                </Text>
                <View style={styles.progressTrack}>
                  <View style={[
                    styles.progressFill,
                    { width: `${Math.min((selectedGoal.savedAmount / selectedGoal.targetAmount) * 100, 100)}%` },
                  ]} />
                </View>
              </View>
              <View style={styles.amountCards}>
                <View style={styles.amountCard}>
                  <Text style={styles.amountLabel}>Objetivo</Text>
                  <Text numberOfLines={1} style={styles.amountValue}>{currency(selectedGoal.targetAmount)}</Text>
                </View>
                <View style={styles.amountCard}>
                  <Text style={styles.amountLabel}>Guardado</Text>
                  <Text numberOfLines={1} style={styles.savedValue}>{currency(selectedGoal.savedAmount)}</Text>
                </View>
                <View style={styles.amountCard}>
                  <Text style={styles.amountLabel}>Restante</Text>
                  <Text numberOfLines={1} style={styles.remainingValue}>
                    {currency(Math.max(selectedGoal.targetAmount - selectedGoal.savedAmount, 0))}
                  </Text>
                </View>
              </View>
              {selectedGoal.deadline ? (
                <Text style={styles.deadline}>
                  Prazo: {toBrazilianDate(selectedGoal.deadline)}
                </Text>
              ) : null}
              {depositing ? (
                <View style={styles.depositCard}>
                  <Text style={styles.sectionTitle}>Adicionar valor</Text>
                  <TextInput
                    keyboardType="decimal-pad"
                    onChangeText={(value) => { setDepositAmount(value); setError(''); }}
                    placeholder="R$ 0,00"
                    placeholderTextColor="#94A3B8"
                    style={styles.input}
                    value={depositAmount}
                  />
                  {error ? <Text style={styles.error}>{error}</Text> : null}
                  <View style={styles.formActions}>
                    <Pressable accessibilityRole="button" onPress={() => setDepositing(false)} style={styles.secondaryButton}>
                      <Text style={styles.secondaryText}>Cancelar</Text>
                    </Pressable>
                    <Pressable accessibilityRole="button" onPress={submitDeposit} style={styles.saveButton}>
                      <Text style={styles.saveText}>Guardar valor</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => { setDepositing(true); setError(''); }}
                  style={styles.saveButton}
                >
                  <Text style={styles.saveText}>+ Adicionar dinheiro</Text>
                </Pressable>
              )}
              <View style={styles.detailActions}>
                <Pressable accessibilityRole="button" onPress={() => startEditingGoal(selectedGoal)} style={styles.secondaryButton}>
                  <Text style={styles.secondaryText}>Editar meta</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => removeGoal(selectedGoal)} style={styles.deleteButton}>
                  <Text style={styles.deleteText}>Excluir meta</Text>
                </Pressable>
              </View>
            </View>
          ) : goals.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={styles.emptyTitle}>Nenhuma meta cadastrada</Text>
              <Text style={styles.emptyText}>Crie um objetivo e acompanhe seu progresso.</Text>
              <Pressable accessibilityRole="button" onPress={startNewGoal} style={styles.saveButton}>
                <Text style={styles.saveText}>Criar primeira meta</Text>
              </Pressable>
            </View>
          ) : (
            goals.map((goal) => {
              const progress = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
              return (
                <Pressable
                  accessibilityRole="button"
                  key={goal.id}
                  onPress={() => { setSelectedGoalId(goal.id); setError(''); }}
                  style={styles.goalCard}
                >
                  <View style={styles.goalHeader}>
                    <Text style={styles.goalListIcon}>{goal.icon ?? '🎯'}</Text>
                    <View style={styles.goalInfo}>
                      <Text style={styles.goalName}>{goal.name}</Text>
                      <Text style={styles.goalAmount}>
                        {currency(goal.savedAmount)} de {currency(goal.targetAmount)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                  </View>
                  <Text style={styles.goalPercent}>{Math.round(progress)}%</Text>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
      <BottomNav active="more" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F7F9FC', flex: 1 },
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 30 },
  backToMore: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#ECFDF5', borderRadius: 20, height: 40, justifyContent: 'center', marginBottom: 8, width: 40 },
  backToMoreText: { color: '#059669', fontSize: 27, fontWeight: '500', lineHeight: 30, marginTop: -2 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18, marginTop: 8 },
  title: { color: '#111827', flex: 1, fontSize: 24, fontWeight: '700' },
  subtitle: { color: '#64748B', fontSize: 13, marginTop: 4 },
  actionButton: { backgroundColor: '#10B981', borderRadius: 18, paddingHorizontal: 15, paddingVertical: 10 },
  actionText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  backButton: { paddingHorizontal: 8, paddingVertical: 10 },
  backText: { color: '#059669', fontSize: 13, fontWeight: '700' },
  goalCard: { backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 12, padding: 14 },
  goalHeader: { alignItems: 'center', flexDirection: 'row' },
  goalListIcon: { fontSize: 19, marginRight: 9 },
  goalInfo: { flex: 1 },
  goalName: { color: '#111827', fontSize: 14, fontWeight: '700' },
  goalAmount: { color: '#64748B', fontSize: 11, marginTop: 4 },
  progressTrack: { backgroundColor: '#E2E8F0', borderRadius: 5, height: 7, marginTop: 12, overflow: 'hidden' },
  progressFill: { backgroundColor: '#10B981', borderRadius: 5, height: 7 },
  goalPercent: { color: '#059669', fontSize: 11, marginTop: 6 },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 15 },
  field: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: 14, borderWidth: 1, height: 66, justifyContent: 'center', marginBottom: 10, paddingHorizontal: 12 },
  fieldLabel: { color: '#94A3B8', fontSize: 11, marginBottom: 2 },
  input: { color: '#111827', fontSize: 15, minHeight: 38, paddingVertical: 4 },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  secondaryButton: { alignItems: 'center', borderColor: '#E2E8F0', borderRadius: 13, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 50, paddingHorizontal: 10 },
  secondaryText: { color: '#64748B', fontSize: 13, fontWeight: '700' },
  saveButton: { alignItems: 'center', backgroundColor: '#10B981', borderRadius: 13, justifyContent: 'center', marginTop: 14, minHeight: 50, paddingHorizontal: 14 },
  saveText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  detailCard: { backgroundColor: '#ECFDF5', borderRadius: 18, padding: 18 },
  goalIcon: { fontSize: 29, marginBottom: 8 },
  progressLabel: { color: '#047857', fontSize: 18, fontWeight: '700' },
  amountCards: { flexDirection: 'row', gap: 8, marginTop: 12 },
  amountCard: { backgroundColor: '#FFFFFF', borderRadius: 14, flex: 1, padding: 10 },
  amountLabel: { color: '#64748B', fontSize: 10 },
  amountValue: { color: '#111827', fontSize: 11, fontWeight: '700', marginTop: 6 },
  savedValue: { color: '#059669', fontSize: 11, fontWeight: '700', marginTop: 6 },
  remainingValue: { color: '#EF4444', fontSize: 11, fontWeight: '700', marginTop: 6 },
  deadline: { color: '#64748B', fontSize: 12, marginTop: 13 },
  depositCard: { backgroundColor: '#FFFFFF', borderRadius: 16, marginTop: 16, padding: 14 },
  sectionTitle: { color: '#111827', fontSize: 15, fontWeight: '700', marginBottom: 9 },
  detailActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  deleteButton: { alignItems: 'center', borderColor: '#FECACA', borderRadius: 13, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 50, paddingHorizontal: 8 },
  deleteText: { color: '#DC2626', fontSize: 13, fontWeight: '700' },
  empty: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 22 },
  emptyIcon: { fontSize: 32 },
  emptyTitle: { color: '#111827', fontSize: 16, fontWeight: '700', marginTop: 9 },
  emptyText: { color: '#64748B', fontSize: 13, lineHeight: 19, marginTop: 6, textAlign: 'center' },
  error: { color: '#DC2626', fontSize: 13, marginTop: 9 },
});
