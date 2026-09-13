import {
  CANOPY_OUTER_RADIUS_FACTOR,
  CUBE_HEIGHT,
  MAX_CANOPY_LAYERS,
  TRUNK_LAYERS,
  TRUNK_RADIUS,
} from './constants';
import { BlockData, BlockType } from './types';

/**
 * Pseudo-random function for organic variation.
 */
function pseudoRandom(col: number, row: number, seed: number = 0): number {
  const s = Math.sin(col * 127.1 + row * 311.7 + seed * 43.7) * 43758.5;
  return s - Math.floor(s);
}

/**
 * Generates 3D block data for a cherry blossom tree visualization of a QR code.
 */
export function generateBlockData(qrMatrix: boolean[][]): BlockData {
  const gridSize = qrMatrix.length;
  const cx = gridSize / 2;
  const cy = gridSize / 2;

  const positions: number[] = [];
  const heights: number[] = [];
  const baseY: number[] = [];
  const types: number[] = [];

  const canopyBaseHeight = TRUNK_LAYERS * CUBE_HEIGHT;
  const canopyOuterRadius = gridSize * CANOPY_OUTER_RADIUS_FACTOR;

  let blockCount = 0;

  // First pass: ground blocks
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const isQrDark = qrMatrix[row][col];
      const dx = col - cx;
      const dy = row - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      positions.push(col, row, 0, 0);
      heights.push(CUBE_HEIGHT);
      baseY.push(0);

      if (!isQrDark) {
        types.push(BlockType.Dirt);
      } else if (dist < TRUNK_RADIUS) {
        types.push(BlockType.Trunk);
      } else if (dist >= canopyOuterRadius) {
        types.push(BlockType.Grass);
      } else {
        types.push(BlockType.FallenPetals);
      }
      blockCount++;
    }
  }

  // Second pass: trunk blocks stacked vertically
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const isQrDark = qrMatrix[row][col];
      if (!isQrDark) continue;

      const dx = col - cx;
      const dy = row - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < TRUNK_RADIUS) {
        for (let layer = 1; layer < TRUNK_LAYERS; layer++) {
          positions.push(col, row, 0, 0);
          heights.push(CUBE_HEIGHT);
          baseY.push(layer * CUBE_HEIGHT);
          types.push(BlockType.Trunk);
          blockCount++;
        }
      }
    }
  }

  // Third pass: canopy foliage with dome shape
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const isQrDark = qrMatrix[row][col];
      if (!isQrDark) continue;

      const dx = col - cx;
      const dy = row - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < canopyOuterRadius) {
        const t = 1 - dist / canopyOuterRadius;
        const layersHere = Math.max(
          3,
          Math.round(MAX_CANOPY_LAYERS * (0.25 + 0.75 * t * t)),
        );

        for (let layer = 0; layer < layersHere; layer++) {
          const layerY = canopyBaseHeight + layer * CUBE_HEIGHT;
          const domeOffset = Math.floor(t * 3) * CUBE_HEIGHT;

          positions.push(col, row, 0, 0);
          heights.push(CUBE_HEIGHT);
          baseY.push(layerY + domeOffset);
          types.push(BlockType.CherryBlossom);
          blockCount++;
        }

        const extraCount = Math.floor(pseudoRandom(col, row, 500) * 4);
        for (let e = 0; e < extraCount; e++) {
          const extraLayer = layersHere + e;
          const domeOffset = Math.floor(t * 3) * CUBE_HEIGHT;

          positions.push(col, row, 0, 0);
          heights.push(CUBE_HEIGHT);
          baseY.push(canopyBaseHeight + extraLayer * CUBE_HEIGHT + domeOffset);
          types.push(BlockType.CherryBlossom);
          blockCount++;
        }
      }
    }
  }

  return {
    positions,
    heights,
    baseY,
    types,
    gridSize,
    numBlocks: blockCount,
  };
}
