import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Storage } from '@apps-in-toss/framework';
import { HistoryScreen } from './HistoryScreen';

jest.mock('@apps-in-toss/framework', () => ({
  Storage: { getItem: jest.fn(), setItem: jest.fn() },
  InlineAd: () => null,
}));

const mockedStorage = jest.mocked(Storage);

describe('HistoryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedStorage.getItem.mockResolvedValue(null);
  });

  it('calls onBack when the back button is pressed', () => {
    render(<HistoryScreen onBack={jest.fn()} onOpenCalculator={jest.fn()} />);
    fireEvent.press(screen.getByTestId('history-back-button'));
  });

  it('shows an empty message when there is no history', async () => {
    render(<HistoryScreen onBack={jest.fn()} onOpenCalculator={jest.fn()} />);
    await waitFor(() => expect(screen.getByText('아직 저장한 계산이 없어요.')).toBeTruthy());
  });

  it('shows the free-tier upgrade banner when not subscribed', async () => {
    render(<HistoryScreen onBack={jest.fn()} onOpenCalculator={jest.fn()} />);
    await waitFor(() => expect(screen.getByTestId('upgrade-banner')).toBeTruthy());
  });

  it('lists stored entries with their calculator name and lets you open one', async () => {
    const stored = [{ id: 'a', calculatorType: 'cost', title: '아메리카노', summary: '원가율 10%', createdAt: 1_700_000_000_000 }];
    mockedStorage.getItem.mockResolvedValue(JSON.stringify(stored));
    const onOpenCalculator = jest.fn();
    render(<HistoryScreen onBack={jest.fn()} onOpenCalculator={onOpenCalculator} />);

    await waitFor(() => expect(screen.getByTestId('history-entry-a')).toBeTruthy());
    expect(screen.getByText('아메리카노')).toBeTruthy();

    fireEvent.press(screen.getByTestId('history-entry-a'));
    expect(onOpenCalculator).toHaveBeenCalledWith('/cost');
  });

  it('deletes an entry when its delete button is pressed', async () => {
    const stored = [{ id: 'a', calculatorType: 'cost', title: '아메리카노', summary: '', createdAt: 1_700_000_000_000 }];
    mockedStorage.getItem.mockResolvedValue(JSON.stringify(stored));
    render(<HistoryScreen onBack={jest.fn()} onOpenCalculator={jest.fn()} />);

    await waitFor(() => expect(screen.getByTestId('history-entry-a')).toBeTruthy());
    fireEvent.press(screen.getByTestId('history-delete-a'));

    await waitFor(() => expect(mockedStorage.setItem).toHaveBeenCalledWith('calculator-history-v1', JSON.stringify([])));
    await waitFor(() => expect(screen.queryByTestId('history-entry-a')).toBeNull());
  });
});
