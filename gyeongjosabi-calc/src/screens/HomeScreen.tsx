import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AdBanner } from '../components/AdBanner';
import { EventCard } from '../components/EventCard';
import { EVENT_LABELS } from '../logic/labels';
import { EventType } from '../logic/types';
import { colors, spacing } from '../theme';

interface HomeScreenProps {
  onSelectEvent: (eventType: EventType) => void;
}

const EVENT_ORDER: EventType[] = ['wedding', 'funeral', 'firstBirthday'];

export function HomeScreen({ onSelectEvent }: HomeScreenProps) {
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>경조사비 계산기</Text>
          <Text style={styles.subtitle}>얼마를 내야 할지 고민될 때</Text>
        </View>

        <View style={styles.cardRow}>
          {EVENT_ORDER.map((eventType) => (
            <EventCard
              key={eventType}
              emoji={EVENT_LABELS[eventType].emoji}
              title={EVENT_LABELS[eventType].title}
              selected={false}
              onPress={() => onSelectEvent(eventType)}
            />
          ))}
        </View>

        <Text style={styles.notice}>경조사비에는 정해진 정답이 없으며, 관계와 상황에 따라 달라질 수 있습니다.</Text>
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
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.xl,
  },
  adFooter: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  header: {
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
  },
  cardRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  notice: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
