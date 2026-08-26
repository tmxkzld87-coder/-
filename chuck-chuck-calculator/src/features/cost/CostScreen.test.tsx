import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { CostScreen } from './CostScreen';

describe('CostScreen', () => {
  it('shows no result until the required inputs are filled in', () => {
    render(<CostScreen />);
    expect(screen.queryByTestId('cost-result')).toBeNull();
  });

  it('computes the result live in marginToPrice mode (default)', () => {
    render(<CostScreen />);
    fireEvent.changeText(screen.getByTestId('input-material-cost'), '3000');
    fireEvent.changeText(screen.getByTestId('input-sub-material-cost'), '500');
    fireEvent.changeText(screen.getByTestId('input-margin-rate'), '30');

    expect(screen.getByText('70%')).toBeTruthy();
    expect(screen.getByText('5,000원')).toBeTruthy();
    expect(screen.getByText('1,500원')).toBeTruthy();
  });

  it('computes the same result in priceToMargin mode for equivalent inputs', () => {
    render(<CostScreen />);
    fireEvent.press(screen.getByTestId('mode-price-to-margin'));
    fireEvent.changeText(screen.getByTestId('input-material-cost'), '3000');
    fireEvent.changeText(screen.getByTestId('input-sub-material-cost'), '500');
    fireEvent.changeText(screen.getByTestId('input-selling-price'), '5000');

    expect(screen.getByText('70%')).toBeTruthy();
    expect(screen.getByText('5,000원')).toBeTruthy();
    expect(screen.getByText('1,500원')).toBeTruthy();
  });

  it('shows an error message instead of silently hiding the result when the margin rate is 100 or more', () => {
    render(<CostScreen />);
    fireEvent.changeText(screen.getByTestId('input-material-cost'), '1000');
    fireEvent.changeText(screen.getByTestId('input-margin-rate'), '100');

    expect(screen.queryByTestId('cost-result')).toBeNull();
    expect(screen.getByTestId('cost-error')).toBeTruthy();
  });

  it('shows an error message instead of silently hiding the result when the selling price is 0', () => {
    render(<CostScreen />);
    fireEvent.press(screen.getByTestId('mode-price-to-margin'));
    fireEvent.changeText(screen.getByTestId('input-material-cost'), '1000');
    fireEvent.changeText(screen.getByTestId('input-selling-price'), '0');

    expect(screen.queryByTestId('cost-result')).toBeNull();
    expect(screen.getByTestId('cost-error')).toBeTruthy();
  });

  it('does not misrepresent a loss as a success-colored profit', () => {
    render(<CostScreen />);
    fireEvent.press(screen.getByTestId('mode-price-to-margin'));
    fireEvent.changeText(screen.getByTestId('input-material-cost'), '5000');
    fireEvent.changeText(screen.getByTestId('input-selling-price'), '3000');

    const profitValue = screen.getByText('-2,000원');
    expect(profitValue.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: '#F04452' })]),
    );
  });
});
