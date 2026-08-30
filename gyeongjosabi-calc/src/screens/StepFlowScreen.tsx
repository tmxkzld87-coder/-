import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AdBanner } from '../components/AdBanner';
import { ChoiceButton } from '../components/ChoiceButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { ProgressDots } from '../components/ProgressDots';
import { ScreenHeader } from '../components/ScreenHeader';
import { getAvailableRelationships } from '../logic/recommend';
import { ATTENDANCE_LABELS, EVENT_LABELS, INTIMACY_LABELS, RELATIONSHIP_LABELS, mealLabel } from '../logic/labels';
import { Answers, Attendance, EventType, Intimacy, MealChoice, Relationship } from '../logic/types';
import { colors, spacing } from '../theme';

export type StepNumber = 1 | 2 | 3 | 4;
const TOTAL_STEPS = 4;

interface StepFlowScreenProps {
  eventType: EventType;
  step: StepNumber;
  answers: Partial<Answers>;
  onSelectRelationship: (value: Relationship) => void;
  onSelectIntimacy: (value: Intimacy) => void;
  onSelectAttendance: (value: Attendance) => void;
  onSelectMeal: (value: MealChoice) => void;
  onNext: () => void;
  onBack: () => void;
}

function stepTitle(step: StepNumber, eventType: EventType): string {
  switch (step) {
    case 1:
      return '나와의 관계는 어떻게 되나요?';
    case 2:
      return '친밀도는 어느 정도인가요?';
    case 3:
      return '참석하시나요?';
    case 4:
      return eventType === 'funeral' ? '조문하시나요?' : '식사하시나요?';
  }
}

export function StepFlowScreen({
  eventType,
  step,
  answers,
  onSelectRelationship,
  onSelectIntimacy,
  onSelectAttendance,
  onSelectMeal,
  onNext,
  onBack,
}: StepFlowScreenProps) {
  const isNextEnabled =
    (step === 1 && answers.relationship !== undefined) ||
    (step === 2 && answers.intimacy !== undefined) ||
    (step === 3 && answers.attendance !== undefined) ||
    (step === 4 && answers.meal !== undefined);

  return (
    <View style={styles.screen}>
      <ScreenHeader title={`${EVENT_LABELS[eventType].emoji} ${EVENT_LABELS[eventType].title}`} onBack={onBack} />
      <View style={styles.progress}>
        <ProgressDots total={TOTAL_STEPS} current={step} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{stepTitle(step, eventType)}</Text>

        <View style={styles.options}>
          {step === 1 &&
            getAvailableRelationships(eventType).map((value) => (
              <ChoiceButton
                key={value}
                label={RELATIONSHIP_LABELS[value]}
                selected={answers.relationship === value}
                onPress={() => onSelectRelationship(value)}
              />
            ))}

          {step === 2 &&
            (['close', 'normal', 'light'] as Intimacy[]).map((value) => (
              <ChoiceButton
                key={value}
                label={INTIMACY_LABELS[value]}
                selected={answers.intimacy === value}
                onPress={() => onSelectIntimacy(value)}
              />
            ))}

          {step === 3 &&
            (['attending', 'notAttending'] as Attendance[]).map((value) => (
              <ChoiceButton
                key={value}
                label={ATTENDANCE_LABELS[value]}
                selected={answers.attendance === value}
                onPress={() => onSelectAttendance(value)}
              />
            ))}

          {step === 4 &&
            (['withMeal', 'withoutMeal'] as MealChoice[]).map((value) => (
              <ChoiceButton
                key={value}
                label={mealLabel(eventType, value)}
                selected={answers.meal === value}
                onPress={() => onSelectMeal(value)}
              />
            ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton label={step === TOTAL_STEPS ? '결과 보기' : '다음'} onPress={onNext} disabled={!isNextEnabled} />
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
  progress: {
    paddingVertical: spacing.md,
  },
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  options: {
    gap: spacing.sm,
  },
  footer: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
});
