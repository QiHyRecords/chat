/** @type {const} */
const themeColors = {
  primary: { light: '#1D5FD8', dark: '#AFC0FF' },
  onPrimary: { light: '#FFFFFF', dark: '#0B1738' },
  onError: { light: '#FFFFFF', dark: '#351018' },
  // Clay surfaces avoid pure black/white so their soft directional shadows stay visible.
  background: { light: '#E8EDF6', dark: '#0E1524' },
  surface: { light: '#F0F4FA', dark: '#162238' },
  elevated: { light: '#F6F8FC', dark: '#1C2A43' },
  foreground: { light: '#111827', dark: '#F8FAFF' },
  muted: { light: '#45556C', dark: '#C4D0E6' },
  subtle: { light: '#596B86', dark: '#A9B8D2' },
  border: { light: '#71839C', dark: '#7080A0' },
  accentSoft: { light: '#EAF0FF', dark: '#26375E' },
  success: { light: '#0F6B4B', dark: '#76E1B8' },
  warning: { light: '#8A4B00', dark: '#FFD08A' },
  error: { light: '#B4233B', dark: '#FFB4B8' },
  clayHighlight: { light: '#FFFFFF', dark: '#2B4063' },
  clayShadow: { light: '#AAB7CB', dark: '#050914' },
};

module.exports = { themeColors };
