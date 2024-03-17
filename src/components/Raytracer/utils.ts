export const hexToRgb01 = (hex: string): [number, number, number] => {
  hex = hex.replace(/^#/, '');
  const int = parseInt(hex, 16);
  const r = (int >> 16) & 255; // eslint-disable-line no-bitwise
  const g = (int >> 8) & 255; // eslint-disable-line no-bitwise
  const b = int & 255; // eslint-disable-line no-bitwise
  return [r / 255, g / 255, b / 255];
};
