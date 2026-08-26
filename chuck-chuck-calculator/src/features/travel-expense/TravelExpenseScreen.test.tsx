import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Storage } from '@apps-in-toss/framework';
import { TravelExpenseScreen } from './TravelExpenseScreen';

jest.mock('@apps-in-toss/framework', () => ({
  Storage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
  InlineAd: () => null,
  loadFullScreenAd: jest.fn(() => () => {}),
  showFullScreenAd: jest.fn(() => () => {}),
}));

const mockedStorage = jest.mocked(Storage);

describe('TravelExpenseScreen', () => {
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
    render(<TravelExpenseScreen onBack={onBack} />);
    fireEvent.press(screen.getByTestId('travel-expense-back-button'));
    expect(onBack).toHaveBeenCalled();
  });

  it('shows an empty-state hint instead of a result when nothing has been entered', () => {
    render(<TravelExpenseScreen />);
    expect(screen.queryByTestId('travel-expense-result')).toBeNull();
  });

  it('defaults headcount to 2 via the stepper', () => {
    render(<TravelExpenseScreen />);
    expect(screen.getByTestId('headcount-stepper-value')).toHaveTextContent('2명');
  });

  it('computes total, per-person, and per-day once costs and days are entered', () => {
    render(<TravelExpenseScreen />);
    fireEvent.changeText(screen.getByTestId('input-days'), '5');
    fireEvent.changeText(screen.getByTestId('input-category-lodging'), '200000');
    fireEvent.changeText(screen.getByTestId('input-category-transport'), '100000');
    fireEvent.changeText(screen.getByTestId('input-category-food'), '150000');
    fireEvent.changeText(screen.getByTestId('input-category-activity'), '50000');

    expect(screen.getByText('500,000원')).toBeTruthy();
    expect(screen.getByText('250,000원')).toBeTruthy();
    expect(screen.getByText('100,000원')).toBeTruthy();
  });

  it('hides the per-day figure when days is left blank', () => {
    render(<TravelExpenseScreen />);
    fireEvent.changeText(screen.getByTestId('input-category-lodging'), '100000');

    expect(screen.getByTestId('travel-expense-result')).toBeTruthy();
    expect(screen.queryByText(/1일 평균/)).toBeNull();
  });

  it('always shows the N빵 계산기 hint banner', () => {
    render(<TravelExpenseScreen />);
    expect(screen.getByTestId('split-bill-hint')).toBeTruthy();
  });

  it('saves a history entry once a cost exists', async () => {
    render(<TravelExpenseScreen />);
    fireEvent.changeText(screen.getByTestId('input-category-lodging'), '100000');
    fireEvent.press(screen.getByTestId('save-button'));
    fireEvent.press(screen.getByTestId('save-confirm'));

    await waitFor(() => expect(mockedStorage.setItem).toHaveBeenCalled());
    const [, savedJson] = mockedStorage.setItem.mock.calls[0]!;
    expect(JSON.parse(savedJson)[0]).toMatchObject({ calculatorType: 'travel-expense' });
  });
});
