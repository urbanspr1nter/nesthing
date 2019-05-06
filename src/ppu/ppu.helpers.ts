export function getBaseNametableAddress(reg$2000: number): number {
  const base = reg$2000 & 0x03;
  switch (base) {
    case 0x00:
      return 0x2000;
    case 0x01:
      return 0x2400;
    case 0x02:
      return 0x2800;
    case 0x03:
      return 0x2c00;
  }

  return 0x2000;
}

/**
 * Gets the base palette address from the attribute byte and the group.
 *
 * Attribute byte is in the following format: 3322 1100
 *
 * Now we do Y %2 and X % 2 and map to this table
 *
 *      X | Y | Attribute Group
 *      -----------------------
 *      0 | 0 | 0
 *      1 | 0 | 1
 *      0 | 1 | 2
 *      1 | 1 | 3
 *
 * @param attributeByte The attribute byte
 * @param attributeGroup The attribute group
 */
export function getBasePaletteAddress(
  attributeByte: number,
  attributeGroup: number
): number {
  const result =
    (attributeByte & (0x3 << (attributeGroup * 2))) >> (attributeGroup * 2);

  switch (result) {
    case 0:
      return 0x3f01;
    case 1:
      return 0x3f05;
    case 2:
      return 0x3f09;
    case 3:
      return 0x3f0d;
  }

  // Universal background color
  return 0x3f00;
}

export function getAttributeGroupIndex(hTileX: number, vTileY: number): number {
  const x = hTileX % 2;
  const y = vTileY % 2;

  if (x === 0 && y == 0) {
    return 0;
  } else if (x === 1 && y === 0) {
    return 1;
  } else if (x === 0 && y === 1) {
    return 2;
  } else if (x === 1 && y === 1) {
    return 3;
  }

  return 0;
}
