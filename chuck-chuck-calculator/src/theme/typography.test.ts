import { fontWeights, fontSizes, tabularNums } from './typography';

describe('typography', () => {
  it('defines the expected font weights', () => {
    expect(fontWeights).toEqual({ bold: '700', regular: '400' });
  });

  it('defines the expected font sizes', () => {
    expect(fontSizes).toEqual({ title: 22, body: 15, caption: 13, resultLarge: 28 });
  });

  it('defines a tabular-nums style with no fontFamily override', () => {
    expect(tabularNums).toEqual({ fontVariant: ['tabular-nums'] });
  });
});
