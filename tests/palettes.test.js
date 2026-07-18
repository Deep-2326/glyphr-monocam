import assert from 'node:assert/strict';
import test from 'node:test';

import { PALETTES, getPalette, sanitizeCustomPalette } from '../src/palettes.js';

test('getPalette returns the requested palette and falls back to extended', () => {
  assert.equal(getPalette('blocks'), PALETTES.blocks);
  assert.equal(getPalette('not-a-palette'), PALETTES.extended);
});

test('all bundled palettes contain at least two brightness states', () => {
  for (const palette of Object.values(PALETTES)) {
    assert.ok(palette.chars.length >= 2);
    assert.ok(palette.font.length > 0);
  }
});

test('sanitizeCustomPalette preserves meaningful leading spaces', () => {
  const customPalette = '  .#';

  assert.equal(sanitizeCustomPalette(customPalette), customPalette);
  assert.equal(sanitizeCustomPalette(''), PALETTES.extended.chars);
  assert.equal(sanitizeCustomPalette(null, 'fallback'), 'fallback');
});
