import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { act } from 'react-test-renderer';
import { Storage, loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/framework';
import { SettingsScreen } from './SettingsScreen';

jest.mock('@apps-in-toss/framework', () => ({
  Storage: { getItem: jest.fn(), setItem: jest.fn() },
  InlineAd: () => null,
  loadFullScreenAd: jest.fn(),
  showFullScreenAd: jest.fn(),
}));

const mockedStorage = jest.mocked(Storage);
const mockedLoad = jest.mocked(loadFullScreenAd);
const mockedShow = jest.mocked(showFullScreenAd);

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedStorage.getItem.mockResolvedValue(null);
    mockedLoad.mockImplementation(({ onEvent }) => {
      onEvent({ type: 'loaded' } as never);
      return () => {};
    });
  });

  it('calls onBack when the back button is pressed', () => {
    const onBack = jest.fn();
    render(<SettingsScreen onBack={onBack} />);
    fireEvent.press(screen.getByTestId('settings-back-button'));
    expect(onBack).toHaveBeenCalled();
  });

  it('shows the watch-ad button when not ad-free yet', async () => {
    render(<SettingsScreen onBack={jest.fn()} />);
    await waitFor(() => expect(screen.getByTestId('watch-ad-for-ad-free')).toBeTruthy());
    expect(screen.queryByTestId('ad-free-status')).toBeNull();
  });

  it('shows the ad-free status instead of the button when already ad-free', async () => {
    mockedStorage.getItem.mockResolvedValue(String(Date.now() + 60_000));
    render(<SettingsScreen onBack={jest.fn()} />);
    await waitFor(() => expect(screen.getByTestId('ad-free-status')).toBeTruthy());
    expect(screen.queryByTestId('watch-ad-for-ad-free')).toBeNull();
  });

  it('grants ad-free time once the rewarded ad reports userEarnedReward', async () => {
    mockedShow.mockImplementation(({ onEvent }) => {
      onEvent({ type: 'userEarnedReward', data: { unitType: '분', unitAmount: 30 } } as never);
      return () => {};
    });

    render(<SettingsScreen onBack={jest.fn()} />);
    await waitFor(() => expect(screen.getByTestId('watch-ad-for-ad-free')).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByTestId('watch-ad-for-ad-free'));
      // Let the grantAdFreeMinutes() promise chain (Storage.setItem then the
      // setAdFreeMinutesLeft state update) settle inside this act() scope.
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockedStorage.setItem).toHaveBeenCalled();
    expect(screen.getByTestId('ad-free-status')).toBeTruthy();
  });

  it('shows a coming-soon alert when the subscribe button is pressed', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    render(<SettingsScreen onBack={jest.fn()} />);
    fireEvent.press(screen.getByTestId('subscribe-button'));
    expect(alertSpy).toHaveBeenCalledWith('준비 중이에요', '구독 결제는 곧 만나보실 수 있어요.');
    alertSpy.mockRestore();
  });
});
