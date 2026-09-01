import { getTossShareLink, share } from '@apps-in-toss/framework';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AdBanner } from '../components/AdBanner';
import { AmountChip } from '../components/AmountChip';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import {
  ATTENDANCE_LABELS,
  COMPARISON_LABELS,
  EVENT_LABELS,
  INTIMACY_LABELS,
  RELATIONSHIP_LABELS,
  formatWon,
  mealLabel,
  resultTagline,
} from '../logic/labels';
import { PRESET_AMOUNTS, boostedAmounts, compareToRecommendation, recommendAmount } from '../logic/recommend';
import { Answers } from '../logic/types';
import { colors, radius, spacing } from '../theme';

interface ResultScreenProps {
  answers: Answers;
  onBack: () => void;
  onOpenReceivedAmount: () => void;
}

export function ResultScreen({ answers, onBack, onOpenReceivedAmount }: ResultScreenProps) {
  const recommended = recommendAmount(answers);
  const boosted = boostedAmounts(recommended);
  const [comparedAmount, setComparedAmount] = useState<number | null>(null);

  const summary = [
    RELATIONSHIP_LABELS[answers.relationship],
    `${INTIMACY_LABELS[answers.intimacy]} 친밀도`,
    ATTENDANCE_LABELS[answers.attendance],
    mealLabel(answers.eventType, answers.meal),
  ].join(' · ');

  const handleShare = async () => {
    try {
      const shareLink = await getTossShareLink(
        'intoss://gyeongjosabi-calc',
        'https://static.toss.im/appsintoss/77253/29fd6222-f04e-418c-b846-117a13e106ec.png',
      );
      await share({
        message: `${EVENT_LABELS[answers.eventType].emoji} ${EVENT_LABELS[answers.eventType].title} 경조사비, ${formatWon(recommended)} 추천받았어요!\n${summary}\n\n${shareLink}`,
      });
    } catch (error) {
      console.error('공유 실패:', error);
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="추천 결과" onBack={onBack} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.eventTitle}>
            {EVENT_LABELS[answers.eventType].emoji} {EVENT_LABELS[answers.eventType].title}
          </Text>
          <Text style={styles.summaryText}>{summary}</Text>

          <View style={styles.divider} />

          <Text style={styles.recommendLabel}>추천 금액</Text>
          <Text style={styles.recommendAmount}>{formatWon(recommended)}</Text>
          <Text style={styles.tagline}>{resultTagline(recommended)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>금액 선택</Text>
          <View style={styles.chipRow}>
            {PRESET_AMOUNTS.map((amount) => (
              <AmountChip
                key={amount}
                amount={amount}
                highlighted={amount === recommended}
                selected={comparedAmount === amount}
                onPress={() => setComparedAmount(amount)}
              />
            ))}
          </View>
          {comparedAmount !== null && (
            <Text style={styles.comparisonText}>
              추천 대비 <Text style={styles.comparisonHighlight}>{COMPARISON_LABELS[compareToRecommendation(comparedAmount, recommended)]}</Text>
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>조금 더 내고 싶다면</Text>
          <View style={styles.suggestionRow}>
            <View style={styles.suggestionCard}>
              <Text style={styles.suggestionAmount}>+{formatWon(50_000)}</Text>
              <Text style={styles.suggestionDesc}>관계가 특별히 가깝다면 {formatWon(boosted.closer)}도 괜찮은 선택이에요.</Text>
            </View>
            <View style={styles.suggestionCard}>
              <Text style={styles.suggestionAmount}>+{formatWon(100_000)}</Text>
              <Text style={styles.suggestionDesc}>
                오래 알고 지낸 사이거나 특별한 관계라면 {formatWon(boosted.special)}도 좋아요.
              </Text>
            </View>
          </View>
          <Text style={styles.noticeText}>절대적인 기준은 아니며, 상황에 따라 달라질 수 있어요.</Text>
        </View>

        <PrimaryButton label="내가 받은 금액으로 계산하기" variant="secondary" onPress={onOpenReceivedAmount} />
        <PrimaryButton label="결과 공유하기" variant="secondary" onPress={handleShare} />

        <Text style={styles.footerNotice}>경조사비에는 정해진 정답이 없으며, 관계와 상황에 따라 달라질 수 있습니다.</Text>
      </ScrollView>

      <View style={styles.adFooter}>
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
    gap: spacing.xl,
    paddingBottom: spacing.lg,
  },
  summaryCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSelected,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  summaryText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  recommendLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  recommendAmount: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.primary,
  },
  tagline: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  comparisonText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  comparisonHighlight: {
    color: colors.primary,
    fontWeight: '700',
  },
  suggestionRow: {
    gap: spacing.sm,
  },
  suggestionCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: 2,
  },
  suggestionAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  suggestionDesc: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  noticeText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  footerNotice: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  adFooter: {
    paddingBottom: spacing.lg,
  },
});
