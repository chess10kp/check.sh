export interface ColorTheme {
  boardWhite: { r: number; g: number; b: number };
  boardBlack: { r: number; g: number; b: number };
  pieceWhite: string;
  pieceBlack: string;
  highlight: string;
  text: string;
  accent: string;
}

export const defaultTheme: ColorTheme = {
  boardWhite: { r: 160, g: 160, b: 160 },
  boardBlack: { r: 128, g: 95, b: 69 },
  pieceWhite: 'white',
  pieceBlack: 'black',
  highlight: 'lightblue',
  text: 'white',
  accent: 'cyan',
};

export function rgbToInkColor(rgb: { r: number; g: number; b: number }): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}
