import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Storage } from '@apps-in-toss/framework';
import { HomeScreen } from './HomeScreen';

jest.mock('@apps-in-toss/framework', () => ({
  Storage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
  InlineAd: () => null,
}));

const mockedStorage = jest.mocked(Storage);

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedStorage.getItem.mockResolvedValue(null);
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows all 8 calculators in the full list by default', () => {
    render(<HomeScreen onNavigateToCalculator={jest.fn()} onOpenSettings={jest.fn()} onOpenHistory={jest.fn()} />);
    expect(screen.getByTestId('calculator-list-item-vat')).toBeTruthy();
    expect(screen.getByTestId('calculator-list-item-cost')).toBeTruthy();
  });

  it('filters the full list when searching, and hides the frequently-used grid', () => {
    render(<HomeScreen onNavigateToCalculator={jest.fn()} onOpenSettings={jest.fn()} onOpenHistory={jest.fn()} />);
    fireEvent.changeText(screen.getByTestId('search-bar-input'), '원가');
    expect(screen.getByTestId('calculator-list-item-cost')).toBeTruthy();
    expect(screen.queryByTestId('calculator-list-item-vat')).toBeNull();
    expect(screen.queryByTestId('calculator-card-cost')).toBeNull();
  });

  it('navigates and records usage when tapping the implemented (cost) calculator', async () => {
    const onNavigateToCalculator = jest.fn();
    render(<HomeScreen onNavigateToCalculator={onNavigateToCalculator} onOpenSettings={jest.fn()} onOpenHistory={jest.fn()} />);
    fireEvent.press(screen.getByTestId('calculator-list-item-cost'));
    // handlePressCalculator is async (awaits recordUsage before navigating), and
    // RTL's fireEvent.press does not await the handler's returned promise, so both
    // assertions must wait for the microtask to flush.
    await waitFor(() => expect(onNavigateToCalculator).toHaveBeenCalledWith('/cost'));
    expect(mockedStorage.setItem).toHaveBeenCalled();
  });

  // All 8 initial calculators are implemented now, so there's no `implemented: false`
  // entry left in real data to exercise the "준비 중" alert path in handlePressCalculator.
  // Re-add a test for it once a new calculator lands in data/calculators.ts unimplemented.

  it('shows recent-use chips only after a usage record exists', async () => {
    mockedStorage.getItem.mockResolvedValue(
      JSON.stringify([{ calculatorId: 'cost', lastUsedAt: 1, useCount: 1 }]),
    );
    render(<HomeScreen onNavigateToCalculator={jest.fn()} onOpenSettings={jest.fn()} onOpenHistory={jest.fn()} />);
    await waitFor(() => expect(screen.getByTestId('recent-usage-chip-cost')).toBeTruthy());
  });

  it('opens settings when the settings tab is pressed', () => {
    const onOpenSettings = jest.fn();
    render(<HomeScreen onNavigateToCalculator={jest.fn()} onOpenSettings={onOpenSettings} onOpenHistory={jest.fn()} />);
    fireEvent.press(screen.getByTestId('bottom-nav-settings'));
    expect(onOpenSettings).toHaveBeenCalled();
  });

  it('opens history when the history tab is pressed', () => {
    const onOpenHistory = jest.fn();
    render(<HomeScreen onNavigateToCalculator={jest.fn()} onOpenSettings={jest.fn()} onOpenHistory={onOpenHistory} />);
    fireEvent.press(screen.getByTestId('bottom-nav-history'));
    expect(onOpenHistory).toHaveBeenCalled();
  });

  it('shows section titles for the frequently-used grid and the full list', () => {
    render(<HomeScreen onNavigateToCalculator={jest.fn()} onOpenSettings={jest.fn()} onOpenHistory={jest.fn()} />);
    expect(screen.getByText('자주 사용')).toBeTruthy();
    expect(screen.getByText('전체 계산기')).toBeTruthy();
  });
});
