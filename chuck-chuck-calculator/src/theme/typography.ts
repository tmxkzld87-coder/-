import type { TextStyle } from 'react-native';

export const fontWeights = {
  bold: '700',
  regular: '400',
} as const satisfies Record<string, TextStyle['fontWeight']>;

export const fontSizes = {
  title: 22,
  body: 15,
  caption: 13,
  resultLarge: 28,
} as const;

export const tabularNums: Pick<TextStyle, 'fontVariant'> = {
  fontVariant: ['tabular-nums'],
};
