import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AdBanner } from '../components/AdBanner';
import { ChoiceButton } from '../components/ChoiceButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { formatWon } from '../logic/labels';
import { receivedAmountRange } from '../logic/recommend';
import { ReceivedRelationship } from '../logic/types';
import { colors, radius, spacing } from '../theme';

interface ReceivedAmountScreenProps {
  onBack: () => void;
}

const RELATIONSHIP_OPTIONS: { value: ReceivedRelationship; label: string }[] = [
  { value: 'friend', label: '친구' },
  { value: 'relative', label: '친척' },
  { value: 'coworker', label: '직장동료' },
  { value: 'other', label: '기타' },
];

function digitsOnly(text: string): string {
  return text.replace(/[^0-9]/g, '');
}

export function ReceivedAmountScreen({ onBack }: ReceivedAmountScreenProps) {
  const [rawAmount, setRawAmount] = useState('');
  const [relationship, setRelationship] = useState<ReceivedRelationship | null>(null);

  const amount = rawAmount ? Number(rawAmount) : 0;
  const isValidAmount = amount > 0;
  const range = useMemo(() => (isValidAmount ? receivedAmountRange(amount) : null), [amount, isValidAmount]);

  return (
    <View style={styles.screen}>
      <ScreenHeader title="내가 받은 금액으로 계산하기" onBack={onBack} />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.question}>예전에 내가 받은 금액은?</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={rawAmount ? Number(rawAmount).toLocaleString('ko-KR') : ''}
            onChangeText={(text) => setRawAmount(digitsOnly(text))}
            keyboardType="number-pad"
            placeholder="100,000"
            placeholderTextColor={colors.textMuted}
            maxLength={11}
          />
          <Text style={styles.inputUnit}>원</Text>
        </View>

        <Text style={styles.question}>관계 선택</Text>
        <View style={styles.options}>
          {RELATIONSHIP_OPTIONS.map((option) => (
            <ChoiceButton
              key={option.value}
              label={option.label}
              selected={relationship === option.value}
              onPress={() => setRelationship(option.value)}
            />
          ))}
        </View>

        {range && (
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>이번에는</Text>
            <Text style={styles.resultAmount}>
              {formatWon(range.min)} ~ {formatWon(range.max)}
            </Text>
            <Text style={styles.resultDesc}>정도를 추천해요. 상황에 따라 달라질 수 있어요.</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <AdBanner />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  question: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    minHeight: 56,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  inputUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textMuted,
  },
  options: {
    gap: spacing.sm,
  },
  resultCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSelected,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  resultLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  resultAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
  },
  resultDesc: {
    fontSize: 13,
    color: colors.textMuted,
  },
  footer: {
    paddingBottom: spacing.lg,
  },
});
