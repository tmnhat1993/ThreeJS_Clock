/**
 * Shape data: lưới 17×7 (0 và 1) cho đồng hồ điện tử HH:MM.
 * Mỗi số: 3 cột × 7 hàng. Khoảng cách 1 cột giữa mỗi ký tự. Dấu hai chấm có 1 cột trống hai bên.
 */

const sizeX = 17;
const sizeZ = 7;
const digitWidth = 3;
const digitHeight = 7;
const gapCols = 1;

function emptyGrid() {
  return Array.from({ length: sizeZ }, () => Array(sizeX).fill(0));
}

// Chữ số 0-9: mỗi số 3 cột × 7 hàng (pattern[row][col])
const digits = [
  [[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]], // 0
  [[0,1,0],[1,1,0],[0,1,0],[0,1,0],[0,1,0],[0,1,0],[1,1,1]], // 1
  [[1,1,1],[0,0,1],[0,0,1],[1,1,1],[1,0,0],[1,0,0],[1,1,1]], // 2
  [[1,1,1],[0,0,1],[0,0,1],[1,1,1],[0,0,1],[0,0,1],[1,1,1]], // 3
  [[1,0,1],[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1],[0,0,1]], // 4
  [[1,1,1],[1,0,0],[1,0,0],[1,1,1],[0,0,1],[0,0,1],[1,1,1]], // 5
  [[1,1,1],[1,0,0],[1,0,0],[1,1,1],[1,0,1],[1,0,1],[1,1,1]], // 6
  [[1,1,1],[0,0,1],[0,0,1],[0,0,1],[0,0,1],[0,0,1],[0,0,1]], // 7
  [[1,1,1],[1,0,1],[1,0,1],[1,1,1],[1,0,1],[1,0,1],[1,1,1]], // 8
  [[1,1,1],[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1],[1,1,1]], // 9
];

function drawDigit(grid, startCol, digit) {
  const pattern = digits[digit];
  for (let row = 0; row < digitHeight; row++) {
    for (let col = 0; col < digitWidth; col++) {
      if (pattern[row][col] === 1) {
        const iz = row;
        const ix = startCol + col;
        if (iz < sizeZ && ix < sizeX) grid[iz][ix] = 1;
      }
    }
  }
}

function drawColon(grid, startCol) {
  const dotTop = 2;
  const dotBottom = 5;
  if (startCol < sizeX) grid[dotTop][startCol] = 1;
  if (startCol < sizeX) grid[dotBottom][startCol] = 1;
}

/**
 * Layout 17 cột: d1(0-2) gap(3) d2(4-6) gap(7) colon(8) gap(9) d3(10-12) gap(13) d4(14-16)
 * 1 cột trống hai bên dấu hai chấm.
 */
export function getTimeGrid(hour, minute) {
  const grid = emptyGrid();
  const h10 = Math.floor(hour / 10);
  const h1 = hour % 10;
  const m10 = Math.floor(minute / 10);
  const m1 = minute % 10;
  drawDigit(grid, 0, h10);    // 0-2
  drawDigit(grid, 4, h1);    // 4-6 (gap 3)
  drawColon(grid, 8);        // 8 (gap 7, gap 9)
  drawDigit(grid, 10, m10);  // 10-12 (gap 9)
  drawDigit(grid, 14, m1);   // 14-16 (gap 13)
  return grid;
}

export const GRID_SIZE_X = sizeX;
export const GRID_SIZE_Z = sizeZ;
