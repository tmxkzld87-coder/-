import React from 'react';
import { StyleSheet, View } from 'react-native';
import { InlineAd } from '@apps-in-toss/framework';
import { BANNER_AD_GROUP_ID } from '../ads';

interface State {
  hasError: boolean;
}

/**
 * 광고 컴포넌트에서 에러가 나도 계산기 화면 전체가 죽지 않도록 격리한다.
 * "광고가 로드되지 않아도 핵심 기능은 정상 작동해야 한다"는 요구사항 때문에 필요하다.
 */
class AdErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

/** 배너 광고 영역. 실패해도 화면 흐름에는 아무 영향을 주지 않는다. */
export function AdBanner() {
  return (
    <View style={styles.wrapper}>
      <AdErrorBoundary>
        <InlineAd adGroupId={BANNER_AD_GROUP_ID} theme="light" variant="card" />
      </AdErrorBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
  },
});
