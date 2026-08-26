import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  it('shows the default placeholder and forwards text changes', () => {
    const onChangeText = jest.fn();
    render(<SearchBar value="" onChangeText={onChangeText} />);
    const input = screen.getByTestId('search-bar-input');
    expect(input.props.placeholder).toBe('어떤 계산을 할까요?');
    fireEvent.changeText(input, '원가');
    expect(onChangeText).toHaveBeenCalledWith('원가');
  });
});
