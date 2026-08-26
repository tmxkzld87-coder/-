import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Storage } from '@apps-in-toss/framework';
import { ShippingFeeScreen } from './ShippingFeeScreen';

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

describe('ShippingFeeScreen', () => {
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
    render(<ShippingFeeScreen onBack={onBack} />);
    fireEvent.press(screen.getByTestId('shipping-fee-back-button'));
    expect(onBack).toHaveBeenCalled();
  });

  it('shows no result until required inputs are filled in', () => {
    render(<ShippingFeeScreen />);
    expect(screen.queryByTestId('shipping-fee-result')).toBeNull();
  });

  it('defaults quantity to 1 via the stepper and never goes below it', () => {
    render(<ShippingFeeScreen />);
    expect(screen.getByTestId('quantity-stepper-value')).toHaveTextContent('1개');
    fireEvent.press(screen.getByTestId('quantity-stepper-decrement'));
    expect(screen.getByTestId('quantity-stepper-value')).toHaveTextContent('1개');
  });

  it('charges shipping by default with no free-shipping threshold', () => {
    render(<ShippingFeeScreen />);
    fireEvent.changeText(screen.getByTestId('input-unit-price'), '10000');
    fireEvent.press(screen.getByTestId('quantity-stepper-increment'));
    fireEvent.changeText(screen.getByTestId('input-shipping-fee'), '3000');

    expect(screen.getByText('23,000원')).toBeTruthy();
    expect(screen.queryByTestId('free-shipping-banner')).toBeNull();
  });

  it('shows how much more is needed once a free-shipping threshold is set', () => {
    render(<ShippingFeeScreen />);
    fireEvent.changeText(screen.getByTestId('input-unit-price'), '10000');
    fireEvent.changeText(screen.getByTestId('input-shipping-fee'), '3000');
    fireEvent.press(screen.getByTestId('threshold-toggle'));
    fireEvent.changeText(screen.getByTestId('input-free-shipping-threshold'), '30000');

    expect(screen.getByTestId('free-shipping-banner')).toHaveTextContent('무료배송까지 20,000원 남았어요');
  });

  it('switches the banner once the threshold is met', () => {
    render(<ShippingFeeScreen />);
    fireEvent.changeText(screen.getByTestId('input-unit-price'), '30000');
    fireEvent.changeText(screen.getByTestId('input-shipping-fee'), '3000');
    fireEvent.press(screen.getByTestId('threshold-toggle'));
    fireEvent.changeText(screen.getByTestId('input-free-shipping-threshold'), '30000');

    expect(screen.getByTestId('free-shipping-banner')).toHaveTextContent('무료배송 조건을 채웠어요');
  });

  it('shows an inline error for a non-positive unit price', () => {
    render(<ShippingFeeScreen />);
    fireEvent.changeText(screen.getByTestId('input-unit-price'), '0');
    fireEvent.changeText(screen.getByTestId('input-shipping-fee'), '3000');

    expect(screen.queryByTestId('shipping-fee-result')).toBeNull();
    expect(screen.getByTestId('shipping-fee-error')).toBeTruthy();
  });

  it('saves a history entry once a result exists', async () => {
    render(<ShippingFeeScreen />);
    fireEvent.changeText(screen.getByTestId('input-unit-price'), '10000');
    fireEvent.changeText(screen.getByTestId('input-shipping-fee'), '3000');
    fireEvent.press(screen.getByTestId('save-button'));
    fireEvent.press(screen.getByTestId('save-confirm'));

    await waitFor(() => expect(mockedStorage.setItem).toHaveBeenCalled());
    const [, savedJson] = mockedStorage.setItem.mock.calls[0]!;
    expect(JSON.parse(savedJson)[0]).toMatchObject({ calculatorType: 'shipping-fee' });
  });
});
