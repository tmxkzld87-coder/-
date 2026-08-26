import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Storage } from '@apps-in-toss/framework';
import { CostScreen } from './CostScreen';

jest.mock('@apps-in-toss/framework', () => ({
  Storage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
  InlineAd: () => null,
  loadFullScreenAd: jest.fn(() => () => {}),
  showFullScreenAd: jest.fn(() => () => {}),
}));

const mockedStorage = jest.mocked(Storage);

function addIngredient() {
  fireEvent.press(screen.getByTestId('add-ingredient'));
}

describe('CostScreen', () => {
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
    render(<CostScreen onBack={onBack} />);
    fireEvent.press(screen.getByTestId('cost-back-button'));
    expect(onBack).toHaveBeenCalled();
  });

  it('shows a live result of 0 with no ingredients added yet', () => {
    render(<CostScreen />);
    expect(screen.getByTestId('unit-cost-value')).toHaveTextContent('0원');
    expect(screen.getByTestId('cost-rate-value')).toHaveTextContent('0%');
  });

  it('computes an ingredient cost converting purchase unit to used unit (kg -> g)', () => {
    render(<CostScreen />);
    addIngredient();
    const ids = screen.getAllByTestId(/^cost-item-card-/);
    const id = ids[0]!.props.testID as string;

    fireEvent.changeText(screen.getByTestId(`${id.replace('cost-item-card-', 'cost-item-purchase-price-')}-input`), '20000');
    fireEvent.press(screen.getByTestId(`${id.replace('cost-item-card-', 'cost-item-purchase-qty-')}-unit`)); // g -> kg
    fireEvent.changeText(screen.getByTestId(`${id.replace('cost-item-card-', 'cost-item-purchase-qty-')}-input`), '1');
    fireEvent.changeText(screen.getByTestId(`${id.replace('cost-item-card-', 'cost-item-used-qty-')}-input`), '20');

    // 20000 / 1kg(1000g) * 20g = 400
    expect(screen.getByTestId(`${id.replace('cost-item-card-', 'cost-item-cost-')}`)).toHaveTextContent('400원');
    expect(screen.getByTestId('unit-cost-value')).toHaveTextContent('400원');
  });

  it('adds an additional cost from a suggestion chip prefilled with unit 개 and qty 1', () => {
    render(<CostScreen />);
    fireEvent.press(screen.getByTestId('add-additional-suggestion-컵'));
    const ids = screen.getAllByTestId(/^cost-item-card-/);
    expect(ids).toHaveLength(1);
    expect(screen.getByDisplayValue('컵')).toBeTruthy();
  });

  it('shows a VAT-inclusive breakdown once the toggle is on and a selling price is set', () => {
    render(<CostScreen />);
    fireEvent.changeText(screen.getByTestId('input-selling-price'), '11000');
    fireEvent.press(screen.getByTestId('vat-toggle'));

    expect(screen.getByTestId('vat-breakdown')).toHaveTextContent('공급가액 10,000원 · 부가세 1,000원 (참고용 계산)');
  });

  it('computes cost-rate status and colors it once selling price and cost are both set', () => {
    render(<CostScreen />);
    fireEvent.changeText(screen.getByTestId('input-selling-price'), '1000');
    addIngredient();
    const id = (screen.getAllByTestId(/^cost-item-card-/)[0]!.props.testID as string).replace('cost-item-card-', '');
    fireEvent.changeText(screen.getByTestId(`cost-item-purchase-price-${id}-input`), '250');
    fireEvent.changeText(screen.getByTestId(`cost-item-purchase-qty-${id}-input`), '1');
    fireEvent.changeText(screen.getByTestId(`cost-item-used-qty-${id}-input`), '1');

    expect(screen.getByTestId('cost-rate-status')).toBeTruthy();
  });

  it('recalculates the target price when the target cost rate section is edited (open by default)', () => {
    render(<CostScreen />);
    addIngredient();
    const id = (screen.getAllByTestId(/^cost-item-card-/)[0]!.props.testID as string).replace('cost-item-card-', '');
    fireEvent.changeText(screen.getByTestId(`cost-item-purchase-price-${id}-input`), '300');
    fireEvent.changeText(screen.getByTestId(`cost-item-purchase-qty-${id}-input`), '1');
    fireEvent.changeText(screen.getByTestId(`cost-item-used-qty-${id}-input`), '1');
    fireEvent.changeText(screen.getByTestId('input-target-cost-rate'), '30');

    expect(screen.getByTestId('target-price-result')).toHaveTextContent('목표 판매가1,000원');
  });

  it('resets every field when 새로운 계산 is pressed', () => {
    render(<CostScreen />);
    fireEvent.changeText(screen.getByTestId('input-selling-price'), '5000');
    addIngredient();
    fireEvent.press(screen.getByTestId('reset-button'));

    expect(screen.queryByDisplayValue('5000')).toBeNull();
    expect(screen.queryAllByTestId(/^cost-item-card-/)).toHaveLength(0);
  });

  it('blocks saving without a selling price', () => {
    render(<CostScreen />);
    fireEvent.press(screen.getByTestId('save-button'));
    expect(Alert.alert).toHaveBeenCalledWith('판매 가격을 입력해주세요.');
    expect(screen.queryByTestId('save-title-input')).toBeNull();
  });

  it('blocks saving with no ingredients or additional costs', () => {
    render(<CostScreen />);
    fireEvent.changeText(screen.getByTestId('input-selling-price'), '5000');
    fireEvent.press(screen.getByTestId('save-button'));
    expect(Alert.alert).toHaveBeenCalledWith('재료를 하나 이상 추가해주세요.');
  });

  it('saves a history entry with a title and a computed summary', async () => {
    render(<CostScreen />);
    fireEvent.changeText(screen.getByTestId('input-selling-price'), '5000');
    addIngredient();
    fireEvent.press(screen.getByTestId('save-button'));
    fireEvent.changeText(screen.getByTestId('save-title-input'), '아메리카노');
    fireEvent.press(screen.getByTestId('save-confirm'));

    await waitFor(() => expect(mockedStorage.setItem).toHaveBeenCalled());
    const [, savedJson] = mockedStorage.setItem.mock.calls[0]!;
    expect(JSON.parse(savedJson)[0]).toMatchObject({ calculatorType: 'cost', title: '아메리카노' });
  });

  it('lists only cost-calculator entries in the 최근 계산 sheet', async () => {
    mockedStorage.getItem.mockResolvedValue(
      JSON.stringify([
        { id: '1', calculatorType: 'cost', title: '아메리카노', summary: '판매가 5,000원', createdAt: 1 },
        { id: '2', calculatorType: 'discount', title: '세일가', summary: '', createdAt: 2 },
      ]),
    );
    render(<CostScreen />);
    fireEvent.press(screen.getByTestId('cost-open-history'));

    await waitFor(() => expect(screen.getByText('아메리카노')).toBeTruthy());
    expect(screen.queryByText('세일가')).toBeNull();
  });
});
