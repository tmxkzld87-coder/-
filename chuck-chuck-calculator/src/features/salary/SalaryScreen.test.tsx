import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Storage } from '@apps-in-toss/framework';
import { SalaryScreen } from './SalaryScreen';

jest.mock('@apps-in-toss/framework', () => ({
  Storage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
  InlineAd: () => null,
}));

const mockedStorage = jest.mocked(Storage);

describe('SalaryScreen', () => {
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
    render(<SalaryScreen onBack={onBack} />);
    fireEvent.press(screen.getByTestId('salary-back-button'));
    expect(onBack).toHaveBeenCalled();
  });

  it('shows no result until the hourly wage is filled in (default mode)', () => {
    render(<SalaryScreen />);
    expect(screen.queryByTestId('hourly-result')).toBeNull();
  });

  it('computes monthly pay from hourly wage with weekly-holiday pay included by default', () => {
    render(<SalaryScreen />);
    fireEvent.changeText(screen.getByTestId('input-hourly-wage'), '10000');

    expect(screen.getByText('2,085,600원')).toBeTruthy();
  });

  it('drops weekly-holiday pay when the toggle is switched off', () => {
    render(<SalaryScreen />);
    fireEvent.changeText(screen.getByTestId('input-hourly-wage'), '10000');
    fireEvent.press(screen.getByTestId('weekly-holiday-toggle'));

    expect(screen.getByText('1,738,000원')).toBeTruthy();
  });

  it('converts an annual salary into monthly pay and an hourly rate', () => {
    render(<SalaryScreen />);
    fireEvent.press(screen.getByTestId('mode-annual'));
    fireEvent.changeText(screen.getByTestId('input-annual-salary'), '36000000');

    expect(screen.getByText('3,000,000원')).toBeTruthy();
  });

  it('shows an approximate net pay with an accuracy disclaimer', () => {
    render(<SalaryScreen />);
    fireEvent.press(screen.getByTestId('mode-net-pay'));
    fireEvent.changeText(screen.getByTestId('input-monthly-gross-pay'), '3000000');

    expect(screen.getByTestId('net-pay-result')).toBeTruthy();
    expect(screen.getByText(/참고용 계산/)).toBeTruthy();
  });

  it('saves a history entry once a result exists', async () => {
    render(<SalaryScreen />);
    fireEvent.changeText(screen.getByTestId('input-hourly-wage'), '10000');
    fireEvent.press(screen.getByTestId('save-button'));
    fireEvent.press(screen.getByTestId('save-confirm'));

    await waitFor(() => expect(mockedStorage.setItem).toHaveBeenCalled());
    const [, savedJson] = mockedStorage.setItem.mock.calls[0]!;
    expect(JSON.parse(savedJson)[0]).toMatchObject({ calculatorType: 'salary' });
  });
});
