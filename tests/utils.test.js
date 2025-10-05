const { canPlace, gridToIso, pickEventWeighted } = require('../utils');

test('canPlace valid', () => {
  const board = Array.from({length:4}, () => Array(4).fill(0));
  expect(canPlace(board, 0, 0, 2, 2)).toBe(true);
});

test('canPlace invalid out of bounds', () => {
  const board = Array.from({length:4}, () => Array(4).fill(0));
  expect(canPlace(board, 3, 3, 2, 2)).toBe(false);
});

test('gridToIso returns numbers', () => {
  const p = gridToIso(1,2,64,32);
  expect(typeof p.x).toBe('number');
  expect(typeof p.y).toBe('number');
});

test('pickEventWeighted returns null or event', () => {
  const events = [{prob:0},{prob:0}];
  const r = pickEventWeighted(events);
  expect(r === null || typeof r === 'object').toBe(true);
});
