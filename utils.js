// utils.js
function pickEventWeighted(events) {
  const total = events.reduce((s,e) => s + (e.prob || 0), 0);
  let r = Math.random() * total;
  for (const e of events) {
    if (r < (e.prob || 0)) return e;
    r -= (e.prob || 0);
  }
  return null;
}

function canPlace(board, x, y, w, h) {
  if (x < 0 || y < 0 || x + w > board[0].length || y + h > board.length) return false;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (board[y + j][x + i] !== 0) return false;
  return true;
}

function gridToIso(gridX, gridY, tileW = 64, tileH = 32) {
  const x = (gridX - gridY) * (tileW / 2);
  const y = (gridX + gridY) * (tileH / 2);
  return { x, y };
}

module.exports = { pickEventWeighted, canPlace, gridToIso };
