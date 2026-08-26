import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Storage } from '@apps-in-toss/framework';
import { ProfitRateScreen } from './ProfitRateScreen';

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

describe('ProfitRateScreen', () => {
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
    render(<ProfitRateScreen onBack={onBack} />);
    fireEvent.press(screen.getByTestId('profit-rate-back-button'));
    expect(onBack).toHaveBeenCalled();
  });

  it('shows no result until both prices are filled in', () => {
    render(<ProfitRateScreen />);
    expect(screen.queryByTestId('profit-rate-result')).toBeNull();
  });

  it('shows ROI as the hero by default, with margin rate always in the sub card', () => {
    render(<ProfitRateScreen />);
    fireEvent.changeText(screen.getByTestId('input-cost-price'), '8000');
    fireEvent.changeText(screen.getByTestId('input-sell-price'), '10000');

    expect(screen.getByText('25%')).toBeTruthy();
    expect(screen.getByText('20%')).toBeTruthy();
    expect(screen.getByText('2,000원')).toBeTruthy();
  });

  it('switches the hero to margin rate when that basis chip is selected', () => {
    render(<ProfitRateScreen />);
    fireEvent.changeText(screen.getByTestId('input-cost-price'), '8000');
    fireEvent.changeText(screen.getByTestId('input-sell-price'), '10000');
    fireEvent.press(screen.getByTestId('basis-margin'));

    expect(screen.getByTestId('profit-rate-hero')).toHaveTextContent('매출 대비 마진율20%');
  });

  it('shows an inline error for a non-positive price', () => {
    render(<ProfitRateScreen />);
    fireEvent.changeText(screen.getByTestId('input-cost-price'), '0');
    fireEvent.changeText(screen.getByTestId('input-sell-price'), '10000');

    expect(screen.queryByTestId('profit-rate-result')).toBeNull();
    expect(screen.getByTestId('profit-rate-error')).toBeTruthy();
  });

  it('saves a history entry once a result exists', async () => {
    render(<ProfitRateScreen />);
    fireEvent.changeText(screen.getByTestId('input-cost-price'), '8000');
    fireEvent.changeText(screen.getByTestId('input-sell-price'), '10000');
    fireEvent.press(screen.getByTestId('save-button'));
    fireEvent.press(screen.getByTestId('save-confirm'));

    await waitFor(() => expect(mockedStorage.setItem).toHaveBeenCalled());
    const [, savedJson] = mockedStorage.setItem.mock.calls[0]!;
    expect(JSON.parse(savedJson)[0]).toMatchObject({ calculatorType: 'profit-rate' });
  });
});
