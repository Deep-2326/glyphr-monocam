const DEFAULT_FONT = "'Share Tech Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

export const PALETTES = Object.freeze({
  extended: Object.freeze({
    chars: "                              .'`\"^,:;Il!i~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
    font: DEFAULT_FONT
  }),
  basic: Object.freeze({
    chars: ' .:-=+*#%@',
    font: DEFAULT_FONT
  }),
  blocks: Object.freeze({
    chars: ' ░▒▓█',
    font: DEFAULT_FONT
  }),
  matrix: Object.freeze({
    chars: '  .0123456789ABCDEF',
    font: DEFAULT_FONT
  }),
  sketch: Object.freeze({
    chars: '  .,-_~:;!|/\\',
    font: DEFAULT_FONT
  }),
  deep: Object.freeze({
    chars: '        ........:::::::::::::;;;;;;;;;;;;;;IIIIIIIIIIIIIII!l1+*#&%@$',
    font: DEFAULT_FONT
  })
});

export function getPalette(key) {
  return PALETTES[key] ?? PALETTES.extended;
}

export function sanitizeCustomPalette(input, fallbackChars = PALETTES.extended.chars) {
  if (typeof input !== 'string') {
    return fallbackChars;
  }

  return input.length > 0 ? input : fallbackChars;
}
