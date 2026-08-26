import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Storage } from '@apps-in-toss/framework';
import { SplitBillScreen } from './SplitBillScreen';

jest.mock('@apps-in-toss/framework', () => ({
  Storage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
  InlineAd: () => null,
}));

const mockedStorage = jest.mocked(Storage);

describe('SplitBillScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedStorage.getItem.mockResolvedValue(null);
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('calls onBack when the header back button is pressed', () => {
    const onBack = jest.fn();
    render(<SplitBillScreen onBack={onBack} />);
    fireEvent.press(screen.getByTestId('split-bill-back-button'));
    expect(onBack).toHaveBeenCalled();
  });

  it('shows no result until the total amount is filled in (even mode, default)', () => {
    render(<SplitBillScreen />);
    expect(screen.queryByTestId('even-result')).toBeNull();
  });

  it('splits the total evenly with the default headcount and round unit', () => {
    render(<SplitBillScreen />);
    fireEvent.changeText(screen.getByTestId('input-total-amount'), '10000');

    expect(screen.getByText('5,000원')).toBeTruthy();
    expect(screen.getByText('정확히 나눠떨어져요')).toBeTruthy();
  });

  it('increments headcount via the stepper and recalculates', () => {
    render(<SplitBillScreen />);
    fireEvent.changeText(screen.getByTestId('input-total-amount'), '10000');
    fireEvent.press(screen.getByTestId('headcount-stepper-increment'));
    expect(screen.getByTestId('headcount-stepper-value')).toHaveTextContent('3명');
  });

  it('lets each participant get a custom name that shows up in the settlement line', () => {
    render(<SplitBillScreen />);
    fireEvent.press(screen.getByTestId('mode-weighted'));
    fireEvent.changeText(screen.getByTestId('input-participant-name-0'), '민수');
    fireEvent.changeText(screen.getByTestId('input-participant-name-1'), '지현');
    fireEvent.changeText(screen.getByTestId('input-participant-amount-0'), '30000');
    fireEvent.changeText(screen.getByTestId('input-participant-amount-1'), '0');

    expect(screen.getByTestId('transfer-0')).toHaveTextContent('지현 → 민수 : 15,000원');
  });

  it('falls back to 참가자 N when a name is left blank', () => {
    render(<SplitBillScreen />);
    fireEvent.press(screen.getByTestId('mode-weighted'));
    fireEvent.changeText(screen.getByTestId('input-participant-amount-0'), '30000');
    fireEvent.changeText(screen.getByTestId('input-participant-amount-1'), '0');

    expect(screen.getByTestId('transfer-0')).toHaveTextContent('참가자 2 → 참가자 1 : 15,000원');
  });

  it('saves a history entry once a result exists', async () => {
    render(<SplitBillScreen />);
    fireEvent.changeText(screen.getByTestId('input-total-amount'), '10000');
    fireEvent.press(screen.getByTestId('save-button'));
    fireEvent.press(screen.getByTestId('save-confirm'));

    await waitFor(() => expect(mockedStorage.setItem).toHaveBeenCalled());
    const [, savedJson] = mockedStorage.setItem.mock.calls[0]!;
    expect(JSON.parse(savedJson)[0]).toMatchObject({ calculatorType: 'split-bill' });
  });
});
