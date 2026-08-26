import { colors } from './colors';

describe('colors', () => {
  it('matches the spec color tokens exactly', () => {
    expect(colors).toEqual({
      primaryBlue: '#3182F6',
      darkText: '#191F28',
      secondaryText: '#8B95A1',
      divider: '#F2F4F6',
      background: '#FFFFFF',
      lightBlueBackground: '#EAF3FF',
      success: '#20C997',
      warning: '#FFB020',
      error: '#F04452',
    });
  });
});
