export const THEMES = Object.freeze([
  Object.freeze({ key: 'dark', className: 'theme-dark', isDark: true, buttonLabel: 'DARK' }),
  Object.freeze({ key: 'light', className: 'theme-light', isDark: false, buttonLabel: 'LIGHT' }),
  Object.freeze({ key: 'black', className: 'theme-black', isDark: true, buttonLabel: 'BLACK' })
]);

export function getTheme(key) {
  return THEMES.find((theme) => theme.key === key) ?? THEMES[0];
}

export function nextTheme(currentKey) {
  const currentIndex = THEMES.findIndex((theme) => theme.key === currentKey);
  const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % THEMES.length;
  return THEMES[nextIndex];
}

export function applyThemeClass(element, themeKey) {
  const theme = getTheme(themeKey);
  THEMES.forEach((candidate) => {
    element.classList.remove(candidate.className);
  });
  element.classList.add(theme.className);
  return theme;
}
