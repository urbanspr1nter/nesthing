import { ColorComponent } from "./framebuffer";

export const byteValue2HexString = (byteValue: number): string => {
  let hex = byteValue.toString(16).toUpperCase();

  if (hex.length < 2) {
    hex = `0${hex}`;
  }

  return hex;
};

export const shortValue2HexString = (byteValue: number): string => {
  let hex = byteValue.toString(16).toUpperCase();

  while(hex.length < 4) {
    hex = `0${hex}`;
  }

  return hex;
};

export const buildRgbString = (color: ColorComponent): string => {
  return 'rgba(' + color.r + ', ' + color.g + ', ' + color.b + ')';
};
