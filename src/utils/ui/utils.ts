export const prettifyMemory = (memoryArray: number[]): string[] => {
  const data = [];
  for (let i = 0; i < memoryArray.length; i++) {
    const converted = memoryArray[i].toString(16).toUpperCase();
    if (converted.length < 2) {
      data.push(`0${converted}`);
    } else {
      data.push(converted);
    }
  }
  return data;
};

export const byteValue2HexString = (byteValue: number): string => {
  let hex = byteValue.toString(16).toUpperCase();

  if (hex.length < 2) {
    hex = `0${hex}`;
  }

  return hex;
};
