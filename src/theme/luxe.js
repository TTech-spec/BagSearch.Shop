// Shared tokens for the redesigned product page and seller dashboard.
// Warm cream ground, near-black ink, burnt-orange brand accent.
export const T = {
  bg:          '#FAF6F1',
  surface:     '#FFFFFF',
  sand:        '#F2EAE1',
  photo:       '#EFE6DC',
  line:        '#E7DCD1',
  lineSoft:    '#EFE6DC',
  lineStrong:  '#D9CBBB',
  ink:         '#1C1410',
  ink2:        '#54443A',
  muted:       '#75625A',
  accent:      '#B4410E',
  accentHover: '#9A370B',
  accentInk:   '#8F330A',
  accentSoft:  '#F6E6DA',
  accentOnDark:'#F0A070',
  green:       '#1D7044',
  greenSoft:   '#E3F1E8',
  amberInk:    '#7A5200',
  amberSoft:   '#FBF0D9',
  amberLine:   '#D9A93A',
  redInk:      '#9B2C1A',
  redSoft:     '#FBE4DE',
  dark2:       '#2A201A',
  dark3:       '#3A2E26',
  onDarkMuted: '#BFAE9F',
  onDark:      '#EDE3D8',
};

export const FONT_SANS  = "'Manrope', system-ui, -apple-system, sans-serif";
export const FONT_SERIF = "'Cormorant Garamond', Georgia, serif";

export const EASE_OUT = [0.22, 1, 0.36, 1];

export const naira = (v) => `₦${Math.round(Number(v) || 0).toLocaleString()}`;

export const nairaShort = (v) => {
  const n = Number(v) || 0;
  if (n >= 1e6) return `₦${(n / 1e6).toFixed(n >= 1e7 ? 1 : 2).replace(/\.?0+$/, '')}M`;
  if (n >= 1e4) return `₦${Math.round(n / 1e3)}k`;
  return naira(n);
};
