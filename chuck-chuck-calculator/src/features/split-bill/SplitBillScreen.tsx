import React, { useMemo, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';
import { NumberInput } from '../../components/NumberInput';
import { ResultCard } from '../../components/ResultCard';
import { Stepper } from '../../components/Stepper';
import { CalculatorChrome } from '../../components/CalculatorChrome';
import { calculateEvenSplit, calculateWeightedSplit, type RoundUnit } from './calc';
import { colors } from '../../theme/colors';
import { fontSizes, fontWeights } from '../../theme/typography';

type Mode = 'even' | 'weighted';

function toNumber(value: string): number {
  return value === '' ? 0 : Number(value);
}

function formatWon(value: number): string {
  return `${value.toLocaleString('ko-KR')}원`;
}

const ROUND_UNITS: { label: string; value: RoundUnit }[] = [
  { label: '없음', value: 0 },
  { label: '10원', value: 10 },
  { label: '100원', value: 100 },
  { label: '1,000원', value: 1000 },
];

let participantIdSeed = 0;
function nextParticipantId(): string {
  participantIdSeed += 1;
  return `p-${participantIdSeed}`;
}

export type SplitBillScreenProps = { onBack?: () => void };

export function SplitBillScreen({ onBack }: SplitBillScreenProps) {
  const [mode, setMode] = useState<Mode>('even');

  const [totalAmount, setTotalAmount] = useState('');
  const [headcount, setHeadcount] = useState(2);
  const [roundUnit, setRoundUnit] = useState<RoundUnit>(100);

  const [participants, setParticipants] = useState<{ id: string; name: string; amount: string }[]>([
    { id: nextParticipantId(), name: '', amount: '' },
    { id: nextParticipantId(), name: '', amount: '' },
  ]);

  const evenResult = useMemo(() => {
    if (totalAmount === '') return null;
    try {
      return calculateEvenSplit({ mode: 'even', totalAmount: toNumber(totalAmount), headcount, roundUnit });
    } catch {
      return null;
    }
  }, [totalAmount, headcount, roundUnit]);

  const weightedResult = useMemo(() => {
    const filled = participants.filter((p) => p.amount !== '');
    if (filled.length < 2) return null;
    try {
      return calculateWeightedSplit({
        mode: 'weighted',
        participants: participants.map((p, i) => ({ name: p.name.trim() || `참가자 ${i + 1}`, amount: toNumber(p.amount) })),
      });
    } catch {
      return null;
    }
  }, [participants]);

  const evenMessage = useMemo(() => {
    if (!evenResult) return null;
    if (evenResult.remainder === 0) return '정확히 나눠떨어져요';
    if (evenResult.remainder > 0) {
      return `1명만 ${formatWon(evenResult.perPerson + evenResult.remainder)}, 나머지 ${headcount - 1}명은 ${formatWon(evenResult.perPerson)} 내면 딱 맞아요`;
    }
    return `1명만 ${formatWon(evenResult.perPerson + evenResult.remainder)}, 나머지는 ${formatWon(evenResult.perPerson)} 내면 ${formatWon(-evenResult.remainder)} 남아요`;
  }, [evenResult, headcount]);

  const handleReset = () => {
    setMode('even');
    setTotalAmount('');
    setHeadcount(2);
    setRoundUnit(100);
    setParticipants([
      { id: nextParticipantId(), name: '', amount: '' },
      { id: nextParticipantId(), name: '', amount: '' },
    ]);
  };

  return (
    <CalculatorChrome
      testIDPrefix="split-bill"
      title="N빵 계산"
      onBack={onBack}
      calculatorType="split-bill"
      onReset={handleReset}
      titlePlaceholder="예: 저녁 회식"
      getSaveValidationError={() => {
        if (mode === 'even') return evenResult ? null : '총 금액을 입력해주세요.';
        return weightedResult ? null : '참가자 지출액을 2명 이상 입력해주세요.';
      }}
      getSaveSummary={() =>
        mode === 'even'
          ? evenResult
            ? `1인당 ${formatWon(evenResult.perPerson)} · 총액 ${formatWon(toNumber(totalAmount))}`
            : ''
          : weightedResult
            ? `1인 평균 ${formatWon(weightedResult.averageAmount)} · 송금 ${weightedResult.transfers.length}건`
            : ''
      }>
      <Text style={styles.notice}>더치페이 금액을 빠르게 나눠보세요.</Text>

      <View style={styles.modeSwitch}>
        <TouchableOpacity testID="mode-even" style={[styles.modeButton, mode === 'even' && styles.modeButtonActive]} onPress={() => setMode('even')}>
          <Text style={[styles.modeButtonText, mode === 'even' && styles.modeButtonTextActive]}>단순 N빵</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="mode-weighted" style={[styles.modeButton, mode === 'weighted' && styles.modeButtonActive]} onPress={() => setMode('weighted')}>
          <Text style={[styles.modeButtonText, mode === 'weighted' && styles.modeButtonTextActive]}>차등 정산</Text>
        </TouchableOpacity>
      </View>

      {mode === 'even' ? (
        <>
          <NumberInput testID="input-total-amount" label="총 금액" value={totalAmount} onChangeValue={setTotalAmount} placeholder="0" />
          <Stepper testID="headcount-stepper" label="인원 수" value={headcount} onChange={setHeadcount} suffix="명" />

          <View style={styles.chipRow}>
            {ROUND_UNITS.map((u) => (
              <TouchableOpacity
                key={u.value}
                testID={`round-unit-${u.value}`}
                style={[styles.chip, roundUnit === u.value && styles.chipActive]}
                onPress={() => setRoundUnit(u.value)}>
                <Text style={[styles.chipText, roundUnit === u.value && styles.chipTextActive]}>{u.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {evenResult ? (
            <View testID="even-result" style={styles.resultSection}>
              <ResultCard label="1인당 금액" value={formatWon(evenResult.perPerson)} emphasis="success" />
              <ResultCard label="총 금액" value={formatWon(toNumber(totalAmount))} />
              {evenMessage ? <Text style={styles.subMessage}>{evenMessage}</Text> : null}
            </View>
          ) : null}
        </>
      ) : (
        <>
          {participants.map((p, index) => (
            <View key={p.id} style={styles.participantRow}>
              <TextInput
                testID={`input-participant-name-${index}`}
                style={styles.participantNameInput}
                value={p.name}
                onChangeText={(text) => setParticipants((prev) => prev.map((row) => (row.id === p.id ? { ...row, name: text } : row)))}
                placeholder={`참가자 ${index + 1}`}
                placeholderTextColor={colors.secondaryText}
              />
              <View style={styles.participantAmountWrap}>
                <NumberInput
                  testID={`input-participant-amount-${index}`}
                  label="지출액"
                  value={p.amount}
                  onChangeValue={(v) => setParticipants((prev) => prev.map((row) => (row.id === p.id ? { ...row, amount: v } : row)))}
                  placeholder="0"
                />
              </View>
              {participants.length > 2 ? (
                <TouchableOpacity
                  testID={`remove-participant-${index}`}
                  style={styles.removeButton}
                  onPress={() => setParticipants((prev) => prev.filter((row) => row.id !== p.id))}>
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))}
          <TouchableOpacity
            testID="add-participant"
            style={styles.addButton}
            onPress={() => setParticipants((prev) => [...prev, { id: nextParticipantId(), name: '', amount: '' }])}>
            <Text style={styles.addButtonText}>+ 인원 추가</Text>
          </TouchableOpacity>

          {weightedResult ? (
            <View testID="weighted-result" style={styles.resultSection}>
              <ResultCard label="1인 평균 지출" value={formatWon(weightedResult.averageAmount)} emphasis="success" />
              {weightedResult.transfers.length === 0 ? (
                <Text style={styles.subMessage}>이미 똑같이 냈어요, 정산할 금액이 없어요</Text>
              ) : (
                weightedResult.transfers.map((t, i) => (
                  <Text key={i} testID={`transfer-${i}`} style={styles.transferLine}>
                    {t.from} → {t.to} : {formatWon(t.amount)}
                  </Text>
                ))
              )}
            </View>
          ) : null}
        </>
      )}
    </CalculatorChrome>
  );
}

const styles = StyleSheet.create({
  notice: { fontSize: fontSizes.caption, color: colors.secondaryText, marginHorizontal: 20, marginBottom: 16 },
  modeSwitch: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: colors.lightBlueBackground,
    padding: 4,
  },
  modeButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  modeButtonActive: { backgroundColor: colors.primaryBlue },
  modeButtonText: { fontSize: fontSizes.caption, color: colors.primaryBlue, fontWeight: fontWeights.bold },
  modeButtonTextActive: { color: colors.background },
  chipRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: colors.divider, marginRight: 8 },
  chipActive: { backgroundColor: colors.primaryBlue },
  chipText: { fontSize: fontSizes.caption, color: colors.darkText },
  chipTextActive: { color: colors.background, fontWeight: fontWeights.bold },
  participantRow: { flexDirection: 'row', alignItems: 'flex-end', marginHorizontal: 20, marginBottom: 8, gap: 8 },
  participantNameInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: fontSizes.body,
    color: colors.darkText,
  },
  participantAmountWrap: { flex: 1 },
  removeButton: { marginBottom: 30, padding: 8 },
  removeButtonText: { color: colors.secondaryText, fontSize: fontSizes.body },
  addButton: { marginHorizontal: 20, paddingVertical: 10, alignItems: 'center', marginBottom: 8 },
  addButtonText: { color: colors.primaryBlue, fontSize: fontSizes.caption, fontWeight: fontWeights.bold },
  resultSection: { marginTop: 12, borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 12 },
  subMessage: { marginHorizontal: 20, marginTop: 4, fontSize: fontSizes.caption, color: colors.secondaryText },
  transferLine: { marginHorizontal: 20, marginTop: 6, fontSize: fontSizes.body, color: colors.darkText, fontWeight: fontWeights.bold },
});
