import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { BottomNavigation } from './BottomNavigation';

describe('BottomNavigation', () => {
  it('fires onTabPress with the tapped tab id', () => {
    const onTabPress = jest.fn();
    render(<BottomNavigation activeTab="home" onTabPress={onTabPress} />);
    fireEvent.press(screen.getByTestId('bottom-nav-history'));
    expect(onTabPress).toHaveBeenCalledWith('history');
  });

  it('renders all three tabs', () => {
    render(<BottomNavigation activeTab="home" onTabPress={jest.fn()} />);
    expect(screen.getByTestId('bottom-nav-home')).toBeTruthy();
    expect(screen.getByTestId('bottom-nav-history')).toBeTruthy();
    expect(screen.getByTestId('bottom-nav-settings')).toBeTruthy();
  });
});
