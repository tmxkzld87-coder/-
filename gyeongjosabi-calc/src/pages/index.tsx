import { useSafeAreaInsets } from '@granite-js/native/react-native-safe-area-context';
import { createRoute } from '@granite-js/react-native';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { preloadInterstitialAd, shouldShowInterstitial, showInterstitialAd } from '../ads';
import { HomeScreen } from '../screens/HomeScreen';
import { ReceivedAmountScreen } from '../screens/ReceivedAmountScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { StepFlowScreen, StepNumber } from '../screens/StepFlowScreen';
import { Answers, Attendance, EventType, Intimacy, MealChoice, Relationship } from '../logic/types';
import { colors } from '../theme';

export const Route = createRoute('/', {
  component: GyeongjosabiCalculatorPage,
});

type Screen = { name: 'home' } | { name: 'steps'; step: StepNumber } | { name: 'result' } | { name: 'received' };

const DEFAULT_ANSWERS: Partial<Answers> = {
  intimacy: 'normal',
  attendance: 'attending',
};

function isCompleteAnswers(answers: Partial<Answers>): answers is Answers {
  return (
    answers.eventType !== undefined &&
    answers.relationship !== undefined &&
    answers.intimacy !== undefined &&
    answers.attendance !== undefined &&
    answers.meal !== undefined
  );
}

function GyeongjosabiCalculatorPage() {
  const insets = useSafeAreaInsets();
  // 화면 이동은 스택으로 관리한다: 뒤로가기는 스택을 pop하고, 이전 단계에서 고른 값은
  // answers에 그대로 남아있으므로 "뒤로가기 시 입력값 유지" 요구사항을 자연스럽게 만족한다.
  const [screenStack, setScreenStack] = useState<Screen[]>([{ name: 'home' }]);
  const [answers, setAnswers] = useState<Partial<Answers>>(DEFAULT_ANSWERS);
  const isAdReady = useRef(false);

  const screen = screenStack[screenStack.length - 1] ?? { name: 'home' };

  useEffect(() => {
    const cleanup = preloadInterstitialAd(() => {
      isAdReady.current = true;
    });
    return cleanup;
  }, []);

  // 결과 화면에 도달할 때마다 카운트하고, 여러 번 연속으로 계산했을 때만 전면 광고를 보여준다.
  useEffect(() => {
    if (screen.name !== 'result') return;
    if (!shouldShowInterstitial() || !isAdReady.current) return;

    isAdReady.current = false;
    showInterstitialAd({
      onDismissed: () => {
        isAdReady.current = false;
        preloadInterstitialAd(() => {
          isAdReady.current = true;
        });
      },
      onFailed: () => {
        isAdReady.current = false;
        preloadInterstitialAd(() => {
          isAdReady.current = true;
        });
      },
    });
  }, [screen.name]);

  function push(next: Screen) {
    setScreenStack((stack) => [...stack, next]);
  }

  function pop() {
    setScreenStack((stack) => (stack.length > 1 ? stack.slice(0, -1) : stack));
  }

  function handleSelectEvent(eventType: EventType) {
    setAnswers({ ...DEFAULT_ANSWERS, eventType });
    push({ name: 'steps', step: 1 });
  }

  function handleNextStep() {
    if (screen.name !== 'steps') return;
    if (screen.step < 4) {
      push({ name: 'steps', step: (screen.step + 1) as StepNumber });
    } else {
      push({ name: 'result' });
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {screen.name === 'home' && <HomeScreen onSelectEvent={handleSelectEvent} />}

      {screen.name === 'steps' && answers.eventType !== undefined && (
        <StepFlowScreen
          eventType={answers.eventType}
          step={screen.step}
          answers={answers}
          onSelectRelationship={(value: Relationship) => setAnswers((prev) => ({ ...prev, relationship: value }))}
          onSelectIntimacy={(value: Intimacy) => setAnswers((prev) => ({ ...prev, intimacy: value }))}
          onSelectAttendance={(value: Attendance) => setAnswers((prev) => ({ ...prev, attendance: value }))}
          onSelectMeal={(value: MealChoice) => setAnswers((prev) => ({ ...prev, meal: value }))}
          onNext={handleNextStep}
          onBack={pop}
        />
      )}

      {screen.name === 'result' && isCompleteAnswers(answers) && (
        <ResultScreen answers={answers} onBack={pop} onOpenReceivedAmount={() => push({ name: 'received' })} />
      )}

      {screen.name === 'received' && <ReceivedAmountScreen onBack={pop} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
