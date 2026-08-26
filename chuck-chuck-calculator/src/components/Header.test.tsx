import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Header } from './Header';

describe('Header', () => {
  it('renders the title and subtitle', () => {
    render(<Header title="척척 계산기" subtitle="필요한 계산, 한 번에" />);
    expect(screen.getByText('척척 계산기')).toBeTruthy();
    expect(screen.getByText('필요한 계산, 한 번에')).toBeTruthy();
  });

  it('omits the subtitle text when not provided', () => {
    render(<Header title="척척 계산기" />);
    expect(screen.queryByText('필요한 계산, 한 번에')).toBeNull();
  });
});
