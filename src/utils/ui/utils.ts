export const prettifyMemory = (memoryArray: number[]): string[] => {
    const data = [];
    for(let i = 0; i < memoryArray.length; i++) {
        const converted = memoryArray[i].toString(16).toUpperCase();
        if(converted.length < 2) {
          data.push(`0${converted}`);
        } else {
          data.push(converted);
        }
      }
    return data;
}
