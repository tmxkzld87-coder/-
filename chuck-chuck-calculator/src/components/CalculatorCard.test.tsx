import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { CalculatorCard } from './CalculatorCard';
import { findCalculator } from '../data/calculators';

describe('CalculatorCard', () => {
  it('renders the calculator name/description and fires onPress', () => {
    const onPress = jest.fn();
    const calculator = findCalculator('cost');
    render(<CalculatorCard calculator={calculator} onPress={onPress} />);
    expect(screen.getByText('원가 · 마진')).toBeTruthy();
    fireEvent.press(screen.getByTestId('calculator-card-cost'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
