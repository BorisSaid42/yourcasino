export type RouletteColor = 'red' | 'black' | 'green';

interface RouletteField {
  value: string;
  color: RouletteColor;
}

export const rouletteMap: RouletteField[] = [
  { value: '32', color: 'red' },
  { value: '15', color: 'black' },
  { value: '19', color: 'red' },
  { value: '4', color: 'black' },
  { value: '21', color: 'red' },
  { value: '2', color: 'black' },
  { value: '25', color: 'red' },
  { value: '17', color: 'black' },
  { value: '34', color: 'red' },
  { value: '6', color: 'black' },
  { value: '27', color: 'red' },
  { value: '13', color: 'black' },
  { value: '36', color: 'red' },
  { value: '11', color: 'black' },
  { value: '30', color: 'red' },
  { value: '8', color: 'black' },
  { value: '23', color: 'red' },
  { value: '10', color: 'black' },
  { value: '5', color: 'red' },
  { value: '24', color: 'black' },
  { value: '16', color: 'red' },
  { value: '33', color: 'black' },
  { value: '1', color: 'red' },
  { value: '20', color: 'black' },
  { value: '14', color: 'red' },
  { value: '31', color: 'black' },
  { value: '9', color: 'red' },
  { value: '22', color: 'black' },
  { value: '18', color: 'red' },
  { value: '29', color: 'black' },
  { value: '7', color: 'red' },
  { value: '28', color: 'black' },
  { value: '12', color: 'red' },
  { value: '35', color: 'black' },
  { value: '3', color: 'red' },
  { value: '26', color: 'black' },
  { value: '0', color: 'green' },
  { value: 'Red', color: 'red' },
  { value: 'Black', color: 'black' },
];

export const findColorResult = (value: string): string => {
  const resultColor = rouletteMap.find((rouletteValue) => rouletteValue.value === value);

  if (!resultColor) {
    return 'gray';
  }

  return resultColor.color;
};
