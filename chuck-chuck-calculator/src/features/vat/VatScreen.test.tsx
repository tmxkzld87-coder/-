import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Storage } from '@apps-in-toss/framework';
import { VatScreen } from './VatScreen';

jest.mock('@apps-in-toss/framework', () => ({
  Storage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
  InlineAd: () => null,
}));

const mockedStorage = jest.mocked(Storage);

describe('VatScreen', () => {
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
    render(<VatScreen onBack={onBack} />);
    fireEvent.press(screen.getByTestId('vat-back-button'));
    expect(onBack).toHaveBeenCalled();
  });

  it('shows no result until an input is filled in', () => {
    render(<VatScreen />);
    expect(screen.queryByTestId('vat-result')).toBeNull();
  });

  it('computes VAT from a supply amount (default mode)', () => {
    render(<VatScreen />);
    fireEvent.changeText(screen.getByTestId('input-supply-amount'), '10000');

    expect(screen.getByText('10,000원')).toBeTruthy();
    expect(screen.getByText('1,000원')).toBeTruthy();
    expect(screen.getByText('11,000원')).toBeTruthy();
  });

  it('computes supply amount and VAT from a VAT-included total', () => {
    render(<VatScreen />);
    fireEvent.press(screen.getByTestId('mode-from-total'));
    fireEvent.changeText(screen.getByTestId('input-total-amount'), '11000');

    expect(screen.getByText('10,000원')).toBeTruthy();
    expect(screen.getByText('1,000원')).toBeTruthy();
    expect(screen.getByText('11,000원')).toBeTruthy();
  });

  it('shows an inline error instead of a result for a non-positive amount', () => {
    render(<VatScreen />);
    fireEvent.changeText(screen.getByTestId('input-supply-amount'), '0');

    expect(screen.queryByTestId('vat-result')).toBeNull();
    expect(screen.getByTestId('vat-error')).toBeTruthy();
  });

  it('saves a history entry once a result exists', async () => {
    render(<VatScreen />);
    fireEvent.changeText(screen.getByTestId('input-supply-amount'), '10000');
    fireEvent.press(screen.getByTestId('save-button'));
    fireEvent.press(screen.getByTestId('save-confirm'));

    await waitFor(() => expect(mockedStorage.setItem).toHaveBeenCalled());
    const [, savedJson] = mockedStorage.setItem.mock.calls[0]!;
    expect(JSON.parse(savedJson)[0]).toMatchObject({ calculatorType: 'vat' });
  });
});
