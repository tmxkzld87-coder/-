import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Storage } from '@apps-in-toss/framework';
import { DiscountScreen } from './DiscountScreen';

jest.mock('@apps-in-toss/framework', () => ({
  Storage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
  InlineAd: () => null,
}));

const mockedStorage = jest.mocked(Storage);

describe('DiscountScreen', () => {
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
    render(<DiscountScreen onBack={onBack} />);
    fireEvent.press(screen.getByTestId('discount-back-button'));
    expect(onBack).toHaveBeenCalled();
  });

  it('shows no result until required inputs are filled in', () => {
    render(<DiscountScreen />);
    expect(screen.queryByTestId('discount-result')).toBeNull();
  });

  it('computes the discount rate from regular + discounted price (default mode)', () => {
    render(<DiscountScreen />);
    fireEvent.changeText(screen.getByTestId('input-regular-price'), '10000');
    fireEvent.changeText(screen.getByTestId('input-discounted-price'), '8000');

    expect(screen.getByText('20%')).toBeTruthy();
    expect(screen.getByText('2,000원')).toBeTruthy();
  });

  it('computes the discounted price from regular price + rate', () => {
    render(<DiscountScreen />);
    fireEvent.press(screen.getByTestId('mode-price'));
    fireEvent.changeText(screen.getByTestId('input-regular-price'), '10000');
    fireEvent.changeText(screen.getByTestId('input-discount-rate'), '20');

    expect(screen.getByText('8,000원')).toBeTruthy();
  });

  it('applies stacked discounts sequentially, not additively', () => {
    render(<DiscountScreen />);
    fireEvent.press(screen.getByTestId('mode-stacked'));
    fireEvent.changeText(screen.getByTestId('input-regular-price'), '10000');
    fireEvent.changeText(screen.getByTestId('input-stacked-rate-0'), '20');
    fireEvent.press(screen.getByTestId('add-stacked-rate'));
    fireEvent.changeText(screen.getByTestId('input-stacked-rate-1'), '10');

    expect(screen.getByText('7,200원')).toBeTruthy();
    expect(screen.getByText('28%')).toBeTruthy();
  });

  it('shows an inline error when the discounted price exceeds the regular price', () => {
    render(<DiscountScreen />);
    fireEvent.changeText(screen.getByTestId('input-regular-price'), '10000');
    fireEvent.changeText(screen.getByTestId('input-discounted-price'), '12000');

    expect(screen.queryByTestId('discount-result')).toBeNull();
    expect(screen.getByTestId('discount-error')).toBeTruthy();
  });

  it('saves a history entry once a result exists', async () => {
    render(<DiscountScreen />);
    fireEvent.changeText(screen.getByTestId('input-regular-price'), '10000');
    fireEvent.changeText(screen.getByTestId('input-discounted-price'), '8000');
    fireEvent.press(screen.getByTestId('save-button'));
    fireEvent.press(screen.getByTestId('save-confirm'));

    await waitFor(() => expect(mockedStorage.setItem).toHaveBeenCalled());
    const [, savedJson] = mockedStorage.setItem.mock.calls[0]!;
    expect(JSON.parse(savedJson)[0]).toMatchObject({ calculatorType: 'discount' });
  });
});
