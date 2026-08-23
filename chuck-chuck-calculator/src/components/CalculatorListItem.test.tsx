import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { CalculatorListItem } from './CalculatorListItem';
import { findCalculator } from '../data/calculators';

describe('CalculatorListItem', () => {
  it('renders the calculator name/description and fires onPress', () => {
    const onPress = jest.fn();
    const calculator = findCalculator('vat');
    render(<CalculatorListItem calculator={calculator} onPress={onPress} />);
    expect(screen.getByText('부가세')).toBeTruthy();
    fireEvent.press(screen.getByTestId('calculator-list-item-vat'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
