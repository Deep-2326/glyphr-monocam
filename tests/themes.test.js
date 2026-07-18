import assert from 'node:assert/strict';
import test from 'node:test';

import { THEMES, applyThemeClass, getTheme, nextTheme } from '../src/themes.js';

class FakeClassList {
  constructor(initial = []) {
    this.values = new Set(initial);
  }

  add(...classNames) {
    classNames.forEach((className) => this.values.add(className));
  }

  remove(...classNames) {
    classNames.forEach((className) => this.values.delete(className));
  }

  contains(className) {
    return this.values.has(className);
  }
}

test('getTheme falls back to the default dark theme', () => {
  assert.equal(getTheme('light').key, 'light');
  assert.equal(getTheme('missing').key, 'dark');
});

test('nextTheme cycles through each configured theme', () => {
  assert.equal(nextTheme('dark').key, 'light');
  assert.equal(nextTheme('light').key, 'black');
  assert.equal(nextTheme('black').key, 'dark');
});

test('applyThemeClass removes stale theme classes before applying the target', () => {
  const target = {
    classList: new FakeClassList(THEMES.map((theme) => theme.className))
  };

  const appliedTheme = applyThemeClass(target, 'light');

  assert.equal(appliedTheme.key, 'light');
  assert.equal(target.classList.contains('theme-light'), true);
  assert.equal(target.classList.contains('theme-dark'), false);
  assert.equal(target.classList.contains('theme-black'), false);
});
